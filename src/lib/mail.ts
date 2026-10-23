import nodemailer, { type SendMailOptions, type Transporter } from "nodemailer";

/**
 * Outgoing mail over SMTP (QQ / 163 mail with an authorization code).
 *
 *   SMTP_HOST=smtp.qq.com  SMTP_PORT=465  SMTP_USER=...@qq.com
 *   SMTP_PASS=<authorization code, not the mailbox password>
 *   MAIL_FROM="ReCode <...@qq.com>"   (optional, defaults to SMTP_USER)
 *
 * Without SMTP_HOST the message is printed to the server console instead, so
 * the flows can be exercised locally.
 */

let transporter: Transporter | null = null;

const getTransporter = () => {
  if (!process.env.SMTP_HOST) return null;

  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 465;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      // 465 is implicit TLS; 587 upgrades with STARTTLS
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
};

export const sendMail = async ({
  to,
  subject,
  text,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  // Always sent too, for clients that do not render HTML
  text: string;
  html?: string;
  attachments?: SendMailOptions["attachments"];
}) => {
  const transport = getTransporter();

  if (!transport) {
    console.log(`[mail:dev] to=${to} subject=${subject}\n${text}`);
    return;
  }

  await transport.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
    attachments,
  });
};
