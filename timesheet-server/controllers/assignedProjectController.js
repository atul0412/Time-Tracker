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

// ✅ NEW: Deassign project from user
export const deassignProjectFromUser = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }

  try {
    const { assignmentId } = req.params;

    // Validate assignmentId
    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        message: 'Assignment ID is required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID format'
      });
    }

    // Find the assignment with populated user and project data
    const assignment = await AssignedProject.findById(assignmentId)
      .populate('user', 'name email')
      .populate('project', 'name description');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found or already removed'
      });
    }

    // Store assignment details for response message
    const userName = assignment.user?.name || 'Unknown User';
    const projectName = assignment.project?.name || 'Unknown Project';

    // Delete the assignment
    await AssignedProject.findByIdAndDelete(assignmentId);

    // Optional: Log the deassignment
    console.log(`Deassigned ${userName} from project "${projectName}"`);

    res.status(200).json({
      success: true,
      message: `Successfully removed ${userName} from project "${projectName}"`,
      data: {
        removedAssignment: {
          id: assignment._id,
          user: {
            id: assignment.user._id,
            name: assignment.user.name,
            email: assignment.user.email
          },
          project: {
            id: assignment.project._id,
            name: assignment.project.name
          },
          removedAt: new Date()
        }
      }
    });

  } catch (error) {
    console.error('Error deassigning project:', error);
    
    // Handle specific errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID format'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while deassigning project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ Alternative: Deassign by userId and projectId (if you prefer this approach)
export const deassignProjectByIds = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }

  try {
    const { userId, projectId } = req.body;

    if (!userId || !projectId) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing userId or projectId' 
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId or projectId format'
      });
    }

    // Find and delete the assignment
    const assignment = await AssignedProject.findOneAndDelete({ 
      user: userId, 
      project: projectId 
    })
    .populate('user', 'name email')
    .populate('project', 'name description');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found. User may not be assigned to this project.'
      });
    }

    const userName = assignment.user?.name || 'Unknown User';
    const projectName = assignment.project?.name || 'Unknown Project';

    res.status(200).json({
      success: true,
      message: `Successfully removed ${userName} from project "${projectName}"`,
      data: {
        removedAssignment: {
          id: assignment._id,
          user: assignment.user,
          project: assignment.project,
          removedAt: new Date()
        }
      }
    });

  } catch (error) {
    console.error('Error deassigning project by IDs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deassigning project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ Get all assigned projects with populated user and project data
export const getAllAssignedProjects = async (req, res) => {
  try {
    const assignments = await AssignedProject.find()
      .populate('user', 'name email')
      .populate('project', 'name description');

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

// ✅ NEW: Get assignment details by assignment ID
export const getAssignmentById = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID format'
      });
    }

    const assignment = await AssignedProject.findById(assignmentId)
      .populate('user', 'name email')
      .populate('project', 'name description');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: assignment
    });

  } catch (error) {
    console.error('Get Assignment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignment details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
