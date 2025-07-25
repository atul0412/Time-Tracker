import mongoose from 'mongoose';

// Schema for each field in the dynamic timesheet
const fieldSchema = new mongoose.Schema({
  fieldName: {
    type: String,
    required: true
  },
  fieldType: {
    type: String,
    enum: ['String', 'Number', 'Date', 'Boolean'],
    required: true
  },
  required: {
    type: Boolean,
    default: false
  }
});

// Project schema with dynamic timesheet fields
const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    description: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    fields: [fieldSchema]
  },
  { timestamps: true }
);


const Project = mongoose.model('Project', projectSchema);
export default Project;
