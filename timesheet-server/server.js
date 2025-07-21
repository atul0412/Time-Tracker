import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config(); 

const app = express();

// Connect to MongoDB
connectDB(); 

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port -: http://localhost:${PORT}`);
});