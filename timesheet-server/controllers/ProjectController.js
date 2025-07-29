// controllers/projectController.js
import Project from "../models/project.js";
export const createProject = async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    console.log("User:", req.user); // should contain _id

    const { name, description, fields } = req.body;

    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No user info found" });
    }

    const newProject = await Project.create({
      name,
      description,
      fields,
      createdBy: req.user._id,
    });

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
    const projects = await Project.find().populate("createdBy", "name");
    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
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
    const project = await Project.findById(id).populate("name");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({ success: true, data: project });
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
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }

  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const updated = await Project.findByIdAndUpdate(
      id,
      { name, description },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('Update Project Error:', err);
    res.status(500).json({ message: 'Failed to update project', error: err.message });
  }
};

// ✅ Admin-only: Assign a project to a user
export const assignProjectToUser = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }

  try { 
    const { userId, projectId } = req.body;

    if (!userId || !projectId) {
      return res.status(400).json({ message: 'Missing userId or projectId' });
    }

    const project = await Project.findByIdAndUpdate(
      projectId,
      { $addToSet: { assignedUsers: userId } }, // Prevents duplicate assignments
      { new: true }
    ).populate('assignedUsers', 'name email'); // Optional: populate user info

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json({ success: true, message: 'Project assigned successfully', data: project });
  } catch (err) {
    console.error('Assign Project Error:', err);
    res.status(500).json({ message: 'Failed to assign project', error: err.message });
  }
};
