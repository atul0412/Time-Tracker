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

const getResetPasswordHtmlTemplate = (resetLink, userName = "User") => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Reset Your Password - Time-Tracker</title>
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
        margin-bottom: 40px;
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
        margin: 0;
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
        <div class="logo">⏰</div>
        <h1>Time-Tracker</h1>
        <p>Professional timesheet management</p>
      </div>
      
      <!-- Content -->
      <div class="content">
        <div class="greeting">Hello ${userName}! 👋</div>
        
        <div class="message">
          We received a request to reset the password for your Time-Tracker account. If this was you, click the button below to create a new password.
        </div>
        
        <div class="button-container">
          <a href="${resetLink}" class="reset-button">Reset My Password</a>
        </div>
        
        <div class="security-notice">
          <h3>🔒 Security Information</h3>
          <p><strong>This link expires in 1 hour</strong> for your security. If you didn't request this password reset, you can safely ignore this email - your account remains secure.</p>
        </div>
        
        <div class="alternative-link">
          <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
          <a href="${resetLink}">${resetLink}</a>
        </div>
        
        <div class="message">
          If you're having trouble resetting your password, please contact your system administrator for assistance.
        </div>
      </div>
      
      <!-- Footer -->
      <div class="footer">
        <div class="footer-content">
          <h3>Best regards,</h3>
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

const getResetPasswordTextTemplate = (resetLink, userName = "User") => {
  return `
Time-Tracker - Reset Your Password

Hello ${userName},

We received a request to reset the password for your Time-Tracker account.

Reset your password by clicking this link:
${resetLink}

SECURITY NOTICE:
- This link expires in 1 hour for your security
- If you didn't request this, you can safely ignore this email
- Your account remains secure

If the link doesn't work, copy and paste it into your browser.

Having trouble? Contact your system administrator for assistance.

Best regards,
The Time-Tracker Team

---
This is an automated message, please do not reply to this email.
🔒 Secure | ⚡ Fast | ✅ Reliable
  `;
};

const sendResetPasswordEmail = async (to, name = "User", url) => {
  console.log("Sending password reset email to:", to);
  console.log("Reset URL:", url);
  
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
    console.log("Password reset email sent successfully");
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

export default sendResetPasswordEmail;
