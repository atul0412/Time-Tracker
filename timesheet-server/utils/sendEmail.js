import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
import {
  getProjectAssignmentHtmlTemplate,
  getProjectAssignmentTextTemplate,
  getProjectDeassignmentHtmlTemplate,
  getProjectDeassignmentTextTemplate,
  getResetPasswordHtmlTemplate,
  getResetPasswordTextTemplate,
  getWelcomeEmailHtmlTemplate,
  getWelcomeEmailTextTemplate
} from "./emails/emailTemplates.js";

// --- Transporter ---
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

// // --- SEND EMAIL FUNCTIONS
const sendProjectAssignmentEmail = async (
  to,
  userName = "User",
  projectName,
  projectDescription = "",
  assignedBy = "Project Manager"
) => {
  const subject = `🎯 New Project Assignment: ${projectName} - Time-Tracker`;
  const html = getProjectAssignmentHtmlTemplate(projectName, projectDescription, assignedBy, userName);
  const text = getProjectAssignmentTextTemplate(projectName, projectDescription, assignedBy, userName);

  try {
    await transporter.sendMail({ from: `"Time-Tracker Project Management" <${process.env.EMAIL}>`, to, subject, text, html });
    // console.log("✅ Project assignment email sent successfully");
  } catch (error) {
    console.error("❌ Error sending project assignment email:", error);
    throw error;
  }
};

const sendProjectDeassignmentEmail = async (
  to,
  userName = "User",
  projectName,
  projectDescription = "",
  deassignedBy = "Project Manager"
) => {
  const subject = `📋 Project Deassignment Notice: ${projectName} - Time-Tracker`;
  const html = getProjectDeassignmentHtmlTemplate(projectName, projectDescription, deassignedBy, userName);
  const text = getProjectDeassignmentTextTemplate(projectName, projectDescription, deassignedBy, userName);

  try {
    await transporter.sendMail({ from: `"Time-Tracker Project Management" <${process.env.EMAIL}>`, to, subject, text, html });
    // console.log("✅ Project deassignment email sent successfully");
  } catch (error) {
    console.error("❌ Error sending project deassignment email:", error);
    throw error;
  }
};

const sendResetPasswordEmail = async (to, name = "User", url) => {
  const subject = "Reset Your Password - Time-Tracker";
  const html = getResetPasswordHtmlTemplate(url, name);
  const text = getResetPasswordTextTemplate(url, name);

  try {
    await transporter.sendMail({ from: `"Time-Tracker" <${process.env.EMAIL}>`, to, subject, text, html });
    // console.log("✅ Password reset email sent successfully");
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
    throw error;
  }
};

const sendWelcomeEmail = async (to, userName = "User", setupPasswordLink) => {
  const subject = `🎉 Welcome to Time-Tracker, ${userName}!`;
  const html = getWelcomeEmailHtmlTemplate(userName, setupPasswordLink);
  const text = getWelcomeEmailTextTemplate(userName, setupPasswordLink);

  try {
    await transporter.sendMail({ from: `"Time-Tracker" <${process.env.EMAIL}>`, to, subject, text, html });
    // console.log("✅ Welcome email sent successfully");
    console.log("email", process.env.EMAIL);
    console.log("email-pass", process.env.EMAIL_PASS);
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
    throw error;
  }
};

// --- EXPORTS ---
export { sendProjectAssignmentEmail, sendProjectDeassignmentEmail, sendWelcomeEmail };
export default sendResetPasswordEmail;