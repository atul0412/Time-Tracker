// controllers/projectController.js
import Project from '../models/project.js';

export const createProject = async (req, res) => {
  try {
    const { name, description, fields } = req.body;

    const newProject = await Project.create({
      name,
      description,
      fields,
      createdBy: req.user._id
    });

    res.status(201).json(newProject);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create project', error: err.message });
  }
};

export const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch projects', error: err.message });
  }
};

// ✅ Admin-only: delete project
export const deleteProject = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }

  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete project', error: err.message });
  }
};
