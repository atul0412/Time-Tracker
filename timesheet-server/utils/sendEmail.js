import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// ✅ Correct method name: createTransport (not createTransporter)
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ ENHANCED: Project Assignment HTML Template with Better Project Theme
const getProjectAssignmentHtmlTemplate = (
  projectName,
  projectDescription,
  assignedBy,
  userName = "User",
  userEmail = ""
) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>New Project Assignment - Time-Tracker</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #1f2937;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
        padding: 40px 20px;
        min-height: 100vh;
      }
      
      .email-container {
        max-width: 680px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 24px;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        overflow: hidden;
        position: relative;
      }
      
      .email-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 8px;
        background: linear-gradient(90deg, #0ea5e9, #3b82f6, #6366f1, #8b5cf6, #a855f7);
      }
      
      /* Enhanced Header Section with Project Theme */
      .header {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
        padding: 50px 40px;
        text-align: center;
        color: white;
        position: relative;
        overflow: hidden;
      }
      
      .header::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: 
          radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 75% 25%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 25% 75%, rgba(14, 165, 233, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(99, 102, 241, 0.1) 0%, transparent 50%);
        animation: float 30s linear infinite;
      }
      
      @keyframes float {
        0% { transform: translateX(-50px) translateY(-50px) rotate(0deg); }
        100% { transform: translateX(0px) translateY(0px) rotate(360deg); }
      }
      
      .header h1 {
        font-size: 36px;
        font-weight: 800;
        margin-bottom: 12px;
        text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        position: relative;
        z-index: 2;
        background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      
      .header p {
        font-size: 18px;
        opacity: 0.9;
        margin: 0;
        position: relative;
        z-index: 2;
        font-weight: 400;
        color: #cbd5e1;
      }
      
      /* Enhanced Assignment Badge */
      .assignment-badge {
        background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%);
        color: white;
        padding: 14px 28px;
        border-radius: 50px;
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 24px;
        display: inline-block;
        box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
        border: 2px solid rgba(255, 255, 255, 0.1);
        position: relative;
        overflow: hidden;
      }
      
      .assignment-badge::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        animation: shine 3s infinite;
      }
      
      @keyframes shine {
        0% { left: -100%; }
        100% { left: 100%; }
      }
      
      /* Content Section */
      .content {
        padding: 50px 40px;
        background: #ffffff;
      }
      
      .greeting {
        font-size: 28px;
        font-weight: 800;
        color: #1f2937;
        margin-bottom: 30px;
        background: linear-gradient(135deg, #0f172a, #3b82f6, #6366f1);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      
      .message {
        font-size: 18px;
        color: #4b5563;
        margin-bottom: 40px;
        line-height: 1.8;
        font-weight: 400;
      }
      
      /* Enhanced Project Details Card */
      .project-card {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border: 3px solid transparent;
        background-clip: padding-box;
        border-radius: 24px;
        padding: 35px;
        margin: 40px 0;
        position: relative;
        box-shadow: 
          0 20px 40px rgba(15, 23, 42, 0.1),
          0 0 0 1px rgba(59, 130, 246, 0.1);
        overflow: hidden;
      }
      
      .project-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #0ea5e9, #3b82f6, #6366f1, #8b5cf6);
      }
      
      .project-card::after {
        content: '📋';
        position: absolute;
        top: -20px;
        left: 35px;
        background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
        padding: 10px 14px;
        border-radius: 16px;
        font-size: 20px;
        box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
      }
      
      .project-card h3 {
        color: #0f172a;
        font-size: 24px;
        font-weight: 800;
        margin-bottom: 20px;
        margin-top: 15px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .project-name {
        font-size: 28px;
        font-weight: 900;
        color: #0f172a;
        margin-bottom: 20px;
        padding: 20px 25px;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
        border-radius: 16px;
        border-left: 6px solid #3b82f6;
        position: relative;
        overflow: hidden;
      }
      
      .project-name::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
        transform: translateX(-100%);
        animation: shimmer 2s infinite;
      }
      
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      
      .project-description {
        color: #475569;
        font-size: 16px;
        line-height: 1.8;
        margin-bottom: 25px;
        padding: 20px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 12px;
        border: 1px solid rgba(148, 163, 184, 0.2);
        position: relative;
      }
      
      .project-meta {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-top: 25px;
      }
      
      .meta-item {
        background: rgba(59, 130, 246, 0.05);
        padding: 15px;
        border-radius: 12px;
        border: 1px solid rgba(59, 130, 246, 0.1);
      }
      
      .meta-label {
        color: #64748b;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 5px;
      }
      
      .meta-value {
        color: #1e293b;
        font-size: 14px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      /* Enhanced Action Button */
      .button-container {
        text-align: center;
        margin: 50px 0;
      }
      
      .action-button {
        display: inline-block;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
        color: white;
        text-decoration: none;
        padding: 18px 45px;
        border-radius: 16px;
        font-weight: 700;
        font-size: 18px;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 
          0 10px 30px rgba(15, 23, 42, 0.4),
          0 0 0 1px rgba(59, 130, 246, 0.2);
        position: relative;
        overflow: hidden;
        text-transform: uppercase;
        letter-spacing: 1px;
        border: 2px solid transparent;
      }
      
      .action-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent);
        transition: left 0.6s;
      }
      
      .action-button:hover {
        transform: translateY(-3px) scale(1.02);
        box-shadow: 
          0 20px 40px rgba(15, 23, 42, 0.5),
          0 0 0 2px rgba(59, 130, 246, 0.3);
        background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%);
      }
      
      .action-button:hover::before {
        left: 100%;
      }
      
      /* Enhanced Next Steps */
      .next-steps {
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        border: 2px solid #0ea5e9;
        border-radius: 20px;
        padding: 30px;
        margin: 40px 0;
        position: relative;
        box-shadow: 0 10px 30px rgba(14, 165, 233, 0.1);
      }
      
      .next-steps::before {
        content: '🚀';
        position: absolute;
        top: -18px;
        left: 30px;
        background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
        padding: 10px 14px;
        border-radius: 16px;
        font-size: 18px;
        box-shadow: 0 8px 25px rgba(14, 165, 233, 0.3);
      }
      
      .next-steps h3 {
        color: #0c4a6e;
        font-size: 20px;
        font-weight: 800;
        margin-bottom: 20px;
        margin-top: 15px;
      }
      
      .steps-list {
        list-style: none;
        padding: 0;
        counter-reset: step-counter;
      }
      
      .steps-list li {
        color: #0369a1;
        font-size: 16px;
        margin: 15px 0;
        padding-left: 40px;
        position: relative;
        font-weight: 500;
        line-height: 1.6;
      }
      
      .steps-list li::before {
        content: counter(step-counter);
        counter-increment: step-counter;
        position: absolute;
        left: 0;
        top: 0;
        background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
        color: white;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        font-size: 13px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);
      }
      
      /* Enhanced Important Notice */
      .important-notice {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border: 2px solid #f59e0b;
        border-radius: 20px;
        padding: 30px;
        margin: 40px 0;
        position: relative;
        box-shadow: 0 10px 30px rgba(245, 158, 11, 0.1);
      }
      
      .important-notice::before {
        content: '💼';
        position: absolute;
        top: -18px;
        left: 30px;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        padding: 10px 14px;
        border-radius: 16px;
        font-size: 18px;
        box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
      }
      
      .important-notice h3 {
        color: #92400e;
        font-size: 20px;
        font-weight: 800;
        margin-bottom: 15px;
        margin-top: 15px;
      }
      
      .important-notice p {
        color: #a16207;
        font-size: 16px;
        margin: 12px 0;
        font-weight: 500;
        line-height: 1.6;
      }
      
      .important-notice .highlight {
        background: rgba(245, 158, 11, 0.2);
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 700;
      }
      
      /* Enhanced Footer */
      .footer {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        padding: 45px 40px;
        text-align: center;
        color: white;
        position: relative;
      }
      
      .footer::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #0ea5e9, #3b82f6, #6366f1, #8b5cf6);
      }
      
      .footer-content {
        margin-bottom: 35px;
      }
      
      .footer h3 {
        color: #ffffff;
        font-size: 22px;
        font-weight: 700;
        margin-bottom: 15px;
        background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      
      .footer p {
        color: #cbd5e1;
        font-size: 16px;
        margin: 10px 0;
        opacity: 0.9;
      }
      
      .footer-badges {
        display: flex;
        justify-content: center;
        gap: 25px;
        margin-top: 35px;
        font-size: 14px;
        color: #94a3b8;
        padding-top: 25px;
        border-top: 1px solid rgba(203, 213, 225, 0.1);
        flex-wrap: wrap;
      }
      
      .footer-badges span {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(59, 130, 246, 0.1);
        padding: 10px 18px;
        border-radius: 25px;
        transition: all 0.3s ease;
        border: 1px solid rgba(59, 130, 246, 0.2);
        font-weight: 500;
      }
      
      .footer-badges span:hover {
        background: rgba(59, 130, 246, 0.2);
        transform: translateY(-2px);
        color: #e2e8f0;
      }
      
      /* Responsive Design */
      @media (max-width: 768px) {
        body {
          padding: 20px 10px;
        }
        
        .header, .content, .footer {
          padding: 30px 25px;
        }
        
        .header h1 {
          font-size: 28px;
        }
        
        .greeting {
          font-size: 24px;
        }
        
        .message {
          font-size: 16px;
        }
        
        .action-button {
          padding: 16px 35px;
          font-size: 16px;
        }
        
        .footer-badges {
          flex-direction: column;
          gap: 15px;
        }
        
        .project-name {
          font-size: 24px;
        }
        
        .project-meta {
          grid-template-columns: 1fr;
          gap: 15px;
        }
      }
      
      @media (max-width: 480px) {
        .email-container {
          margin: 0;
          border-radius: 0;
        }
        
        .header {
          border-radius: 0;
        }
        
        body {
          padding: 0;
          background: #ffffff;
        }
        
        .project-card, .next-steps, .important-notice {
          margin: 30px 0;
          padding: 25px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <!-- Enhanced Header with Project Theme -->
      <div class="header">
        <div class="assignment-badge">🎯 New Project Assignment!</div>
        <h1>Time-Tracker</h1>
        <p>Professional Project Management & Time Tracking</p>
      </div>
      
      <!-- Content -->
      <div class="content">
        <div class="greeting">Hello ${userName}! 👋</div>
        
        <div class="message">
          Exciting news! You've been assigned to a new project. This is a fantastic opportunity to showcase your skills and contribute to our team's success. Get ready to make an impact!
        </div>
        
        <div class="project-card">
          <h3>📋 Project Assignment Details</h3>
          <div class="project-name">${projectName}</div>
          <div class="project-description">
            ${
              projectDescription ||
              "This project is ready for your expertise. Detailed requirements and specifications will be available in your project dashboard."
            }
          </div>
          
          <div class="project-meta">
            <div class="meta-item">
              <div class="meta-label">Assigned By</div>
              <div class="meta-value">
                👤 <strong>${assignedBy}</strong>
              </div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Assignment Date</div>
              <div class="meta-value">
                📅 <strong>${new Date().toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}</strong>
              </div>
            </div>
          </div>
        </div>
        
        <div class="button-container">
          <a href="${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/projects" class="action-button">
            🚀 Access Project Dashboard
          </a>
        </div>
      </div>
      
      <!-- Enhanced Footer -->
      <div class="footer">
        <div class="footer-content">
          <h3>Welcome to the Team! 🎯</h3>
          <p>The Time-Tracker Team</p>
          <p>This is an automated notification. For project-specific questions, contact your project manager.</p>
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
};

// ✅ ENHANCED: Project Assignment Text Template
const getProjectAssignmentTextTemplate = (
  projectName,
  projectDescription,
  assignedBy,
  userName = "User",
  userEmail = ""
) => {
  return `
TIME-TRACKER - NEW PROJECT ASSIGNMENT

🎯 NEW PROJECT ASSIGNMENT! 🎯

Hello ${userName},

Exciting news! You've been assigned to a new project. This is a fantastic opportunity to showcase your skills and contribute to our team's success.

📋 PROJECT ASSIGNMENT DETAILS:
═══════════════════════════════════════

Project Name: ${projectName}
Description: ${
    projectDescription ||
    "This project is ready for your expertise. Detailed requirements will be available in your dashboard."
  }
Assigned by: ${assignedBy}
Assignment Date: ${new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}

🚀 YOUR NEXT STEPS:
═══════════════════════════════════════

1. Log into your Time-Tracker dashboard using your credentials
2. Navigate to the Projects section to find your new assignment  
3. Review the project requirements and deliverables
4. Set up your workspace and familiarize yourself with the project scope
5. Begin tracking your time immediately when you start working
6. Connect with your project team and stakeholders

💼 IMPORTANT PROJECT GUIDELINES:
═══════════════════════════════════════

• TIME TRACKING: All project work must be logged in the timesheet system for accurate billing and project management.

• COMMUNICATION: Keep your project manager updated on progress and any blockers you encounter.

• RESOURCES: You now have access to all project-related documentation, tools, and team channels.

• DEADLINES: Review project milestones and deliverable dates in your dashboard.

🔗 ACCESS YOUR DASHBOARD:
${process.env.FRONTEND_URL || "http://localhost:3000"}/projects

Welcome to the team! 🎯
The Time-Tracker Team

═══════════════════════════════════════
This is an automated notification. For project-specific questions, contact your project manager.
🔒 Secure Platform | ⚡ Real-time Tracking | 📊 Detailed Analytics | ✅ Professional Grade
  `;
};

// ✅ Existing Reset Password Templates (unchanged)
const getResetPasswordHtmlTemplate = (
  resetLink,
  userName = "User",
  userEmail = ""
) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Welcome to Time-Tracker - Set Your Password</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #1f2937;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 40px 20px;
        min-height: 100vh;
      }
      
      .email-container {
        max-width: 640px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 24px;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        position: relative;
      }
      
      .email-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 6px;
        background: linear-gradient(90deg, #8b5cf6, #06b6d4, #10b981, #f59e0b);
      }
      
      /* Header Section */
      .header {
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%);
        padding: 50px 40px;
        text-align: center;
        color: white;
        position: relative;
        overflow: hidden;
      }
      
      .header::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
        background-size: 50px 50px;
        animation: float 20s linear infinite;
      }
      
      @keyframes float {
        0% { transform: translateX(-50px) translateY(-50px); }
        100% { transform: translateX(0px) translateY(0px); }
      }
      
      .logo {
        width: 80px;
        height: 80px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 24px;
        font-size: 32px;
        font-weight: bold;
        color: #8b5cf6;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(10px);
        position: relative;
        z-index: 2;
      }
      
      .header h1 {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 12px;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        position: relative;
        z-index: 2;
      }
      
      .header p {
        font-size: 18px;
        opacity: 0.95;
        margin: 0;
        position: relative;
        z-index: 2;
        font-weight: 300;
      }
      
      /* Welcome Badge */
      .welcome-badge {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 20px;
        display: inline-block;
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
      }
      
      /* Content Section */
      .content {
        padding: 50px 40px;
        background: #ffffff;
      }
      
      .greeting {
        font-size: 24px;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 30px;
        background: linear-gradient(135deg, #8b5cf6, #06b6d4);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      
      .message {
        font-size: 18px;
        color: #4b5563;
        margin-bottom: 30px;
        line-height: 1.8;
        font-weight: 400;
      }
      
      /* Reset Button */
      .button-container {
        text-align: center;
        margin: 50px 0;
      }
      
      .reset-button {
        display: inline-block;
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%);
        color: white;
        text-decoration: none;
        padding: 20px 40px;
        border-radius: 16px;
        font-weight: 600;
        font-size: 18px;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
        position: relative;
        overflow: hidden;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .reset-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        transition: left 0.6s;
      }
      
      .reset-button:hover {
        transform: translateY(-3px) scale(1.02);
        box-shadow: 0 15px 35px rgba(139, 92, 246, 0.5);
      }
      
      .reset-button:hover::before {
        left: 100%;
      }
      
      /* Security Notice */
      .security-notice {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border: 2px solid #f59e0b;
        border-radius: 16px;
        padding: 25px;
        margin: 40px 0;
        position: relative;
      }
      
      .security-notice::before {
        content: '🛡️';
        position: absolute;
        top: -15px;
        left: 25px;
        background: #f59e0b;
        padding: 8px 12px;
        border-radius: 12px;
        font-size: 16px;
      }
      
      .security-notice h3 {
        color: #92400e;
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 10px;
      }
      
      .security-notice p {
        color: #a16207;
        font-size: 16px;
        margin: 8px 0;
        font-weight: 500;
      }
      
      /* Alternative Link */
      .alternative-link {
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        border: 2px dashed #94a3b8;
        border-radius: 16px;
        padding: 25px;
        margin: 40px 0;
        position: relative;
      }
      
      .alternative-link p {
        margin: 0 0 12px 0;
        font-weight: 600;
        color: #475569;
        font-size: 16px;
      }
      
      .alternative-link a {
        color: #8b5cf6;
        word-break: break-all;
        text-decoration: none;
        font-weight: 500;
        background: rgba(139, 92, 246, 0.1);
        padding: 8px 12px;
        border-radius: 8px;
        display: inline-block;
        margin-top: 8px;
        transition: all 0.3s ease;
      }
      
      .alternative-link a:hover {
        background: rgba(139, 92, 246, 0.2);
        transform: translateY(-1px);
      }
      
      /* Next Steps */
      .next-steps {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border: 2px solid #16a34a;
        border-radius: 16px;
        padding: 25px;
        margin: 40px 0;
      }
      
      .next-steps h3 {
        color: #15803d;
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 15px;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .steps-list {
        list-style: none;
        padding: 0;
      }
      
      .steps-list li {
        color: #166534;
        font-size: 16px;
        margin: 12px 0;
        padding-left: 30px;
        position: relative;
        font-weight: 500;
      }
      
      .steps-list li::before {
        content: counter(step-counter);
        counter-increment: step-counter;
        position: absolute;
        left: 0;
        top: 0;
        background: #16a34a;
        color: white;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        font-size: 12px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .steps-list {
        counter-reset: step-counter;
      }
      
      /* Footer */
      .footer {
        background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
        padding: 40px;
        text-align: center;
        color: white;
        position: relative;
      }
      
      .footer-content {
        margin-bottom: 30px;
      }
      
      .footer h3 {
        color: #ffffff;
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 12px;
      }
      
      .footer p {
        color: #d1d5db;
        font-size: 16px;
        margin: 8px 0;
        opacity: 0.9;
      }
      
      .security-badges {
        display: flex;
        justify-content: center;
        gap: 30px;
        margin-top: 30px;
        font-size: 14px;
        color: #9ca3af;
        padding-top: 20px;
        border-top: 1px solid rgba(255,255,255,0.1);
      }
      
      .security-badges span {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255,255,255,0.1);
        padding: 8px 16px;
        border-radius: 20px;
        transition: all 0.3s ease;
      }
      
      .security-badges span:hover {
        background: rgba(255,255,255,0.2);
        transform: translateY(-2px);
      }
      
      /* Responsive Design */
      @media (max-width: 680px) {
        body {
          padding: 20px 10px;
        }
        
        .header, .content, .footer {
          padding: 30px 25px;
        }
        
        .header h1 {
          font-size: 28px;
        }
        
        .greeting {
          font-size: 22px;
        }
        
        .message {
          font-size: 16px;
        }
        
        .reset-button {
          padding: 16px 32px;
          font-size: 16px;
        }
        
        .security-badges {
          flex-direction: column;
          gap: 15px;
        }
        
        .logo {
          width: 70px;
          height: 70px;
          font-size: 28px;
        }
        
        .detail-item {
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }
      }
      
      @media (max-width: 480px) {
        .email-container {
          margin: 0;
          border-radius: 0;
        }
        
        .header {
          border-radius: 0;
        }
        
        body {
          padding: 0;
          background: #ffffff;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <!-- Header -->
      <div class="header">
        <div class="welcome-badge">🎉 Welcome to Time-Tracker!</div>
        <h1>Time-Tracker</h1>
        <p>Professional timesheet management</p>
      </div>
      
      <!-- Content -->
      <div class="content">
        <div class="greeting">Hello ${userName}! 👋</div>
        
        <div class="message">
          Welcome to Time-Tracker! Your account has been successfully created by your system administrator. To get started, you'll need to set up your password.
        </div>
        
        <div class="button-container">
          <a href="${resetLink}" class="reset-button">Set My Password</a>
        </div>
        
        <div class="security-notice">
          <h3>🔒 Security Information</h3>
          <p><strong>This link expires in 1 hour</strong> for your security.</p>
          <p>Once you set your password, you'll have full access to your Time-Tracker dashboard.</p>
          <p>If you experience any issues, please contact your system administrator.</p>
        </div>
        
        <div class="next-steps">
          <h3>🚀 What's Next?</h3>
          <ol class="steps-list">
            <li>Click the "Set My Password" button above</li>
            <li>Create a strong, secure password</li>
            <li>Log in to your Time-Tracker dashboard</li>
            <li>Complete your profile setup</li>
            <li>Start tracking your time efficiently!</li>
          </ol>
        </div>
        
        <div class="alternative-link">
          <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
          <a href="${resetLink}">${resetLink}</a>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="footer">
        <div class="footer-content">
          <h3>Welcome aboard!</h3>
          <p>The Time-Tracker Team</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
        
        <div class="security-badges">
          <span>🔒 Secure</span>
          <span>⚡ Fast</span>
          <span>✅ Reliable</span>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

const getResetPasswordTextTemplate = (
  resetLink,
  userName = "User",
  userEmail = ""
) => {
  return `
Time-Tracker - Welcome! Set Your Password

🎉 WELCOME TO TIME-TRACKER! 🎉

Hello ${userName},

Welcome to Time-Tracker! Your account has been successfully created by your system administrator.

To get started, please set up your password by clicking this link:
${resetLink}

🚀 WHAT'S NEXT?
1. Click the link above to set your password
2. Create a strong, secure password
3. Log in to your Time-Tracker dashboard
4. Complete your profile setup
5. Start tracking your time efficiently!

🔒 SECURITY INFORMATION:
- This link expires in 1 hour for your security
- Once you set your password, you'll have full access to your dashboard
- If you experience any issues, contact your system administrator

If the link doesn't work, copy and paste it into your browser:
${resetLink}

Welcome aboard!
The Time-Tracker Team

---
This is an automated message, please do not reply to this email.
🔒 Secure | ⚡ Fast | ✅ Reliable
  `;
};

// ✅ ENHANCED: Project Assignment Email Function
const sendProjectAssignmentEmail = async (
  to,
  userName = "User",
  projectName,
  projectDescription = "",
  assignedBy = "Project Manager"
) => {
  console.log("📧 Sending project assignment email to:", to);
  console.log("📋 Project:", projectName);

  const subject = `🎯 New Project Assignment: ${projectName} - Time-Tracker`;
  const html = getProjectAssignmentHtmlTemplate(
    projectName,
    projectDescription,
    assignedBy,
    userName,
    to
  );
  const text = getProjectAssignmentTextTemplate(
    projectName,
    projectDescription,
    assignedBy,
    userName,
    to
  );

  try {
    await transporter.sendMail({
      from: `"Time-Tracker Project Management" <${process.env.EMAIL}>`,
      to,
      subject,
      text,
      html,
    });
    console.log("✅ Project assignment email sent successfully");
  } catch (error) {
    console.error("❌ Error sending project assignment email:", error);
    throw error;
  }
};

// ✅ Existing Reset Password Email Function (unchanged)
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

// ✅ Export both functions
export { sendProjectAssignmentEmail };
export default sendResetPasswordEmail;
