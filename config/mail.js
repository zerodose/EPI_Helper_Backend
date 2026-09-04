import nodemailer from "nodemailer";

const emailPort = Number(process.env.EMAIL_PORT) || 465;

console.log("EMAIL CONFIG:", {
  host: process.env.EMAIL_HOST,
  port: emailPort,
  secure: emailPort === 465,
  userExists: !!process.env.EMAIL_USER,
  passwordExists: !!process.env.EMAIL_PASSWORD,
  from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
});

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: emailPort,
  secure: emailPort === 465,
  family: 4,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },

  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
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
    console.error("SEND EMAIL ERROR:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });

    throw error;
  }
};

export default transporter;
