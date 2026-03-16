// Helper function to format date as YYYY-MM-DD string
function formatAppointmentDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// PATCH - Update appointment status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
    if (status && !validStatuses.includes(status.toUpperCase())) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({ where: { id } });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    // Check authorization
    if (
      appointment.patientId !== session.user.id &&
      appointment.doctorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Patients can only cancel
    if (
      session.user.role !== "DOCTOR" &&
      status &&
      status.toUpperCase() !== "CANCELLED"
    ) {
      return NextResponse.json(
        { error: "Patients can only cancel appointments" },
        { status: 403 },
      );
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(status && { status: status.toUpperCase() }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        patient: {
          include: { profile: true },
        },
        doctor: {
          include: { profile: true },
        },
      },
    });

    // Send confirmation email if status changed to CONFIRMED
    if (status && status.toUpperCase() === "CONFIRMED") {
      console.log("\n📧 ====== APPOINTMENT CONFIRMATION EMAIL ======");
      console.log(`Appointment ID: ${updatedAppointment.id}`);
      console.log(`Patient Email: ${updatedAppointment.patient.email}`);
      console.log(
        `Patient Name: ${updatedAppointment.patient.profile?.firstName} ${updatedAppointment.patient.profile?.lastName}`,
      );
      console.log(
        `Doctor: Dr. ${updatedAppointment.doctor.profile?.firstName} ${updatedAppointment.doctor.profile?.lastName}`,
      );
      console.log(`Date: ${updatedAppointment.date}`);
      console.log(`Time: ${updatedAppointment.time}`);

      if (!updatedAppointment.patient.email) {
        console.warn("⚠️ Patient has no email address! Email not sent.");
      } else {
        try {
          console.log("🔄 Sending confirmation email...");
          const appointmentDateStr = formatAppointmentDate(
            updatedAppointment.date,
          );
          await sendAppointmentConfirmationEmail(
            updatedAppointment.patient.email,
            `${updatedAppointment.patient.profile?.firstName || ""} ${updatedAppointment.patient.profile?.lastName || ""}`.trim(),
            `Dr. ${updatedAppointment.doctor.profile?.firstName || ""} ${updatedAppointment.doctor.profile?.lastName || ""}`.trim(),
            updatedAppointment.doctor.profile?.specialization ||
              "General Physician",
            appointmentDateStr,
            updatedAppointment.time,
            updatedAppointment.reason,
            updatedAppointment.fee,
          );
          console.log(
            `✅ Confirmation email sent successfully to ${updatedAppointment.patient.email}`,
          );
        } catch (emailError) {
          console.error("❌ Failed to send confirmation email:", emailError);
          if (emailError instanceof Error) {
            console.error("Error details:", emailError.message);
            console.error("Stack:", emailError.stack);
          }
          // Don't fail the appointment update if email fails
        }
      }
      console.log("==========================================\n");
    }

    // Send cancellation email if status changed to CANCELLED
    if (status && status.toUpperCase() === "CANCELLED") {
      console.log("\n📧 ====== APPOINTMENT CANCELLATION EMAIL ======");
      console.log(`Appointment ID: ${updatedAppointment.id}`);
      console.log(`Patient Email: ${updatedAppointment.patient.email}`);
      console.log(
        `Patient Name: ${updatedAppointment.patient.profile?.firstName} ${updatedAppointment.patient.profile?.lastName}`,
      );
      console.log(
        `Doctor: Dr. ${updatedAppointment.doctor.profile?.firstName} ${updatedAppointment.doctor.profile?.lastName}`,
      );
      console.log(`Date: ${updatedAppointment.date}`);
      console.log(`Time: ${updatedAppointment.time}`);

      if (!updatedAppointment.patient.email) {
        console.warn("⚠️ Patient has no email address! Email not sent.");
      } else {
        try {
          console.log("🔄 Sending cancellation email...");
          const appointmentDateStr = formatAppointmentDate(
            updatedAppointment.date,
          );
          await sendAppointmentCancellationEmail(
            updatedAppointment.patient.email,
            `${updatedAppointment.patient.profile?.firstName || ""} ${updatedAppointment.patient.profile?.lastName || ""}`.trim(),
            `Dr. ${updatedAppointment.doctor.profile?.firstName || ""} ${updatedAppointment.doctor.profile?.lastName || ""}`.trim(),
            updatedAppointment.doctor.profile?.specialization ||
              "General Physician",
            appointmentDateStr,
            updatedAppointment.time,
            updatedAppointment.reason,
            updatedAppointment.fee,
          );
          console.log(
            `✅ Cancellation email sent successfully to ${updatedAppointment.patient.email}`,
          );
        } catch (emailError) {
          console.error("❌ Failed to send cancellation email:", emailError);
          if (emailError instanceof Error) {
            console.error("Error details:", emailError.message);
            console.error("Stack:", emailError.stack);
          }
          // Don't fail the appointment update if email fails
        }
      }
      console.log("==========================================\n");
    }

    return NextResponse.json(
      {
        message: "Appointment updated successfully",
        appointment: {
          id: updatedAppointment.id,
          status: updatedAppointment.status.toLowerCase(),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 },
    );
  }
}

// DELETE - Cancel an appointment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const appointment = await prisma.appointment.findUnique({ where: { id } });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    if (
      appointment.patientId !== session.user.id &&
      appointment.doctorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: {
        patient: {
          include: { profile: true },
        },
        doctor: {
          include: { profile: true },
        },
      },
    });

    // Send cancellation email if doctor cancelled
    if (session.user.role === "DOCTOR") {
      console.log("\n📧 ====== APPOINTMENT CANCELLATION EMAIL ======");
      console.log(`Appointment ID: ${updatedAppointment.id}`);
      console.log(`Patient Email: ${updatedAppointment.patient.email}`);
      console.log(
        `Patient Name: ${updatedAppointment.patient.profile?.firstName} ${updatedAppointment.patient.profile?.lastName}`,
      );
      console.log(
        `Doctor: Dr. ${updatedAppointment.doctor.profile?.firstName} ${updatedAppointment.doctor.profile?.lastName}`,
      );
      console.log(`Date: ${updatedAppointment.date}`);
      console.log(`Time: ${updatedAppointment.time}`);

      if (!updatedAppointment.patient.email) {
        console.warn("⚠️ Patient has no email address! Email not sent.");
      } else {
        try {
          console.log("🔄 Sending cancellation email...");
          const appointmentDateStr = formatAppointmentDate(
            updatedAppointment.date,
          );
          await sendAppointmentCancellationEmail(
            updatedAppointment.patient.email,
            `${updatedAppointment.patient.profile?.firstName || ""} ${updatedAppointment.patient.profile?.lastName || ""}`.trim(),
            `Dr. ${updatedAppointment.doctor.profile?.firstName || ""} ${updatedAppointment.doctor.profile?.lastName || ""}`.trim(),
            updatedAppointment.doctor.profile?.specialization ||
              "General Physician",
            appointmentDateStr,
            updatedAppointment.time,
            updatedAppointment.reason,
            updatedAppointment.fee,
          );
          console.log(
            `✅ Cancellation email sent successfully to ${updatedAppointment.patient.email}`,
          );
        } catch (emailError) {
          console.error("❌ Failed to send cancellation email:", emailError);
          if (emailError instanceof Error) {
            console.error("Error details:", emailError.message);
            console.error("Stack:", emailError.stack);
          }
          // Don't fail the appointment update if email fails
        }
      }
      console.log("==========================================\n");
    }

    return NextResponse.json(
      { message: "Appointment cancelled" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      { error: "Failed to cancel appointment" },
      { status: 500 },
    );
  }
}
