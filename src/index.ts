import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import express from "express";
import router from "./routes/index.route";


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Clinic System API is running...");
});

app.use("/api", router);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});