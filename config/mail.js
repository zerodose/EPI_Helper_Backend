import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

console.log("RESEND CONFIG:", {
  apiKeyExists: !!process.env.RESEND_API_KEY,
  fromEmail: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log("SENDING EMAIL TO:", to);

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("RESEND EMAIL ERROR:", error);
      throw new Error(error.message || "Email could not be sent");
    }

    console.log("EMAIL SENT:", data);

    return data;
  } catch (error) {
    console.error("SEND EMAIL ERROR:", {
      message: error.message,
      code: error.code,
    });

    throw error;
  }
};

export default resend;