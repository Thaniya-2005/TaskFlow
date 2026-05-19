import nodemailer from 'nodemailer';

// Use SMTP_USER/SMTP_PASS, falling back to EMAIL_USER/EMAIL_PASS if configured that way
const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

// ─── Transporter ─────────────────────────────────────────────────────────────
// Explicit host/port is more reliable than `service:'gmail'` on cloud hosts.
// Port 587 + STARTTLS (secure:false) is the recommended Gmail SMTP config.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // false for 587 (STARTTLS), true for 465 (SSL)
  auth: {
    user: smtpUser,
    pass: smtpPass, // Must be a Gmail App Password, NOT your account password
  },
  // Helps on some cloud providers that have aggressive connection timeouts
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 15000,
  tls: {
    rejectUnauthorized: false, // Fix for self-signed cert error on Windows
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("[EmailService] SMTP verification failed:", error);
  } else {
    console.log("[EmailService] SMTP server is ready");
  }
});

// ─── Send Task Assignment Email ───────────────────────────────────────────────
export const sendTaskAssignmentEmail = async (task, assigneeEmail) => {
  // Guard: skip gracefully if credentials are missing
  if (!smtpUser || !smtpPass) {
    throw new Error('SMTP credentials are not configured (SMTP_USER/EMAIL_USER or SMTP_PASS/EMAIL_PASS missing).');
  }

  const assignee = typeof assigneeEmail === 'string' ? assigneeEmail.trim() : '';
  if (!isValidEmail(assignee)) {
    throw new Error(`Invalid assignee email address: ${assigneeEmail || '<empty>'}`);
  }

  const frontendUrl = (
    process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173'
  ).replace(/\/$/, '');

  const completionLink = `${frontendUrl}/complete-task/${task.id}?token=${task.taskAccessToken}`;

  const link = completionLink;

  // Format due date nicely
  const dueDateStr = task.dueAt
    ? new Date(task.dueAt).toLocaleString('en-IN', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata',
      })
    : 'Not set';

  const priorityColors = {
    Low: '#22c55e',
    Medium: '#f59e0b',
    High: '#ef4444',
    Urgent: '#dc2626',
  };
  const priorityColor = priorityColors[task.priority] || '#6b7280';

  try {
    console.log("[EmailService] Attempting to send email to:", assignee);

    const info = await transporter.sendMail({
      from: `"TaskFlow" <${smtpUser}>`,
      to: assignee,
      subject: `📋 New Task Assigned: ${task.title}`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Task Assigned</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;">
              <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">
                📋 TaskFlow
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">
                You've been assigned a new task
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">

              <!-- Greeting -->
              <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;">
                Hi <strong style="color:#e2e8f0;">${assignee}</strong>,
              </p>

              <!-- Task Card -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#0f172a;border-radius:12px;border:1px solid #334155;overflow:hidden;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <!-- Title -->
                    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:20px;font-weight:700;">
                      ${task.title}
                    </h2>

                    <!-- Description -->
                    ${task.description
                      ? `<p style="margin:0 0 20px;color:#94a3b8;font-size:14px;line-height:1.6;">${task.description}</p>`
                      : `<p style="margin:0 0 20px;color:#475569;font-size:14px;font-style:italic;">No description provided.</p>`
                    }

                    <!-- Details Grid -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding-bottom:12px;vertical-align:top;">
                          <span style="display:block;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Priority</span>
                          <span style="display:inline-block;background:${priorityColor}22;color:${priorityColor};border:1px solid ${priorityColor}55;border-radius:20px;padding:3px 12px;font-size:13px;font-weight:600;">
                            ${task.priority}
                          </span>
                        </td>
                        <td width="50%" style="padding-bottom:12px;vertical-align:top;">
                          <span style="display:block;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Status</span>
                          <span style="color:#e2e8f0;font-size:13px;">🔄 In Progress</span>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding-bottom:4px;vertical-align:top;">
                          <span style="display:block;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Assigned To</span>
                          <span style="color:#e2e8f0;font-size:13px;">👤 ${assignee}</span>
                        </td>
                        <td width="50%" style="padding-bottom:4px;vertical-align:top;">
                          <span style="display:block;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Due Date</span>
                          <span style="color:#f87171;font-size:13px;">⏰ ${dueDateStr}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${link}"
                      style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
                      ✅ Mark Task as Complete
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Note -->
              <p style="color:#475569;font-size:12px;margin:0;text-align:center;line-height:1.6;">
                This link is valid for <strong style="color:#94a3b8;">24 hours</strong>.
                If you didn't expect this email, please ignore it.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;padding:20px 40px;border-top:1px solid #1e293b;text-align:center;">
              <p style="margin:0;color:#334155;font-size:12px;">
                © 2026 TaskFlow · Automated Notification
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    const accepted = (info.accepted || []).map(a => a.toLowerCase());
    const rejected = (info.rejected || []).map(a => a.toLowerCase());
    const assigneeLower = assignee.toLowerCase();

    if (rejected.includes(assigneeLower) || !accepted.includes(assigneeLower)) {
      throw new Error(`SMTP did not accept the assignment email for ${assignee}.`);
    }

    console.log("[EmailService] Email sent successfully");
    console.log(info);
    return {
      accepted,
      rejected,
      messageId: info.messageId,
    };

  } catch (error) {
    console.error("[EmailService] Failed to send email:");
    console.error(error);
    throw createEmailError(error);
  }
};

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function createEmailError(error) {
  if (error?.code === "EAUTH") {
    return new Error("SMTP authentication failed. Check SMTP_USER and the Gmail App Password in Render.");
  }

  if (error?.code === "ETIMEDOUT" || error?.code === "ESOCKET") {
    return new Error("SMTP connection failed. Check SMTP_HOST, SMTP_PORT, SMTP_SECURE, and Render networking.");
  }

  return error instanceof Error ? error : new Error("SMTP email could not be sent.");
}
