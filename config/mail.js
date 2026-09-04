const EMAIL_BRIDGE_URL = process.env.EMAIL_BRIDGE_URL;
const EMAIL_BRIDGE_SECRET = process.env.EMAIL_BRIDGE_SECRET;

export const sendEmail = async ({ to, subject, html }) => {
  if (!EMAIL_BRIDGE_URL) {
    throw new Error("EMAIL_BRIDGE_URL is not configured");
  }

  if (!EMAIL_BRIDGE_SECRET) {
    throw new Error("EMAIL_BRIDGE_SECRET is not configured");
  }

  const response = await fetch(EMAIL_BRIDGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to,
      subject,
      html,
      secret: EMAIL_BRIDGE_SECRET,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || "Email could not be sent"
    );
  }

  return data;
};

export default sendEmail;