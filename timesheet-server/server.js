import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import timesheetRoutes from './routes/timeSheet.routes.js';

dotenv.config(); 

const app = express();

// Connect to MongoDB
connectDB(); 

// middlerware

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// define Routes
app.use('/api/users', userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/timesheets", timesheetRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port -: http://localhost:${PORT}`);
});