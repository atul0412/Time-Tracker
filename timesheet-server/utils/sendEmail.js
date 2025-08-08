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
    <title>Reset Your Password - Time-Tracker </title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333333;
        background-color: #f8f9fa;
        padding: 20px;
      }
      
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        border: 1px solid #e5e7eb;
      }
      
      /* Header Section */
      .header {
        background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
        padding: 40px 30px;
        text-align: center;
        color: white;
      }
      
      .logo {
        width: 60px;
        height: 60px;
        background: white;
        border-radius: 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
        font-size: 24px;
        font-weight: bold;
        color: #9333ea;
      }
      
      .header h1 {
        font-size: 28px;
        font-weight: bold;
        margin-bottom: 8px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .header p {
        font-size: 16px;
        opacity: 0.9;
        margin: 0;
      }
      
      /* Content Section */
      .content {
        padding: 40px 30px;
      }
      
      .greeting {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 24px;
      }
      
      .message {
        font-size: 16px;
        color: #4b5563;
        margin-bottom: 32px;
        line-height: 1.7;
      }
      
      /* Security Notice */
      .security-notice {
        background: #fef3c7;
        border: 1px solid #f59e0b;
        border-radius: 12px;
        padding: 20px;
        margin: 24px 0;
      }
      
      .security-notice h3 {
        color: #92400e;
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .security-notice p {
        color: #a16207;
        font-size: 14px;
        margin: 0;
      }
      
      /* Reset Button */
      .button-container {
        text-align: center;
        margin: 32px 0;
      }
      
      .reset-button {
        display: inline-block;
        background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
        color: white;
        text-decoration: none;
        padding: 16px 32px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 16px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);
      }
      
      .reset-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(147, 51, 234, 0.4);
      }
      
      /* Alternative Link */
      .alternative-link {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
        margin: 24px 0;
        font-size: 14px;
        color: #6b7280;
      }
      
      .alternative-link p {
        margin: 0 0 8px 0;
        font-weight: 500;
      }
      
      .alternative-link a {
        color: #9333ea;
        word-break: break-all;
        text-decoration: none;
      }
      
      /* Footer */
      .footer {
        background: #f9fafb;
        padding: 32px 30px;
        border-top: 1px solid #e5e7eb;
        text-align: center;
      }
      
      .footer-content {
        margin-bottom: 20px;
      }
      
      .footer h3 {
        color: #1f2937;
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 8px;
      }
      
      .footer p {
        color: #6b7280;
        font-size: 14px;
        margin: 4px 0;
      }
      
      .security-badges {
        display: flex;
        justify-content: center;
        gap: 16px;
        margin-top: 20px;
        font-size: 12px;
        color: #9ca3af;
      }
      
      .security-badges span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      /* Responsive Design */
      @media (max-width: 600px) {
        body {
          padding: 10px;
        }
        
        .header, .content, .footer {
          padding: 24px 20px;
        }
        
        .header h1 {
          font-size: 24px;
        }
        
        .reset-button {
          padding: 14px 28px;
          font-size: 15px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <!-- Header -->
      <div class="header">
        <div class="logo">⏰</div>
        <h1>Time-Tracker </h1>
        <p>Professional timesheet management</p>
      </div>
      
      <!-- Content -->
      <div class="content">
        <div class="greeting">Hello ${userName},</div>
        
        <div class="message">
          We received a request to reset the password for your Time-Tracker  account. If this was you, click the button below to create a new password.
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
          <p>The Time-Tracker  Team</p>
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
Time-Tracker  - Reset Your Password

Hello ${userName},

We received a request to reset the password for your Time-Tracker  account.

Reset your password by clicking this link:
${resetLink}

SECURITY NOTICE:
- This link expires in 1 hour for your security
- If you didn't request this, you can safely ignore this email
- Your account remains secure

If the link doesn't work, copy and paste it into your browser.

Having trouble? Contact your system administrator for assistance.

Best regards,
The Time-Tracker  Team

---
This is an automated message, please do not reply to this email.
🔒 Secure | ⚡ Fast | ✅ Reliable
  `;
};

const sendResetPasswordEmail = async (to, name = "User", url) => {
  console.log("Sending password reset email to:", to);
  console.log("Reset URL:", url);
  
  const subject = "Reset Your Password - Time-Tracker ";
  const html = getResetPasswordHtmlTemplate(url, name);
  const text = getResetPasswordTextTemplate(url, name);

  try {
    await transporter.sendMail({
      from: `"Time-Tracker " <${process.env.EMAIL}>`,
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
