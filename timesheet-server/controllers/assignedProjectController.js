import mongoose from 'mongoose';
import AssignedProject from '../models/assignedProject.js';

export const assignProjectToUser = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }

  try {
    const { userId, projectId } = req.body;

    if (!userId || !projectId) {
      return res.status(400).json({ message: 'Missing userId or projectId' });
    }

    // Check for duplicate assignment
    const existing = await AssignedProject.findOne({ user: userId, project: projectId });
    if (existing) {
      return res.status(400).json({ message: 'Project already assigned to this user' });
    }

    const assignment = await AssignedProject.create({
      user: userId,
      project: projectId,
    });

    res.status(201).json({
      success: true,
      message: 'Project assigned successfully',
      data: assignment,
    });
  } catch (err) {
    console.error('Assign Project Error:', err);
    res.status(500).json({ message: 'Failed to assign project', error: err.message });
  }
};

// ✅ NEW: Get all assigned projects with populated user and project data
export const getAllAssignedProjects = async (req, res) => {
  try {
    const assignments = await AssignedProject.find()
      .populate('user', 'name email')
      .populate('project', 'name');

    res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (err) {
    console.error('Get Assigned Projects Error:', err);
    res.status(500).json({ message: 'Failed to fetch assigned projects', error: err.message });
  }
};

// GET assigned projects by user ID
export const getAssignedProjectsByUserId = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid userId' });
  }

  try {
    const assignments = await AssignedProject.aggregate([
      {
        $match: { user: new mongoose.Types.ObjectId(userId) }
      },
      {
        $lookup: {
          from: 'projects',
          localField: 'project',
          foreignField: '_id',
          as: 'projectInfo'
        }
      },
      {
        $unwind: '$projectInfo'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          _id: 1,
          project: {
            _id: '$projectInfo._id',
            name: '$projectInfo.name',
            description: '$projectInfo.description',
            createdAt: '$projectInfo.createdAt'
          },
          user: {
            _id: '$userInfo._id',
            name: '$userInfo.name',
            email: '$userInfo.email'
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: assignments
    });
  } catch (err) {
    console.error('Aggregation Error:', err);
    res.status(500).json({
      message: 'Failed to fetch assigned projects using aggregation',
      error: err.message
    });
  }
};

