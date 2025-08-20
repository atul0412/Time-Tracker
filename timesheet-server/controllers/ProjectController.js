// controllers/projectController.js
import mongoose from "mongoose";
import Project from "../models/project.js";
import AssignedProject from "../models/assignedProject.js";
export const createProject = async (req, res) => {
  try {
    // console.log("Request Body:", req.body);
    // console.log("User:", req.user); // should contain _id

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
   }
// console.log("New Project Created:", newProject);
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
      projects = await AssignedProject.aggregate([
        {
          $match: { user: new mongoose.Types.ObjectId(req.user._id) },
        },
        {
          $lookup: {
            from: "projects",
            localField: "project",
            foreignField: "_id",
            as: "projectInfo",
          },
        },
        { $unwind: "$projectInfo" },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        { $unwind: "$userInfo" },
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
    } else {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

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
// ✅ NEW: Get project by ID
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) }
      },
      {
        $lookup: {
          from: "users", // collection name in MongoDB
          localField: "projectManagers",
          foreignField: "_id",
          as: "projectManagersDetails"
        }
      }
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

// ✅ Admin-only: delete project
export const deleteProject = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }

  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete project", error: err.message });
  }
};

// ✅ Admin-only: update project
export const updateProject = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }
  
  try {
    const { id } = req.params;
    const { name, description, projectManagers, fields } = req.body;

    // Build update object with any provided fields
    const updateObj = {};
    if (name !== undefined) updateObj.name = name;
    if (description !== undefined) updateObj.description = description;
    if (projectManagers !== undefined) updateObj.projectManagers = projectManagers;
    if (fields !== undefined) updateObj.fields = fields;

    // Update the project document
    const updated = await Project.findByIdAndUpdate(
      id,
      updateObj,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Project not found" });
    }

    // ✅ NEW: Update AssignedProject collection if projectManagers changed
    if (projectManagers !== undefined) {
      await AssignedProject.updateMany(
        { project: id },
        { 
          $set: { 
            // Update any embedded project manager references if your schema includes them
            // This depends on your AssignedProject schema structure
            projectManagers: projectManagers 
          }
        }
      );
      
      console.log(`Updated project managers for all assignments in project ${id}`);
    }

    // Aggregation to get project with populated projectManagersDetails
    const project = await Project.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "users", // your users collection name
          localField: "projectManagers",
          foreignField: "_id",
          as: "projectManagersDetails"
        }
      }
    ]);

    res.status(200).json({ success: true, data: project[0] });
  } catch (err) {
    console.error("Update Project Error:", err);
    res
      .status(500)
      .json({ message: "Failed to update project", error: err.message });
  }
};


// ✅ Admin-only: Assign a project to a user
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

    res
      .status(200)
      .json({
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
