import mongoose from 'mongoose';

const timesheetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  // Dynamic timesheet values based on project.fields
  data: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,  // value can be string, number, boolean, etc.
    required: true
  }
}, { timestamps: true });

const Timesheet = mongoose.model('Timesheet', timesheetSchema);
export default Timesheet;
