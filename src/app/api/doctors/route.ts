import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get("specialty");
    const search = searchParams.get("search");

    // Build the where clause - only filter by role DOCTOR
    const where: any = {
      role: "DOCTOR",
    };

    // Add specialty filter if provided (using partial match)
    if (specialty && specialty !== "all") {
      where.profile = {
        specialization: {
          contains: specialty,
          mode: "insensitive",
        },
      };
    }

    // Add search filter if provided
    if (search) {
      where.OR = [
        {
          profile: {
            firstName: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          profile: {
            lastName: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          profile: {
            specialization: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    console.log(
      "Fetching doctors with where clause:",
      JSON.stringify(where, null, 2),
    );

    const doctors = await prisma.user.findMany({
      where,
      include: {
        profile: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Found ${doctors.length} doctors`);
    doctors.forEach((d: any) => {
      console.log(
        `- ${d.email}: role=${d.role}, specialization=${d.profile?.specialization}`,
      );
    });

    // Transform the data for the frontend
    const formattedDoctors = doctors.map((doctor: any) => ({
      id: doctor.id,
      name: `Dr. ${doctor.profile?.firstName || ""} ${
        doctor.profile?.lastName || ""
      }`.trim(),
      email: doctor.email,
      specialty: doctor.profile?.specialization?.toLowerCase() || "general",
      specialtyName: doctor.profile?.specialization || "General Physician",
      experience: doctor.profile?.experience
        ? `${doctor.profile.experience} years`
        : "N/A",
      education: doctor.profile?.education || "",
      bio: doctor.profile?.bio || "",
      fee: doctor.profile?.consultationFee || 500,
      phone: doctor.profile?.phone || "",
      city: doctor.profile?.city || "",
      profileImage: doctor.profile?.profileImage || null,
      available: true,
    }));

    // Get unique specialties from all doctors for the specialty filter
    const allDoctors = await prisma.user.findMany({
      where: { role: "DOCTOR" },
      include: { profile: true },
    });

    const specialtyIconMap: Record<string, string> = {
      cardiology: "❤️",
      cardiologist: "❤️",
      dermatology: "🩹",
      dermatologist: "🩹",
      orthopedic: "🦴",
      orthopedist: "🦴",
      neurology: "🧠",
      neurologist: "🧠",
      pediatrics: "👶",
      pediatrician: "👶",
      "general physician": "👨‍⚕️",
      general: "👨‍⚕️",
      "ent specialist": "👂",
      ent: "👂",
      ophthalmology: "👁️",
      ophthalmologist: "👁️",
      psychiatry: "🧠",
      psychiatrist: "🧠",
      dentistry: "🦷",
      dentist: "🦷",
      pulmonology: "🫁",
      pulmonologist: "🫁",
      gastroenterology: "🏥",
      gastroenterologist: "🏥",
      urology: "💊",
      urologist: "💊",
      oncology: "🎗️",
      oncologist: "🎗️",
      endocrinology: "💉",
      endocrinologist: "💉",
      rheumatology: "🦵",
      rheumatologist: "🦵",
    };

    const specializations: string[] = allDoctors
      .map((d: any) => d.profile?.specialization)
      .filter((s: any): s is string => !!s);

    const uniqueSpecialties = [...new Set<string>(specializations)].map(
      (spec: string) => ({
        id: spec.toLowerCase().replace(/\s+/g, "-"),
        name: spec,
        icon: specialtyIconMap[spec.toLowerCase()] || "🏥",
        doctorCount: allDoctors.filter(
          (d: any) => d.profile?.specialization === spec,
        ).length,
      }),
    );

    return NextResponse.json(
      {
        doctors: formattedDoctors,
        specialties: uniqueSpecialties,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctors" },
      { status: 500 },
    );
  }
}
