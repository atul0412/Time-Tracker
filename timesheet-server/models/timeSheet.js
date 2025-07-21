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
  data: {
    type: mongoose.Schema.Types.Mixed, // Stores dynamic values
    required: true
  }
}, { timestamps: true });

const Timesheet = mongoose.model('Timesheet', timesheetSchema);
export default Timesheet;
