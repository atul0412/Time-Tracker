import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

// COMMON PROJECT THEME HTML EMAIL TEMPLATE (used for both assignment and password reset)
const getHtmlEmailTemplate = ({
  headerBadge,
  headerTitle,
  headerDesc,
  greeting,
  mainMessage,
  actionButton,
  infoBlocks,
  metaInfo,
  footerMain,
  footerNotes,
  showMeta = false,
}) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${headerTitle} - Time-Tracker</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
      color:#1f2937; line-height:1.6;
      background: #faf5ff;
      padding: 40px 0; min-height:100vh;
    }
    .email-container {
      max-width:680px; margin:0 auto;
      background: #fff !important; border-radius:24px;
      box-shadow:0 25px 50px rgba(124, 45, 146, 0.18);
      overflow:hidden; position:relative;
    }
    .email-container::before {
      content:''; position:absolute;
      top:0; left:0; right:0; height:8px;
      background:linear-gradient(135deg, #7c2d92 0%, #6b21a8 50%, #581c87 100%);
    }
    .header {
      background: linear-gradient(135deg, #7c2d92 0%, #6b21a8 50%, #581c87 100%);
      padding:42px 32px; text-align:center; color:#fff !important;
    }
    .header-badge {
      background:linear-gradient(135deg, rgba(255,255,255,0.15) 0%, #7c2d92 50%, #581c87 100%);
      color:#fff !important; padding:12px 28px; font-size:16px; font-weight:700;
      border-radius:50px; margin-bottom:18px; display:inline-block;
      box-shadow:0 5px 14px rgba(124, 45, 146, 0.25);
      border:0.5px solid rgba(255,255,255,0.4);
    }
    .header h1 { font-size:30px; font-weight:800; margin:14px 0 10px 0;
      background:linear-gradient(135deg, #fff 0%, #e2e8f0 100%);
      background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent; }
    .header p { font-size:18px; color:#f3e8ff; letter-spacing:.2px; }
    .greeting { font-size:22px; font-weight:700; margin:36px 0 12px 0;
      background:linear-gradient(135deg, #7c2d92, #581c87);
      background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent; }
    .main-message { font-size:18px; color:#4b5563; margin:0 0 32px 0; font-weight:400; }
    .action-btn-cont { text-align:center; margin:32px 0; }
    .action-btn {
      display:inline-block;
      background: linear-gradient(135deg, #7c2d92 0%, #6b21a8 50%, #581c87 100%);
      color:#ffffff !important; text-decoration:none; padding:18px 42px; border-radius:15px;
      font-size:18px; font-weight:700;
      box-shadow: 0 8px 32px rgba(124, 45, 146, 0.20), 0 3px 8px rgba(88, 28, 135, 0.12);
      transition:.2s; border:none; outline:none; border:2px solid rgba(124, 45, 146, 0.8);
      position: relative; overflow:hidden;
    }
    .action-btn:hover {
      background: linear-gradient(135deg, #581c87 0%, #7c2d92 100%);
      color: #fff !important;
      transform: scale(1.04);
      box-shadow: 0 8px 38px 6px rgba(124, 45, 146, 0.28);
      border-color: #6b21a8;
    }
    .action-btn::after {
      content: ""; position: absolute; top: 0; left: -60%;
      width: 80%; height: 100%;
      background: linear-gradient(120deg, rgba(255,255,255,0.15) 30%,rgba(255,255,255,0.05) 100%);
      transform: skewX(-25deg);
      transition: left 0.5s;
      pointer-events: none;
    }
    .action-btn:hover::after { left: 120%; }
    .info-block, .meta-info {
      margin:28px 0;
      background:linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
      border-radius:16px; border:2px solid #7c2d92;
      padding:28px 30px;
      color:#1f2937; font-size:15px;
    }
    .meta-info {
      background:linear-gradient(135deg, #f8fafc 0%, #f3e8ff 100%);
      border:1.5px solid #7c2d92;
      display:flex; gap:24px; align-items:center; justify-content:center; font-size:15px; flex-direction: column;
      align-items: center;
    }
    .meta-item { font-size:15px; margin:0 8px; color: #6b21a8; font-weight: 600; }
    .footer {
      background: linear-gradient(135deg, #7c2d92 0%, #6b21a8 50%, #581c87 100%);
      padding:36px 30px; text-align:center; color:#fff !important;
    }
    .footer h3 { font-size:20px; font-weight:700;
      background:linear-gradient(135deg, #fff 0%, #e2e8f0 92%);
      background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent; }
    .footer p { font-size:15px; opacity:0.93; margin:0 0 8px 0; }
    .footer-badges {
      display:flex; justify-content:center; gap:22px; margin-top:18px; flex-wrap:wrap;
    }
    .footer-badges span {
      background:rgba(124, 45, 146, 0.15); padding:8px 16px; border-radius:19px;
      color:#fff !important; font-size:13px; font-weight:500;
      border: 1.5px solid rgba(255,255,255,0.25);
    }
    @media(max-width:700px) {
      .email-container { border-radius:0;}
      .header,.content,.footer { padding:24px 12px; }
      .footer-badges { gap:7px; }
      .meta-info { flex-direction:column;gap:8px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="header-badge">${headerBadge}</div>
      <h1>${headerTitle}</h1>
      <p>${headerDesc}</p>
    </div>
    <div class="content" style="padding:42px 35px;">
      <div class="greeting">${greeting}</div>
      <div class="main-message">${mainMessage}</div>
      ${actionButton ? `<div class="action-btn-cont">${actionButton}</div>` : ""}
      ${infoBlocks ? infoBlocks : ""}
      ${showMeta && metaInfo ? `<div class="meta-info">${metaInfo}</div>` : ""}
    </div>
    <div class="footer">
      <div class="footer-content">
        <h3>${footerMain}</h3>
        <p>${footerNotes}</p>
      </div>
      <div class="footer-badges">
        <span>🔒 Secure Platform</span>
        <span>⚡ Real-time Tracking</span>
        <span>📊 Detailed Analytics</span>
        <span>✅ Professional Grade</span>
      </div>
    </div>
  </div>
</body>
</html>
`;




// --- PROJECT ASSIGNMENT EMAIL ---
const getProjectAssignmentHtmlTemplate = (
  projectName,
  projectDescription,
  assignedBy,
  userName = "User"
) => getHtmlEmailTemplate({
  headerBadge: "🎯 New Project Assignment!",
  headerTitle: "Time-Tracker",
  headerDesc: "Professional Project Management & Time Tracking",
  greeting: `Hello ${userName}! 👋`,
  mainMessage: `Exciting news! You've been assigned to a new project. This is a fantastic opportunity to showcase your skills and contribute to our team's success. Get ready to make an impact!`,
  actionButton: `<a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login" class="action-btn">
    🚀 Access Project Dashboard
  </a>`,
  infoBlocks: `
    <div class="info-block">
      <b>Project: </b>${projectName}<br/>
      <b>Description:</b> ${projectDescription || "This project is ready for your expertise. Detailed requirements and specifications will be available in your project dashboard."}
    </div>
  `,
  metaInfo: `
    <span class="meta-item"> AssingBy-:👤 <b>${assignedBy}</b></span>
    <span class="meta-item">Date-: 📅 <b>${new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}</b></span>
  `,
  footerMain: "Welcome to the Team! 🎯",
  footerNotes: "This is an automated notification. For project-specific questions, contact your project manager.",
  showMeta: true
});

const getProjectAssignmentTextTemplate = (
  projectName,
  projectDescription,
  assignedBy,
  userName = "User",
) => `
TIME-TRACKER - NEW PROJECT ASSIGNMENT

🎯 NEW PROJECT ASSIGNMENT! 🎯

Hello ${userName},

Exciting news! You've been assigned to a new project. This is a fantastic opportunity.

Project: ${projectName}
Description: ${projectDescription || "This project is ready for your expertise."}
Assigned by: ${assignedBy}
Assignment Date: ${new Date().toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})}

1. Log in to your dashboard to view and manage your project.
2. Track your time and collaborate with your team.

Welcome to the team!
${process.env.FRONTEND_URL || "http://localhost:3000"}/login

--- 
Time-Tracker Team
`;

// --- RESET PASSWORD EMAIL ---
const getResetPasswordHtmlTemplate = (
  resetLink,
  userName = "User"
) => getHtmlEmailTemplate({
  headerBadge: "🔒 Password Reset",
  headerTitle: "Time-Tracker",
  headerDesc: "Professional Project Management & Time Tracking",
  greeting: `Hello ${userName}! 👋`,
  mainMessage: `You requested to reset your password. Click the link below to choose a new password and regain access to your account.`,
  actionButton: `<a href="${resetLink}" class="action-btn">Reset My Password</a>`,
  infoBlocks: `
    <div class="info-block">
      <b>Security Note:</b> This reset link will expire in 1 hour.<br/>
      If you did not request a password reset, please ignore this message.
    </div>
  `,
  footerMain: "Stay Secure with Time-Tracker",
  footerNotes: "This is an automated message. If you have concerns, contact your admin.",
  showMeta: true
});

const getResetPasswordTextTemplate = (
  resetLink,
  userName = "User"
) => `
TIME-TRACKER - PASSWORD RESET

Hello ${userName},

You requested to reset your password.
Open the link below to choose a new password:
${resetLink}

This reset link will expire in 1 hour. If you did not request this, you may ignore this message.

Time-Tracker Team
`;

// EMAIL SENDING FUNCTIONS
const sendProjectAssignmentEmail = async (
  to,
  userName = "User",
  projectName,
  projectDescription = "",
  assignedBy = "Project Manager"
) => {
  const subject = `🎯 New Project Assignment: ${projectName} - Time-Tracker`;
  const html = getProjectAssignmentHtmlTemplate(
    projectName,
    projectDescription,
    assignedBy,
    userName
  );
  const text = getProjectAssignmentTextTemplate(
    projectName,
    projectDescription,
    assignedBy,
    userName
  );

  try {
    await transporter.sendMail({
      from: `"Time-Tracker Project Management" <${process.env.EMAIL}>`,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error("❌ Error sending project assignment email:", error);
    throw error;
  }
};

const sendResetPasswordEmail = async (to, name = "User", url) => {
  const subject = "Reset Your Password - Time-Tracker";
  const html = getResetPasswordHtmlTemplate(url, name);
  const text = getResetPasswordTextTemplate(url, name);

  try {
    await transporter.sendMail({
      from: `"Time-Tracker" <${process.env.EMAIL}>`,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

export { sendProjectAssignmentEmail };
export default sendResetPasswordEmail;
