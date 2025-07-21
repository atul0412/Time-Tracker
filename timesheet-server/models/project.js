import mongoose from 'mongoose';

const fieldSchema = new mongoose.Schema({
  fieldName: {
    type: String,
    required: true
  },
  fieldType: {
    type: String,
    required: true,
    enum: ['text', 'number', 'date', 'time', 'dropdown']
  },
  options: {
    type: [String], // Only used for dropdown
    default: []
  }
});

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fields: [fieldSchema]
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);
export default Project;
