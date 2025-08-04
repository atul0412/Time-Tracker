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

const getResetPasswordHtmlTemplate = (resetLink) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Reset Your Password</title>
    <style>
      body {
        font-family: 'Segoe UI', sans-serif;
        background-color: #f4f4f4;
        padding: 30px;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background: #fff;
        padding: 25px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      }
      h2 {
        color:  #6e11b0;
      }
      a.button {
        display: inline-block;
        padding: 12px 20px;
        margin-top: 20px;
        background-color:  #6e11b0;
        color: #fff;
        text-decoration: none;
        border-radius: 5px;
      }
      .footer {
        margin-top: 30px;
        font-size: 0.85em;
        color: #888;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Reset Your Password</h2>
      <p>Hello,</p>
      <p>We received a request to reset your password. Click the button below to set a new one:</p>
      <a href="${resetLink}" class="button">Reset Password</a>
      <p>If you didn’t request this, you can safely ignore this email.</p>
      <div class="footer">
        <p>Thanks,<br/>The Your App Team</p>
      </div>
    </div>
  </body>
  </html>
  `;
};

const getResetPasswordTextTemplate = (resetLink) => {
  return `
Hello,

We received a request to reset your password.

Click the link below to reset it:
${resetLink}

If you didn’t request this, you can safely ignore this email.

Thanks,  
The Your App Team
  `;
};

const sendResetPasswordEmail = async (to, name, url) => {
  console.log(url)
  const subject = "Reset Your Password";
  const html = getResetPasswordHtmlTemplate(url);
  const text = getResetPasswordTextTemplate(url);

  await transporter.sendMail({
    from: `"Your App Name" <${process.env.EMAIL}>`,
    to,
    subject,
    text,
    html,
  });
};

export default sendResetPasswordEmail;
