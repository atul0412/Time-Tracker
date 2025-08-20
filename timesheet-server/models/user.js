

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['admin', 'user', 'project_manager'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Check if the model already exists to avoid OverwriteModelError
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
