import { BANNER_JPEG_BASE64 } from "@/lib/mail/banner";

export type CodeMailPurpose = "REGISTER" | "BIND" | "RESET";

// Inline attachment the HTML refers to as cid:recode-banner, so mail clients
// show it without "load remote images"
export const BANNER_CID = "recode-banner";

export const bannerAttachment = () => ({
  filename: "recode.jpg",
  content: Buffer.from(BANNER_JPEG_BASE64, "base64"),
  contentType: "image/jpeg",
  cid: BANNER_CID,
});

const COPY: Record<
  CodeMailPurpose,
  { title: string; action: string; notYou: string }
> = {
  REGISTER: {
    title: "完成注册",
    action: "你正在注册 ReCode 账号，请在注册页面输入下面的验证码：",
    notYou: "如果这不是你本人的操作，忽略这封邮件即可，不会创建任何账号。",
  },
  BIND: {
    title: "绑定邮箱",
    action: "你正在把这个邮箱绑定到 ReCode 账号，请在账号安全页面输入下面的验证码：",
    notYou: "如果这不是你本人的操作，忽略这封邮件即可，这个邮箱不会被绑定。",
  },
  RESET: {
    title: "重置密码",
    action: "你正在重置 ReCode 账号的密码，请在找回密码页面输入下面的验证码：",
    notYou:
      "如果这不是你本人的操作，忽略这封邮件即可，你的密码不会被修改。若频繁收到此类邮件，建议登录后修改密码。",
  },
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const formatTime = (date: Date) =>
  new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

/**
 * Subject, plain text and HTML for a verification code mail. The code leads
 * the subject so it shows in phone notifications without opening the mail.
 * The HTML is table-based with inline styles, which is what Gmail, QQ Mail
 * and Outlook all render reliably.
 */
export const buildCodeMail = ({
  purpose,
  code,
  username,
  ip,
  minutes,
  now = new Date(),
}: {
  purpose: CodeMailPurpose;
  code: string;
  username?: string;
  ip: string;
  minutes: number;
  now?: Date;
}) => {
  const copy = COPY[purpose];
  const greeting = username ? `你好，${username}` : "你好";
  const when = formatTime(now);
  const where = ip && ip !== "unknown" ? ip : "未知";

  const subject = `${code} 是你的 ReCode 验证码（${copy.title}）`;

  const text = [
    `${greeting}：`,
    "",
    copy.action,
    "",
    `    ${code}`,
    "",
    `验证码 ${minutes} 分钟内有效，只能使用一次，请勿告诉他人。`,
    "",
    `申请时间：${when}（北京时间）`,
    `申请 IP：${where}`,
    "",
    copy.notYou,
    "",
    "—— ReCode · 此邮件由系统自动发送，请勿直接回复",
  ].join("\n");

  const muted = "color:#6b7280;font-size:13px;line-height:20px;";

  const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">验证码 ${code}，${minutes} 分钟内有效</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;">
    <tr><td style="padding:0;line-height:0;">
      <img src="cid:${BANNER_CID}" width="600" alt="ReCode" style="display:block;width:100%;max-width:600px;height:auto;border:0;">
    </td></tr>
    <tr><td style="padding:32px 32px 8px;">
      <p style="margin:0 0 6px;color:#ffa116;font-size:13px;font-weight:700;letter-spacing:2px;">${copy.title}</p>
      <p style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:700;">${escapeHtml(greeting)}</p>
      <p style="margin:0;color:#374151;font-size:15px;line-height:24px;">${copy.action}</p>
    </td></tr>
    <tr><td align="center" style="padding:20px 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;">
        <tr><td style="padding:18px 34px;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:38px;font-weight:800;letter-spacing:12px;color:#111827;">${code}</td></tr>
      </table>
      <p style="margin:12px 0 0;${muted}">${minutes} 分钟内有效 · 只能使用一次 · 请勿告诉他人</p>
    </td></tr>
    <tr><td style="padding:8px 32px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border-radius:10px;">
        <tr><td style="padding:14px 16px;${muted}">
          申请时间：${when}（北京时间）<br>申请 IP：${escapeHtml(where)}
        </td></tr>
      </table>
      <p style="margin:16px 0 0;${muted}">${copy.notYou}</p>
    </td></tr>
    <tr><td style="padding:16px 32px;border-top:1px solid #f3f4f6;color:#9ca3af;font-size:12px;line-height:18px;">
      ReCode · 刷过的题，不再忘记<br>此邮件由系统自动发送，请勿直接回复
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;

  return { subject, text, html };
};
