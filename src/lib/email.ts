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
