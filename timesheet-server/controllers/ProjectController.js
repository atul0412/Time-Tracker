// controllers/projectController.js
import mongoose from "mongoose";
import Project from "../models/project.js";
import AssignedProject from "../models/assignedProject.js";
import User from "../models/user.js";
import { sendProjectAssignmentEmail, sendProjectDeassignmentEmail } from "../utils/sendEmail.js"; // ✅ Import email functions

export const createProject = async (req, res) => {
  try {
    const { name, projectManagers, description, fields } = req.body;

    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No user info found" });
    }

    const newProject = await Project.create({
      name,
      description,
      projectManagers,
      fields,
      createdBy: req.user._id,
    });

    if (Array.isArray(projectManagers) && projectManagers.length > 0) {
      const assignments = projectManagers.map((managerId) => ({
        user: managerId,
        project: newProject._id,
      }));

      await AssignedProject.insertMany(assignments);

      // ✅ Send assignment emails to new project managers
      try {
        for (const managerId of projectManagers) {
          const manager = await User.findById(managerId);
          if (manager) {
            await sendProjectAssignmentEmail(
              manager.email,
              manager.name,
              newProject.name,
              newProject.description,
              req.user.name || 'Admin'
            );
          }
        }
      } catch (emailError) {
        console.error('Failed to send assignment emails during project creation:', emailError);
      }
    }

    res.status(201).json(newProject);
  } catch (err) {
    console.error("Create Project Error:", err);
    res
      .status(500)
      .json({ message: "Failed to create project", error: err.message });
  }
};

export const getAllProjects = async (req, res) => {
  try {
    let projects;

    if (req.user.role === "admin") {
      // Admin: return all projects with creator info in the same structure
      projects = await Project.find()
        .populate("createdBy", "name email")
        .lean();

      projects = projects.map((p) => ({
        _id: p._id,
        project: {
          _id: p._id,
          name: p.name,
          description: p.description,
          createdAt: p.createdAt,
        },
        user: {
          _id: p.createdBy?._id,
          name: p.createdBy?.name,
          email: p.createdBy?.email,
        },
      }));
    } else if (req.user.role === "project_manager") {
      // Manager: only assigned projects
      projects = await Project.aggregate([
        {
          $match: {
            projectManagers: {
              $in: [new mongoose.Types.ObjectId(req.user._id)],
            },
          },
        },
        {
          $addFields: {
            project: {
              _id: "$_id",
              name: "$name",
              description: "$description",
              createdAt: "$createdAt",
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "projectManagers",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        { $match: { "user._id": new mongoose.Types.ObjectId(req.user._id) } },
        {
          $project: {
            _id: 1,
            project: 1,
            user: {
              _id: "$user._id",
              name: "$user.name",
              email: "$user.email",
              role: "$user.role",
            },
          },
        },
      ]);
    } else {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    // console.log("Projects fetched:", projects);
    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) },
      },
      {
        $lookup: {
          from: "users", // collection name in MongoDB
          localField: "projectManagers",
          foreignField: "_id",
          as: "projectManagersDetails",
        },
      },
    ]);

    if (!project || project.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({ success: true, data: project[0] });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to get project", error: err.message });
  }
};

export const deleteProject = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }

  try {
    // UPDATED: Find project first to get project details before deletion
    const projectToDelete = await Project.findById(req.params.id);
    if (!projectToDelete) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Store project details before deletion
    const deletedProjectInfo = {
      _id: projectToDelete._id,
      name: projectToDelete.name,
      description: projectToDelete.description,
      startDate: projectToDelete.startDate,
      endDate: projectToDelete.endDate,
      status: projectToDelete.status
    };

    // Now delete the project
    const deleted = await Project.findByIdAndDelete(req.params.id);

    // UPDATED: Include deleted project info in response for audit logging
    res.json({ 
      message: "Project deleted successfully",
      project: deletedProjectInfo // Include project info for audit logging
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete project", error: err.message });
  }
};


// ✅ ENHANCED: Update project with automatic assignment/deassignment
export const updateProject = async (req, res) => {
 if (req.user.role !== "admin" && req.user.role !== "project_manager") {
  return res.status(403).json({ message: "Access denied: Admins or Project Managers only" });
}

  try {
    const { id } = req.params;
    const { name, description, projectManagers, fields } = req.body;

    // ✅ Get the existing project to compare project managers
    const existingProject = await Project.findById(id);
    if (!existingProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Build update object with any provided fields
    const updateObj = {};
    if (name !== undefined) updateObj.name = name;
    if (description !== undefined) updateObj.description = description;
    if (projectManagers !== undefined) updateObj.projectManagers = projectManagers;
    if (fields !== undefined) updateObj.fields = fields;

    // Update the project document
    const updated = await Project.findByIdAndUpdate(id, updateObj, {
      new: true,
      runValidators: true,
    });

    // ✅ Handle project manager assignment/deassignment changes
    if (projectManagers !== undefined) {
      const existingManagers = existingProject.projectManagers || [];
      const newManagers = projectManagers || [];

      // Convert ObjectIds to strings for comparison
      const existingManagerIds = existingManagers.map(id => id.toString());
      const newManagerIds = newManagers.map(id => id.toString());

      // Calculate managers to assign (new managers not in existing)
      const managersToAssign = newManagerIds.filter(id => !existingManagerIds.includes(id));
      
      // Calculate managers to deassign (existing managers not in new)
      const managersToDeassign = existingManagerIds.filter(id => !newManagerIds.includes(id));

      // console.log('Managers to assign:', managersToAssign);
      // console.log('Managers to deassign:', managersToDeassign);

      // ✅ Assign new managers
      if (managersToAssign.length > 0) {
        const newAssignments = managersToAssign.map(managerId => ({
          user: managerId,
          project: id,
        }));

        await AssignedProject.insertMany(newAssignments);

        // Send assignment emails to new managers
        try {
          for (const managerId of managersToAssign) {
            const manager = await User.findById(managerId);
            if (manager) {
              await sendProjectAssignmentEmail(
                manager.email,
                manager.name,
                updated.name,
                updated.description,
                req.user.name || 'Admin'
              );
              // console.log(`✅ Assignment email sent to ${manager.email} for project: ${updated.name}`);
            }
          }
        } catch (emailError) {
          console.error('❌ Failed to send assignment emails:', emailError);
        }
      }

      // ✅ Deassign removed managers
      if (managersToDeassign.length > 0) {
        // Get assignments to deassign for email purposes
        const assignmentsToRemove = await AssignedProject.find({
          user: { $in: managersToDeassign },
          project: id
        }).populate('user', 'name email');

        // Send deassignment emails before removing assignments
        try {
          for (const assignment of assignmentsToRemove) {
            if (assignment.user) {
              await sendProjectDeassignmentEmail(
                assignment.user.email,
                assignment.user.name,
                updated.name,
                updated.description,
                req.user.name || 'Admin'
              );
              // console.log(`✅ Deassignment email sent to ${assignment.user.email} for project: ${updated.name}`);
            }
          }
        } catch (emailError) {
          console.error('❌ Failed to send deassignment emails:', emailError);
        }

        // Remove assignments
        await AssignedProject.deleteMany({
          user: { $in: managersToDeassign },
          project: id
        });
      }

      // console.log(`Updated project managers for project ${id}. Assigned: ${managersToAssign.length}, Deassigned: ${managersToDeassign.length}`);
    }

    // Aggregation to get project with populated projectManagersDetails
    const project = await Project.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "users", // your users collection name
          localField: "projectManagers",
          foreignField: "_id",
          as: "projectManagersDetails",
        },
      },
    ]);

    res.status(200).json({ 
      success: true, 
      data: project[0],
      message: "Project updated successfully with manager assignments/deassignments processed"
    });
  } catch (err) {
    console.error("Update Project Error:", err);
    res
      .status(500)
      .json({ message: "Failed to update project", error: err.message });
  }
};

export const updateAssignProjectToUser = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }

  try {
    const { userId, projectId } = req.body;

    if (!userId || !projectId) {
      return res.status(400).json({ message: "Missing userId or projectId" });
    }

    const project = await Project.findByIdAndUpdate(
      projectId,
      { $addToSet: { assignedUsers: userId } }, // Prevents duplicate assignments
      { new: true }
    ).populate("assignedUsers", "name email"); // Optional: populate user info

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({
      success: true,
      message: "Project assigned successfully",
      data: project,
    });
  } catch (err) {
    console.error("Assign Project Error:", err);
    res
      .status(500)
      .json({ message: "Failed to assign project", error: err.message });
  }
};

export const getMyProjects = async (req, res) => {
  try {
    const userId = req.user._id;

    const projects = await Project.find({ assignedUsers: userId })
      .populate("createdBy", "name")
      .populate("assignedUsers", "name email");

    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error("Get My Projects Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch assigned projects",
      error: error.message,
    });
  }
};
