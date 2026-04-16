import nodemailer from "nodemailer";

let transporter;

const createTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        : undefined
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    jsonTransport: true
  });
  return transporter;
};

export const sendMail = async ({ to, subject, html, text }) => {
  const client = await createTransporter();
  const info = await client.sendMail({
    from: process.env.MAIL_FROM || "noreply@sres.local",
    to,
    subject,
    html,
    text
  });

  return {
    messageId: info.messageId,
    preview: typeof info.message === "string" ? info.message : ""
  };
};
