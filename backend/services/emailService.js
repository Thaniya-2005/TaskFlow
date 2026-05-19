import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = parseBoolean(process.env.SMTP_SECURE, SMTP_PORT === 465);
const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER || "TaskFlow <no-reply@taskflow.local>";
const isProductionRuntime = process.env.NODE_ENV === "production" || process.env.RENDER === "true";

const transporter = createTransporter();

export const sendTaskAssignmentEmail = async (task, assigneeEmail) => {
  if (!transporter) {
    throw new Error("Email service not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.");
  }

  const assignee = typeof assigneeEmail === "string" ? assigneeEmail.trim() : "";
  if (!isValidEmail(assignee)) {
    throw new Error(`Invalid assignee email address: ${assigneeEmail || "<empty>"}`);
  }

  const frontendUrl = getFrontendUrl();
  const completionLink = `${frontendUrl}/complete-task/${task.id}?token=${task.taskAccessToken}`;
  const dueDateStr = formatDueDate(task.dueAt);
  const html = buildTaskAssignmentHtml({ task, assignee, completionLink, dueDateStr });

  try {
    console.log("[EmailService] Sending SMTP email to:", assignee);

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: assignee,
      subject: `New Task Assigned: ${task.title}`,
      text: buildTaskAssignmentText({ task, assignee, completionLink, dueDateStr }),
      html,
    });

    console.log("[EmailService] Email sent successfully via SMTP");
    console.log("[EmailService] Message ID:", info.messageId);

    return {
      messageId: info.messageId,
      accepted: info.accepted || [],
      rejected: info.rejected || [],
    };
  } catch (error) {
    console.error("[EmailService] Failed to send email:", error);
    throw createEmailError(error);
  }
};

function createTransporter() {
  if (!SMTP_HOST) {
    console.warn("[EmailService] SMTP_HOST not set. Assignment emails will not be sent.");
    return null;
  }

  const transportOptions = {
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
  };

  if (SMTP_USER || SMTP_PASS) {
    transportOptions.auth = {
      user: SMTP_USER,
      pass: SMTP_PASS,
    };
  }

  console.log("[EmailService] SMTP transport configured");
  return nodemailer.createTransport(transportOptions);
}

function buildTaskAssignmentHtml({ task, assignee, completionLink, dueDateStr }) {
  const priorityColors = {
    Low: "#22c55e",
    Medium: "#f59e0b",
    High: "#ef4444",
    Urgent: "#dc2626",
  };
  const priorityColor = priorityColors[task.priority] || "#6b7280";

  const safeAssignee = escapeHtml(assignee);
  const safeTitle = escapeHtml(task.title);
  const safeDescription = task.description ? escapeHtml(task.description) : "";
  const safePriority = escapeHtml(task.priority || "Medium");
  const safeDueDate = escapeHtml(dueDateStr);
  const safeLink = escapeHtml(completionLink);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Task Assigned</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Segoe UI,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
          <tr>
            <td style="background:#4f46e5;padding:32px 40px;">
              <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;">TaskFlow</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">You've been assigned a new task</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;">
                Hi <strong style="color:#e2e8f0;">${safeAssignee}</strong>,
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;border:1px solid #334155;overflow:hidden;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:20px;font-weight:700;">${safeTitle}</h2>
                    ${
                      safeDescription
                        ? `<p style="margin:0 0 20px;color:#94a3b8;font-size:14px;line-height:1.6;">${safeDescription}</p>`
                        : `<p style="margin:0 0 20px;color:#475569;font-size:14px;font-style:italic;">No description provided.</p>`
                    }
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding-bottom:12px;vertical-align:top;">
                          <span style="display:block;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Priority</span>
                          <span style="display:inline-block;background:${priorityColor}22;color:${priorityColor};border:1px solid ${priorityColor}55;border-radius:20px;padding:3px 12px;font-size:13px;font-weight:600;">${safePriority}</span>
                        </td>
                        <td width="50%" style="padding-bottom:12px;vertical-align:top;">
                          <span style="display:block;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Status</span>
                          <span style="color:#e2e8f0;font-size:13px;">In Progress</span>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding-bottom:4px;vertical-align:top;">
                          <span style="display:block;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Assigned To</span>
                          <span style="color:#e2e8f0;font-size:13px;">${safeAssignee}</span>
                        </td>
                        <td width="50%" style="padding-bottom:4px;vertical-align:top;">
                          <span style="display:block;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Due Date</span>
                          <span style="color:#f87171;font-size:13px;">${safeDueDate}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${safeLink}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:600;">Mark Task as Complete</a>
                  </td>
                </tr>
              </table>
              <p style="color:#475569;font-size:12px;margin:0;text-align:center;line-height:1.6;">
                This link is valid for <strong style="color:#94a3b8;">24 hours</strong>. If you didn't expect this email, please ignore it.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#0f172a;padding:20px 40px;border-top:1px solid #1e293b;text-align:center;">
              <p style="margin:0;color:#334155;font-size:12px;">2026 TaskFlow - Automated Notification</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildTaskAssignmentText({ task, assignee, completionLink, dueDateStr }) {
  return [
    `Hi ${assignee},`,
    "",
    "You've been assigned a new task in TaskFlow.",
    "",
    `Title: ${task.title}`,
    `Description: ${task.description || "No description provided."}`,
    `Priority: ${task.priority || "Medium"}`,
    `Due Date: ${dueDateStr}`,
    "",
    `Complete it here: ${completionLink}`,
    "",
    "This link is valid for 24 hours.",
  ].join("\n");
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function formatDueDate(dueAt) {
  return dueAt
    ? new Date(dueAt).toLocaleString("en-IN", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      })
    : "Not set";
}

function getFrontendUrl() {
  const configuredUrl = process.env.FRONTEND_URL || process.env.PUBLIC_FRONTEND_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  if (isProductionRuntime) {
    throw new Error("FRONTEND_URL is required in production so email links do not point to localhost.");
  }

  return "http://localhost:5173";
}

function parseBoolean(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes"].includes(String(value).toLowerCase());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createEmailError(error) {
  const message = error?.message || "SMTP email could not be sent.";

  if (message.toLowerCase().includes("auth")) {
    return new Error("SMTP authentication failed. Check SMTP_USER and SMTP_PASS.");
  }

  if (message.toLowerCase().includes("connection") || message.toLowerCase().includes("timeout")) {
    return new Error("SMTP connection failed. Check SMTP_HOST, SMTP_PORT, and SMTP_SECURE.");
  }

  return error instanceof Error ? error : new Error(message);
}
