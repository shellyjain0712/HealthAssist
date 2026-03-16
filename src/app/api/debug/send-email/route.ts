import { sendAppointmentConfirmationEmail } from "@/lib/email";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      patientEmail,
      patientName,
      doctorName,
      doctorSpecialty,
      appointmentDate,
      appointmentTime,
      appointmentReason,
      consultationFee,
    } = body;

    if (!patientEmail || !patientName || !doctorName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    console.log("🔄 [DEBUG] Sending test email...");
    console.log("📧 To:", patientEmail);
    console.log("👤 Patient:", patientName);
    console.log("🩺 Doctor:", doctorName);

    await sendAppointmentConfirmationEmail(
      patientEmail,
      patientName,
      doctorName,
      doctorSpecialty || "General Physician",
      appointmentDate,
      appointmentTime,
      appointmentReason,
      consultationFee || 500,
    );

    console.log("✅ [DEBUG] Email sent successfully!");

    return NextResponse.json(
      { message: "Test email sent successfully", email: patientEmail },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ [DEBUG] Email sending failed:", error);
    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
