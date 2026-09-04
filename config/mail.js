import nodemailer from "nodemailer";

const emailPort = Number(process.env.EMAIL_PORT) || 587;

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
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
};

export default transporter;

// import nodemailer from "nodemailer";

// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: Number(process.env.EMAIL_PORT) || 587,
//   secure: Number(process.env.EMAIL_PORT) === 465,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });

// export const sendEmail = async ({to, subject, html}) => {
//   const mailOptions = {
//     from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
//     to,
//     subject,
//     html,
//   };

//   return transporter.sendMail(mailOptions);
// };

// export default transporter;