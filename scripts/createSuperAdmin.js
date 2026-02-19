import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from '../src/modules/users/user.model.js';

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const createSuperAdmin = async () => {
  const exists = await User.findOne({ role: "super_admin" });

  if (exists) {
    console.log("Super Admin already exists");
    process.exit();
  }

  const password = await bcrypt.hash("Super@123", 10);

  await User.create({
    tenantId: null,
    name: "Platform Super Admin",
    email: "tejaskhairnar.ukvalley@gmail.com",
    password,
    role: "super_admin",
    status: "active",
  });

  console.log("✅ Super Admin created");
  process.exit();
};

createSuperAdmin();
