import nodemailer from "nodemailer";

const emailPort = Number(process.env.EMAIL_PORT) || 587;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: emailPort,

  // Gmail SMTP:
  // 587 = STARTTLS
  // 465 = SSL
  secure: emailPort === 465,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },

  // Prefer IPv4 on hosting platforms such as Render
  family: 4,

  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
});

console.log("EMAIL CONFIG:", {
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: emailPort,
  secure: emailPort === 465,
  userExists: !!process.env.EMAIL_USER,
  passwordExists: !!process.env.EMAIL_PASSWORD,
  from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
});

// Check SMTP connection when the server starts
transporter.verify((error) => {
  if (error) {
    console.error("SMTP VERIFY ERROR:", error);
  } else {
    console.log("SMTP READY");
  }
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log("SENDING EMAIL TO:", to);

    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
    });

    console.log("EMAIL SENT:", {
      messageId: result.messageId,
      response: result.response,
    });

    return result;
  } catch (error) {
    console.error("SEND EMAIL ERROR:", error);
    throw error;
  }
};

export default transporter;