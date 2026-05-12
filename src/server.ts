import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import rootRouter from "./index.routes";

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:3000", // Your Next.js URL
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Clinic System API is running...");
});

app.use("/api", rootRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});