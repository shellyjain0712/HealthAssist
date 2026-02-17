import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Log environment for debugging
    console.log("[REGISTER] DATABASE_URL set:", !!process.env.DATABASE_URL);
    console.log("[REGISTER] NODE_ENV:", process.env.NODE_ENV);

    const body = await req.json();
    console.log("[REGISTER] Request body received");

    // Validate input
    const validatedData = registerSchema.parse(body);
    console.log("[REGISTER] Validation passed");

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    console.log("[REGISTER] Password hashed");

    // Create user with profile
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        profile: {
          create: {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            phone: validatedData.phone || null,
            specialization: validatedData.specialization || null,
            licenseNumber: validatedData.licenseNumber || null,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    console.log("[REGISTER] User created successfully");

    // Remove password from response
    const { password: _password, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: userWithoutPassword,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("[REGISTER] Error:", error);
    console.error("[REGISTER] Error message:", error.message);
    console.error("[REGISTER] Error code:", error.code);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 },
      );
    }

    // Return a more helpful error message
    const errorMessage =
      error.message || "An error occurred during registration";

    return NextResponse.json(
      { error: "Registration failed", details: errorMessage },
      { status: 500 },
    );
  }
}
