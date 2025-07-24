import mongoose from 'mongoose';

const timesheetSchema = new mongoose.Schema({

}, { timestamps: true });

const Timesheet = mongoose.model('Timesheet', timesheetSchema);
export default Timesheet;
