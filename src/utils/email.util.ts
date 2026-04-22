import nodemailer from "nodemailer";

export const sendWelcomeEmail = async (email: string, name: string, password: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // Or your preferred SMTP provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Remote Care Admin" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Welcome to Remote Care - Your Account Details",
    html: `
      <h1>Hello, ${name}</h1>
      <p>Your family account has been successfully created by our operations team.</p>
      <p>You can now log in to view your parent's health reports and visit history.</p>
      <hr />
      <p><strong>Login Email:</strong> ${email}</p>
      <p><strong>Temporary Password:</strong> ${password}</p>
      <hr />
      <p>Please log in and change your password immediately for security.</p>
      <p>Best regards,<br/>The Remote Care Team</p>
    `,
  };

  return transporter.sendMail(mailOptions);
};