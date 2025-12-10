import mongoose from "mongoose";
import AssignedProject from "../models/assignedProject.js";
import Project from "../models/project.js";
import User from "../models/user.js";
import { sendProjectAssignmentEmail, sendProjectDeassignmentEmail } from "../utils/sendEmail.js"; // ✅ Import both email functions

// Assign project to user (admin OR project manager if they manage this project)
export const assignProjectToUser = async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "project_manager") {
    return res.status(403).json({ message: "Access denied: Admins or project managers only" });
  }

  try {
    const { userId, projectId } = req.body;

    if (!userId || !projectId) {
      return res.status(400).json({ message: "Missing userId or projectId" });
    }

    const existing = await AssignedProject.findOne({ user: userId, project: projectId });
    if (existing) {
      return res.status(400).json({ message: "Project already assigned to this user" });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.user.role === "project_manager") {
      const isManager =
        Array.isArray(project.projectManagers) &&
        project.projectManagers.some(
          manager => manager.toString() === req.user._id.toString()
        );
      if (!isManager) {
        return res.status(403).json({ message: "Access denied: You are not a manager for this project." });
      }
    }

    const assignment = await AssignedProject.create({
      user: userId,
      project: projectId,
    });

    const populatedAssignment = await AssignedProject.findById(assignment._id)
      .populate("user", "name email")
      .populate("project", "name description");

    // 🚀 Email status variables
    let emailStatus = "success";
    let emailErrorMessage = null;

    try {
      await sendProjectAssignmentEmail(
        user.email,
        user.name,
        project.name,
        project.description,
        req.user.name || "Project Manager"
      );
    } catch (emailError) {
      emailStatus = "failed";
      emailErrorMessage = emailError.message;
      console.error("Failed to send project assignment email:", emailError.message);
    }

    res.status(201).json({
      success: true,
      message: "Project assigned successfully",
      assignment: populatedAssignment,
      emailStatus,
      emailError: emailErrorMessage,
    });

  } catch (err) {
    console.error("Assign Project Error:", err);
    res.status(500).json({ message: "Failed to assign project", error: err.message });
  }
};



// ✅ UPDATED: Deassign project from user with email notification and audit logging
export const deassignProjectFromUser = async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "project_manager") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const { assignmentId } = req.params;

    if (!assignmentId) {
      return res.status(400).json({ success: false, message: "Assignment ID is required" });
    }

    const assignment = await AssignedProject.findById(assignmentId)
      .populate("user", "name email")
      .populate("project", "name description");

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    let emailStatus = "success";
    let emailErrorMessage = null;

    try {
      await sendProjectDeassignmentEmail(
        assignment.user.email,
        assignment.user.name,
        assignment.project.name,
        assignment.project.description,
        req.user.name || "Project Manager"
      );
    } catch (emailError) {
      emailStatus = "failed";
      emailErrorMessage = emailError.message;
      console.error("Failed to send deassignment email:", emailError.message);
    }

    await AssignedProject.findByIdAndDelete(assignmentId);

    res.status(200).json({
      success: true,
      message: "User deassigned successfully",
      assignmentId,
      emailStatus,
      emailError: emailErrorMessage,
    });

  } catch (error) {
    console.error("Error deassigning project:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ✅ UPDATED: Alternative deassign by userId and projectId with email notification and audit logging
export const deassignProjectByIds = async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "project_manager") {
    return res.status(403).json({ message: "Access denied: Admins or project managers only" });
  }

  try {
    const { userId, projectId } = req.body;

    if (!userId || !projectId) {
      return res.status(400).json({
        success: false,
        message: "Missing userId or projectId",
      });
    }

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(projectId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId or projectId format",
      });
    }

    // ✅ Find the assignment with populated data BEFORE deleting
    const assignment = await AssignedProject.findOne({
      user: userId,
      project: projectId,
    })
      .populate("user", "name email")
      .populate("project", "name description");

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found. User may not be assigned to this project.",
      });
    }

    const userName = assignment.user?.name || "Unknown User";
    const projectName = assignment.project?.name || "Unknown Project";
    const userEmail = assignment.user?.email;
    const projectDescription = assignment.project?.description;

    // ✅ Send project deassignment email BEFORE deleting
    try {
      if (userEmail) {
        await sendProjectDeassignmentEmail(
          userEmail,                              // to
          userName,                               // userName
          projectName,                            // projectName
          projectDescription,                     // projectDescription
          req.user.name || 'Project Manager'     // deassignedBy
        );
        // console.log(`Project deassignment email sent to ${userEmail} for project: ${projectName}`);
      }
    } catch (emailError) {
      console.error(' Failed to send project deassignment email:', emailError);
      // Don't fail the deassignment if email fails - log it instead
    }

    // ✅ Delete the assignment after sending email
    await AssignedProject.findOneAndDelete({
      user: userId,
      project: projectId,
    });

    // UPDATED: Structure response for audit logger
    res.status(200).json({
      success: true,
      message: `Successfully removed ${userName} from project "${projectName}" and notification sent`,
      project: {
        id: assignment.project._id,
        name: assignment.project.name,
        description: assignment.project.description
      },
      user: {
        id: assignment.user._id,
        name: assignment.user.name,
        email: assignment.user.email
      },
      deassignedBy: req.user.name || 'Project Manager',
      removedAssignment: {
        id: assignment._id,
        user: assignment.user,
        project: assignment.project,
        deassignedBy: req.user.name || 'Project Manager',
        removedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error deassigning project by IDs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while deassigning project",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


// ✅ Get all assigned projects with populated user and project data
export const getAllAssignedProjects = async (req, res) => {
  try {
    const assignments = await AssignedProject.find()
      .populate("user", "name email role")
      .populate("project", "name description");

    res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (err) {
    console.error("Get Assigned Projects Error:", err);
    res.status(500).json({
      message: "Failed to fetch assigned projects",
      error: err.message,
    });
  }
};

// GET assigned projects by user ID
export const getAssignedProjectsByUserId = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid userId" });
  }

  try {
    const assignments = await AssignedProject.aggregate([
      {
        $match: { user: new mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: "projects",
          localField: "project",
          foreignField: "_id",
          as: "projectInfo",
        },
      },
      {
        $unwind: "$projectInfo",
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo",
      },
      {
        $project: {
          _id: 1,
          project: {
            _id: "$projectInfo._id",
            name: "$projectInfo.name",
            description: "$projectInfo.description",
            createdAt: "$projectInfo.createdAt",
          },
          user: {
            _id: "$userInfo._id",
            name: "$userInfo.name",
            email: "$userInfo.email",
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (err) {
    console.error("Aggregation Error:", err);
    res.status(500).json({
      message: "Failed to fetch assigned projects using aggregation",
      error: err.message,
    });
  }
};

// ✅ NEW: Get assignment details by assignment ID
export const getAssignmentById = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID format",
      });
    }

    const assignment = await AssignedProject.findById(assignmentId)
      .populate("user", "name email role")
      .populate("project", "name description");

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error("Get Assignment Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch assignment details",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ✅ Get all assigned users by project ID
export const getAssignedUsersByProjectId = async (req, res) => {
  const { projectId } = req.params;

  // Validate projectId
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ message: "Invalid projectId" });
  }

  try {
    const assignments = await AssignedProject.aggregate([
      {
        $match: { project: new mongoose.Types.ObjectId(projectId) },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo",
      },
      {
        $lookup: {
          from: "projects",
          localField: "project",
          foreignField: "_id",
          as: "projectInfo",
        },
      },
      {
        $unwind: "$projectInfo",
      },
      {
        $project: {
          _id: 1,
          user: {
            _id: "$userInfo._id",
            name: "$userInfo.name",
            email: "$userInfo.email",
          },
          project: {
            _id: "$projectInfo._id",
            name: "$projectInfo.name",
            description: "$projectInfo.description",
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (err) {
    console.error("Error fetching assigned users:", err);
    res.status(500).json({
      message: "Failed to fetch assigned users for this project",
      error: err.message,
    });
  }
};
