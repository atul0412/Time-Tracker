import mongoose from 'mongoose';

const assignedProjectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  },
});

const AssignedProject = mongoose.model('AssignedProject', assignedProjectSchema);

export default AssignedProject;
