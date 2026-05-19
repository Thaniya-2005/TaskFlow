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
    console.warn('[EmailService] Skipping email — SMTP credentials not configured (SMTP_USER/EMAIL_USER or SMTP_PASS/EMAIL_PASS missing).');
    return;
  }

  if (!assigneeEmail || !assigneeEmail.includes('@')) {
    console.warn('[EmailService] Skipping email — invalid assignee address:', assigneeEmail);
    return;
  }

  const frontendUrl = (
    process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173'
  ).replace(/\/$/, '');

  const completionLink = `${frontendUrl}/complete-task/${task.id}?token=${task.taskAccessToken}`;

  const assignee = assigneeEmail;
  const link = completionLink;

  try {
    console.log("[EmailService] Attempting to send email...");

    const info = await transporter.sendMail({
      from: smtpUser,
      to: assignee,
      subject: "Task Assigned",
      html: `
        <h2>Task Assigned</h2>
        <p>A task has been assigned to you.</p>
        <a href="${link}">Open Task</a>
      `,
    });

    console.log("[EmailService] Email sent successfully");
    console.log(info);

  } catch (error) {
    console.error("[EmailService] Failed to send email:");
    console.error(error);
  }
};
