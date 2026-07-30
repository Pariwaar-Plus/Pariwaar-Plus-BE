import nodemailer, { Transporter } from "nodemailer";

/* ─────────────────────────────────────────────
   Singleton transporter
   Created once, reused across all email calls
───────────────────────────────────────────── */

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT;

  if (!user || !pass) {
    throw new Error(
      "[Mailer] EMAIL_USER and EMAIL_PASS must be set in environment variables"
    );
  }

  // Use explicit SMTP config if provided (recommended for production)
  // Falls back to Gmail service for development
  if (host && port) {
    transporter = nodemailer.createTransport({
      host,
      port:   parseInt(port, 10),
      secure: parseInt(port, 10) === 465, // true for 465, false for 587
      auth:   { user, pass },
    });
  } else {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth:    { user, pass },
    });
  }

  return transporter;
}

/* ─────────────────────────────────────────────
   Shared layout wrapper
───────────────────────────────────────────── */

function emailLayout(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Remote Care</title>
    </head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0"
              style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">

              <!-- Header -->
              <tr>
                <td style="background:#059669;padding:28px 32px;">
                  <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                    Remote Care
                  </p>
                  <p style="margin:4px 0 0;font-size:13px;color:#a7f3d0;">
                    Caring for your loved ones, from anywhere
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:32px;">
                  ${content}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:20px 32px;border-top:1px solid #f1f5f9;background:#f8fafc;">
                  <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                    This email was sent by Remote Care. If you did not expect this email,
                    please ignore it or contact us at
                    <a href="mailto:${process.env.EMAIL_USER}"
                      style="color:#059669;text-decoration:none;">
                      ${process.env.EMAIL_USER}
                    </a>.
                  </p>
                  <p style="margin:8px 0 0;font-size:12px;color:#cbd5e1;">
                    © ${new Date().getFullYear()} Remote Care. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/* ─────────────────────────────────────────────
   Credential box (reused in multiple emails)
───────────────────────────────────────────── */

function credentialBox(email: string, password: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;
             margin:20px 0;padding:0;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;
                    color:#16a34a;text-transform:uppercase;letter-spacing:0.5px;">
            Your Login Credentials
          </p>
          <table cellpadding="0" cellspacing="0" style="margin-top:12px;width:100%;">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#475569;width:80px;">Email</td>
              <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;">
                ${email}
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#475569;">Password</td>
              <td style="padding:6px 0;">
                <code style="font-size:14px;font-weight:700;color:#059669;
                             background:#dcfce7;padding:2px 8px;border-radius:4px;
                             letter-spacing:1px;">
                  ${password}
                </code>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

/* ─────────────────────────────────────────────
   Email: Welcome — Client
───────────────────────────────────────────── */

export const sendClientWelcomeEmail = async (
  email: string,
  name: string,
  tempPassword: string
): Promise<void> => {
  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e293b;">
      Welcome, ${name} 👋
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Your Remote Care account has been created by our team. You can now log in
      to view your family member's health reports, visit history, and care updates.
    </p>

    ${credentialBox(email, tempPassword)}

    <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;
                padding:14px 18px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#854d0e;line-height:1.5;">
        ⚠️ <strong>Important:</strong> This is a temporary password.
        Please log in and change it immediately from your account settings.
      </p>
    </div>

    <a href="${process.env.CLIENT_APP_URL}/login"
      style="display:inline-block;background:#059669;color:#ffffff;
             font-size:14px;font-weight:600;padding:12px 28px;
             border-radius:8px;text-decoration:none;margin-bottom:24px;">
      Log In to Remote Care →
    </a>

    <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
      If you have any questions, our support team is here to help.<br/>
      Best regards,<br/>
      <strong style="color:#1e293b;">The Remote Care Team</strong>
    </p>
  `;

  await getTransporter().sendMail({
    from:    `"Remote Care" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: "Welcome to Remote Care — Your Account is Ready",
    html:    emailLayout(content),
  });
};

/* ─────────────────────────────────────────────
   Email: Welcome — Care Agent (Sahara Staff)
───────────────────────────────────────────── */

export const sendCareAgentWelcomeEmail = async (
  email: string,
  name: string,
  employeeId: string,
  tempPassword: string
): Promise<void> => {
  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e293b;">
      Welcome to the Team, ${name}! 🎉
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      You have been registered as a Sahara Care Agent. Your employee ID is
      <strong style="color:#059669;">${employeeId}</strong>.
      Use the credentials below to access your account.
    </p>

    ${credentialBox(email, tempPassword)}

    <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;
                padding:14px 18px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#854d0e;line-height:1.5;">
        ⚠️ <strong>Important:</strong> Please change your password after your first login.
      </p>
    </div>

    <a href="${process.env.CLIENT_APP_URL}/login"
      style="display:inline-block;background:#059669;color:#ffffff;
             font-size:14px;font-weight:600;padding:12px 28px;
             border-radius:8px;text-decoration:none;margin-bottom:24px;">
      Log In Now →
    </a>

    <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
      Welcome aboard,<br/>
      <strong style="color:#1e293b;">The Remote Care Team</strong>
    </p>
  `;

  await getTransporter().sendMail({
    from:    `"Remote Care" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: `Welcome to Remote Care — Employee ID: ${employeeId}`,
    html:    emailLayout(content),
  });
};

/* ─────────────────────────────────────────────
   Email: Password Reset
───────────────────────────────────────────── */

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetToken: string
): Promise<void> => {
  const resetUrl = `${process.env.CLIENT_APP_URL}/reset-password?token=${resetToken}`;

  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e293b;">
      Reset Your Password
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${name}, we received a request to reset your password.
      Click the button below to set a new one. This link expires in
      <strong>15 min</strong>.
    </p>

    <a href="${resetUrl}"
      style="display:inline-block;background:#059669;color:#ffffff;
             font-size:14px;font-weight:600;padding:12px 28px;
             border-radius:8px;text-decoration:none;margin-bottom:20px;">
      Reset Password →
    </a>

    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;
                padding:14px 18px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#b91c1c;line-height:1.5;">
        🔒 If you did not request this, please ignore this email.
        Your password will not change.
      </p>
    </div>

    <p style="margin:0;font-size:13px;color:#94a3b8;">
      If the button doesn't work, copy and paste this link:<br/>
      <a href="${resetUrl}" style="color:#059669;word-break:break-all;">${resetUrl}</a>
    </p>
  `;

  await getTransporter().sendMail({
    from:    `"Remote Care" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: "Reset Your Remote Care Password",
    html:    emailLayout(content),
  });
};

/* ─────────────────────────────────────────────
   Verify transporter connection
   Call this on app startup to catch misconfig early
───────────────────────────────────────────── */

export const verifyMailerConnection = async (): Promise<void> => {
  try {
    await getTransporter().verify();
    console.log("[Mailer] ✅ SMTP connection verified");
  } catch (err) {
    console.error("[Mailer] ❌ SMTP connection failed:", err);
    // Don't crash the app — email is non-critical
  }
};