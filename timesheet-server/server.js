import express from "express";
import dotenv from "dotenv";
import cors from 'cors';
import connectDB from "./config/db.js";
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import timesheetRoutes from './routes/timeSheet.routes.js';
import assignProject from './routes/assignProject.route.js';
import auditRoutes from './routes/auditRoutes.js';
import auditLogger from "./middleware/auditLogger.js";

dotenv.config(); 

const app = express();

// Connect to MongoDB
connectDB(); 

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://time-sheet-039j-cztdt77pz-atul0412s-projects.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Must handle preflight
app.options("*", cors());


// Apply audit logging middleware before routes
app.use(auditLogger({
  skipEndpoints: ['/health', '/api/audit'], // Skip these endpoints
  requireAuth: false
}));

// Define Routes
app.use('/api/users', userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/timesheets", timesheetRoutes);
app.use('/api/assignProject', assignProject); 
app.use('/api/audit', auditRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port -: http://localhost:${PORT}`);
});
