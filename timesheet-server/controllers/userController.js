import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendEmail, { sendWelcomeEmail } from '../utils/sendEmail.js';// Assume you have this
import { decrypt, encrypt } from '../utils/encryption.js'
import AuditLog from '../models/AuditLog.js';

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1️⃣ Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // 2️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3️⃣ Create user in DB
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    // 4️⃣ Prepare reset token (for email)
    const payload = { id: user._id, email: user.email };
    const encryptedToken = encodeURIComponent(encrypt(payload));
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${encryptedToken}`;

    let emailStatus = "success";

    // 5️⃣ Try sending welcome email (non-blocking)
    try {
      console.log("📧 Starting welcome email...");
      await sendWelcomeEmail(user.email, "Welcome to Time-Tracker!", resetUrl);
      console.log("📧 Email sent successfully");
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError.message);
      emailStatus = "failed"; // mark failed but continue
    }

    // 6️⃣ FINAL RESPONSE (user created even if email failed)
    console.log("✔ User added sucessfully ");

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      emailStatus,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (err) {
    console.error("❌ Registration failed:", err.message);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: err.message,
    });
  }
};



export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email,
        name: user.name  // Add name to JWT payload
      },
      process.env.JWT_SECRET,
      { expiresIn: '2d' }
    );

    // Return response - audit logger middleware will handle logging automatically
    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        id: user._id
      }
    });

  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};


// Add this to your existing authController.js file

export const logoutUser = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Your audit logger middleware will automatically capture this
    // as a LOGOUT action because the URL includes '/logout'

    res.status(200).json({
      success: true,
      message: 'Logout successful',
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email
      }
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};



// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    // Allow only admins and project managers
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'project_manager')) {
      return res.status(403).json({ message: 'Access denied: Only admins and project managers allowed' });
    }

    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};


// ✅ Delete user (admin only)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    // UPDATED: Find user first to get user details before deletion
    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Store user details before deletion
    const deletedUserInfo = {
      _id: userToDelete._id,
      name: userToDelete.name,
      email: userToDelete.email,
      role: userToDelete.role
    };

    // Now delete the user
    const deletedUser = await User.findByIdAndDelete(id);

    // UPDATED: Include deleted user info in response for audit logging
    res.json({
      message: 'User deleted successfully',
      user: deletedUserInfo // Include user info for audit logging
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
};

// ✅ Update user details
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params; // user ID from URL
    const { name, email, password, role } = req.body;

    // Check permissions
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (req.user.role !== 'admin' && req.user.userId !== id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;

    // Only admin can update role
    if (role && req.user.role === 'admin') {
      user.role = role;
    }

    // If password provided, hash it
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      user.password = hashedPassword;
    }

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Update User Error:', err);
    res.status(500).json({ message: 'Failed to update user', error: err.message });
  }
};


// Forgot password

// export const forgotPassword = async (req, res) => {
//   const { email } = req.body;
//   const user = await User.findOne({ email });
//   if (!user) return res.status(404).json({ message: "User not found" });

//   const token = crypto.randomBytes(32).toString("hex");
//   user.resetToken = token;
//   user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
//   await user.save();

//  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;;
//   const message = `Click this link to reset your password: ${resetUrl}`;
//   await sendEmail(user.email, "Reset Password", message);

//   res.status(200).json({ message: "Reset email sent." });
// };

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const payload = {
      id: user._id,
      email: user.email
    };

    const encryptedToken = encodeURIComponent(encrypt(payload));
    // console.log(encryptedToken)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${encryptedToken}`;

    // const message = `Click this link to reset your password: ${resetUrl}`;

    await sendEmail(user.email, "Reset Password", resetUrl);

    res.status(200).json({ message: "Reset email sent." });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};


//  Reset password
// export const resetPassword = async (req, res) => {
//   const { token } = req.params;
//   const { password } = req.body;

//   if (!token) {
//     return res.status(400).json({ message: "Missing token" });
//   }

//   console.log("Reset token received:", token);

//   const user = await User.findOne({
//     resetToken: token,
//     resetTokenExpiry: { $gt: Date.now() },
//   });

//   if (!user) return res.status(400).json({ message: "Invalid or expired token." });

//   const hashedPassword = await bcrypt.hash(password, 12);
//   user.password = hashedPassword;
//   user.resetToken = undefined;
//   user.resetTokenExpiry = undefined;

//   await user.save();
//   res.status(200).json({ message: "Password reset successful." });
// };

export const resetPassword = async (req, res) => {
  const { token } = req.query; // token passed as a query param now
  const { password } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Missing token" });
  }

  try {
    // Decrypt the token to get the payload
    const { payload, timestamp } = decrypt(decodeURIComponent(token));
    const { id } = payload;


    // Optional: Check if the token is expired (e.g., valid for 24 hours)
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
      return res.status(400).json({ message: "Token expired" });
    }


    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;

    await user.save();
    res.status(200).json({ message: "Password reset successful." });

  } catch (err) {
    console.error("Reset Password Error:", err.message);
    return res.status(400).json({ message: "Invalid or tampered token" });
  }
};
