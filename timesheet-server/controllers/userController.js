import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendEmail  from '../utils/sendEmail.js';// Assume you have this
import { decrypt, encrypt } from '../utils/encryption.js'

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
    });

    res.status(201).json({ message: 'User registered successfully', userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '2d',
    });

    res.json({ token, user: { name: user.name, email: user.email, role: user.role, id:user._id } });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
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

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
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
    console.log(encryptedToken)
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


    // Optional: Check if the token is expired (e.g., 1 hour = 3600000 ms)
    if (Date.now() - timestamp > 3600000) {
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
