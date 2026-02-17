import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validations/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    console.log("Profile API - Session:", JSON.stringify(session, null, 2));

    if (!session?.user?.id) {
      console.log("Profile API - No user id in session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Profile API - Looking up user:", session.user.id);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
      },
    });

    console.log("Profile API - User found:", user ? "yes" : "no");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    console.log("PUT Profile - Session:", JSON.stringify(session, null, 2));

    if (!session?.user?.id) {
      console.log("PUT Profile - No user id in session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("PUT Profile - Body:", JSON.stringify(body, null, 2));

    const validatedData = updateProfileSchema.parse(body);
    console.log(
      "PUT Profile - Validated data:",
      JSON.stringify(validatedData, null, 2),
    );

    // Check if profile exists first
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    let updatedProfile;

    if (existingProfile) {
      // Update existing profile
      updatedProfile = await prisma.profile.update({
        where: { userId: session.user.id },
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phone: validatedData.phone,
          dateOfBirth: validatedData.dateOfBirth
            ? new Date(validatedData.dateOfBirth)
            : undefined,
          gender: validatedData.gender,
          address: validatedData.address,
          city: validatedData.city,
          state: validatedData.state,
          zipCode: validatedData.zipCode,
          country: validatedData.country,
          bloodGroup: validatedData.bloodGroup,
          allergies: validatedData.allergies,
          emergencyContact: validatedData.emergencyContact,
          specialization: validatedData.specialization,
          licenseNumber: validatedData.licenseNumber,
          experience: validatedData.experience,
          education: validatedData.education,
          bio: validatedData.bio,
          consultationFee: validatedData.consultationFee,
        },
      });
    } else {
      // Create new profile if it doesn't exist
      updatedProfile = await prisma.profile.create({
        data: {
          userId: session.user.id,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phone: validatedData.phone,
          dateOfBirth: validatedData.dateOfBirth
            ? new Date(validatedData.dateOfBirth)
            : undefined,
          gender: validatedData.gender,
          address: validatedData.address,
          city: validatedData.city,
          state: validatedData.state,
          zipCode: validatedData.zipCode,
          country: validatedData.country,
          bloodGroup: validatedData.bloodGroup,
          allergies: validatedData.allergies,
          emergencyContact: validatedData.emergencyContact,
          specialization: validatedData.specialization,
          licenseNumber: validatedData.licenseNumber,
          experience: validatedData.experience,
          education: validatedData.education,
          bio: validatedData.bio,
          consultationFee: validatedData.consultationFee,
        },
      });
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error: any) {
    console.error("Update profile error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 },
    );
  }
}
