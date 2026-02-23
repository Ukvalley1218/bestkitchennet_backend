import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import app from "./src/app.js";

dotenv.config();

// connect to db 
await connectDB();

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Welcome to the SaaS backend!");
});

app.listen(PORT, () => {
  console.log(`🚀 SaaS backend running on port http://localhost:${PORT}`);
});