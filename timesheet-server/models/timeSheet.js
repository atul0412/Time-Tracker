import mongoose from "mongoose";

const timesheetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    
    data: { type: mongoose.Schema.Types.Mixed }, // or you can use Map or Object
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Timesheet = mongoose.model("Timesheet", timesheetSchema);
export default Timesheet;
