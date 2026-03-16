import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Smart Health Companion" <${
      process.env.SMTP_FROM || process.env.SMTP_USER
    }>`,
    to: email,
    subject: "Reset Your Password - Smart Health Companion",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); border-radius: 12px 12px 0 0;">
                      <div style="display: inline-block; padding: 12px; background-color: rgba(255,255,255,0.2); border-radius: 12px; margin-bottom: 16px;">
                        <span style="font-size: 32px;">💚</span>
                      </div>
                      <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 600;">Smart Health Companion</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #1f2937; font-size: 22px; margin: 0 0 16px; font-weight: 600;">Reset Your Password</h2>
                      <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
                        We received a request to reset the password for your account. Click the button below to create a new password.
                      </p>
                      
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #6b7280; font-size: 14px; line-height: 22px; margin: 24px 0 0; padding: 16px; background-color: #f9fafb; border-radius: 8px;">
                        <strong>⏰ This link expires in 1 hour.</strong><br>
                        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                      </p>
                      
                      <p style="color: #9ca3af; font-size: 12px; line-height: 20px; margin: 24px 0 0;">
                        If the button doesn't work, copy and paste this link into your browser:<br>
                        <a href="${resetUrl}" style="color: #059669; word-break: break-all;">${resetUrl}</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        © 2025 Smart Health Companion. All rights reserved.<br>
                        This is an automated email, please do not reply.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `
Reset Your Password

We received a request to reset the password for your account.

Click this link to reset your password: ${resetUrl}

This link expires in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

© 2025 Smart Health Companion
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendAppointmentConfirmationEmail(
  patientEmail: string,
  patientName: string,
  doctorName: string,
  doctorSpecialty: string,
  appointmentDate: string,
  appointmentTime: string,
  appointmentReason: string | null,
  consultationFee: number,
) {
  console.log("\n📧 [EMAIL SERVICE] Preparing confirmation email");
  console.log(`   To: ${patientEmail}`);
  console.log(`   Patient: ${patientName}`);

  const date = new Date(appointmentDate);
  const formattedDate = date.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const mailOptions = {
    from: `"Smart Health Companion" <${
      process.env.SMTP_FROM || process.env.SMTP_USER
    }>`,
    to: patientEmail,
    subject: "Appointment Confirmed - Smart Health Companion",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Appointment Confirmed</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); border-radius: 12px 12px 0 0;">
                      <div style="display: inline-block; padding: 12px; background-color: rgba(255,255,255,0.2); border-radius: 12px; margin-bottom: 16px;">
                        <span style="font-size: 32px;">✅</span>
                      </div>
                      <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 600;">Appointment Confirmed!</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
                        Dear ${patientName},
                      </p>
                      
                      <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
                        Great news! Your appointment with ${doctorName} has been confirmed.
                      </p>
                      
                      <!-- Appointment Details Card -->
                      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 24px 0;">
                        <tr>
                          <td style="padding: 24px; background-color: #f0fdf4; border-radius: 8px; border-left: 4px solid #059669;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #dcfce7;">
                                  <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; font-weight: 600;">Date & Time</p>
                                  <p style="color: #1f2937; font-size: 16px; margin: 0; font-weight: 600;">${formattedDate} at ${appointmentTime}</p>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #dcfce7;">
                                  <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; font-weight: 600;">Doctor</p>
                                  <p style="color: #1f2937; font-size: 16px; margin: 0; font-weight: 600;">${doctorName}</p>
                                  <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0;">${doctorSpecialty}</p>
                                </td>
                              </tr>
                              ${
                                appointmentReason
                                  ? `
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #dcfce7;">
                                  <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; font-weight: 600;">Reason for Visit</p>
                                  <p style="color: #1f2937; font-size: 16px; margin: 0;">${appointmentReason}</p>
                                </td>
                              </tr>
                              `
                                  : ""
                              }
                              <tr>
                                <td style="padding: 12px 0;">
                                  <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; font-weight: 600;">Consultation Fee</p>
                                  <p style="color: #059669; font-size: 18px; margin: 0; font-weight: 600;">₹${consultationFee}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Instructions -->
                      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
                        <p style="color: #92400e; font-size: 14px; margin: 0 0 8px; font-weight: 600;">📋 What's Next?</p>
                        <ul style="color: #92400e; font-size: 14px; line-height: 22px; margin: 8px 0 0 16px; padding: 0;">
                          <li style="margin-bottom: 8px;">Check in 5-10 minutes before your scheduled time</li>
                          <li style="margin-bottom: 8px;">Bring any recent medical reports or test results</li>
                          <li style="margin-bottom: 8px;">Have your ID and health insurance details ready</li>
                          <li>If you need to reschedule, contact us as soon as possible</li>
                        </ul>
                      </div>
                      
                      <p style="color: #6b7280; font-size: 14px; line-height: 22px; margin: 24px 0 0;">
                        If you have any questions or need to cancel/reschedule, please reply to this email or contact us on our app.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        © 2025 Smart Health Companion. All rights reserved.<br>
                        This is an automated email, please do not reply directly to this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `
Appointment Confirmed!

Dear ${patientName},

Great news! Your appointment with ${doctorName} has been confirmed.

Appointment Details:
Date & Time: ${formattedDate} at ${appointmentTime}
Doctor: ${doctorName} (${doctorSpecialty})
${appointmentReason ? `Reason for Visit: ${appointmentReason}` : ""}
Consultation Fee: ₹${consultationFee}

What's Next?
- Check in 5-10 minutes before your scheduled time
- Bring any recent medical reports or test results
- Have your ID and health insurance details ready
- If you need to reschedule, contact us as soon as possible

If you have any questions or need to cancel/reschedule, please reply to this email or contact us on our app.

© 2025 Smart Health Companion
    `,
  };

  try {
    console.log(`   📤 Sending email via SMTP...`);
    console.log(`   📧 From: ${mailOptions.from}`);
    console.log(`   📮 SMTP Host: ${process.env.SMTP_HOST}`);

    const result = await transporter.sendMail(mailOptions);

    console.log(`   ✅ Email sent successfully!`);
    console.log(`   📬 Message ID: ${result.messageId}`);
    console.log(`\n`);

    return result;
  } catch (error) {
    console.error(`   ❌ FAILED to send email to ${patientEmail}`);
    console.error(
      `   Error:`,
      error instanceof Error ? error.message : String(error),
    );
    console.error(`\n`);
    throw error;
  }
}

export async function sendAppointmentCancellationEmail(
  patientEmail: string,
  patientName: string,
  doctorName: string,
  doctorSpecialty: string,
  appointmentDate: string,
  appointmentTime: string,
  appointmentReason: string | null,
  consultationFee: number,
) {
  console.log("\n📧 [EMAIL SERVICE] Preparing cancellation email");
  console.log(`   To: ${patientEmail}`);
  console.log(`   Patient: ${patientName}`);

  const date = new Date(appointmentDate);
  const formattedDate = date.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const mailOptions = {
    from: `"Smart Health Companion" <${
      process.env.SMTP_FROM || process.env.SMTP_USER
    }>`,
    to: patientEmail,
    subject: "Appointment Cancelled - Smart Health Companion",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Appointment Cancelled</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border-radius: 12px 12px 0 0;">
                      <div style="display: inline-block; padding: 12px; background-color: rgba(255,255,255,0.2); border-radius: 12px; margin-bottom: 16px;">
                        <span style="font-size: 32px;">❌</span>
                      </div>
                      <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 600;">Appointment Cancelled</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
                        Dear ${patientName},
                      </p>
                      
                      <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
                        Your appointment with ${doctorName} has been cancelled.
                      </p>
                      
                      <!-- Appointment Details Card -->
                      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 24px 0;">
                        <tr>
                          <td style="padding: 24px; background-color: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #fee2e2;">
                                  <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; font-weight: 600;">Date & Time</p>
                                  <p style="color: #1f2937; font-size: 16px; margin: 0; font-weight: 600;">${formattedDate} at ${appointmentTime}</p>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #fee2e2;">
                                  <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; font-weight: 600;">Doctor</p>
                                  <p style="color: #1f2937; font-size: 16px; margin: 0; font-weight: 600;">${doctorName}</p>
                                  <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0;">${doctorSpecialty}</p>
                                </td>
                              </tr>
                              ${
                                appointmentReason
                                  ? `
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #fee2e2;">
                                  <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; font-weight: 600;">Reason for Visit</p>
                                  <p style="color: #1f2937; font-size: 16px; margin: 0;">${appointmentReason}</p>
                                </td>
                              </tr>
                              `
                                  : ""
                              }
                              <tr>
                                <td style="padding: 12px 0;">
                                  <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; font-weight: 600;">Consultation Fee</p>
                                  <p style="color: #059669; font-size: 18px; margin: 0; font-weight: 600;">₹${consultationFee}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Action Required -->
                      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
                        <p style="color: #92400e; font-size: 14px; margin: 0 0 8px; font-weight: 600;">📅 What You Can Do?</p>
                        <ul style="color: #92400e; font-size: 14px; line-height: 22px; margin: 8px 0 0 16px; padding: 0;">
                          <li style="margin-bottom: 8px;">Book a new appointment with the same or a different doctor</li>
                          <li style="margin-bottom: 8px;">Contact the clinic directly for alternate appointment times</li>
                          <li>If you have any questions, reach out to us on our app</li>
                        </ul>
                      </div>
                      
                      <p style="color: #6b7280; font-size: 14px; line-height: 22px; margin: 24px 0 0;">
                        We hope to see you back soon. If you would like to reschedule, visit our app and book a new appointment.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        © 2025 Smart Health Companion. All rights reserved.<br>
                        This is an automated email, please do not reply directly to this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `
Appointment Cancelled

Dear ${patientName},

Your appointment with ${doctorName} has been cancelled.

Appointment Details:
Date & Time: ${formattedDate} at ${appointmentTime}
Doctor: ${doctorName} (${doctorSpecialty})
${appointmentReason ? `Reason for Visit: ${appointmentReason}` : ""}
Consultation Fee: ₹${consultationFee}

What You Can Do?
- Book a new appointment with the same or a different doctor
- Contact the clinic directly for alternate appointment times
- If you have any questions, reach out to us on our app

We hope to see you back soon. If you would like to reschedule, visit our app and book a new appointment.

© 2025 Smart Health Companion
    `,
  };

  try {
    console.log(`   📤 Sending email via SMTP...`);
    console.log(`   📧 From: ${mailOptions.from}`);
    console.log(`   📮 SMTP Host: ${process.env.SMTP_HOST}`);

    const result = await transporter.sendMail(mailOptions);

    console.log(`   ✅ Email sent successfully!`);
    console.log(`   📬 Message ID: ${result.messageId}`);
    console.log(`\n`);

    return result;
  } catch (error) {
    console.error(`   ❌ FAILED to send email to ${patientEmail}`);
    console.error(
      `   Error:`,
      error instanceof Error ? error.message : String(error),
    );
    console.error(`\n`);
    throw error;
  }
}
