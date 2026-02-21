import express from "express";
import cors from "cors";
import routes from "./src/routes/index.js";
import errorMiddleware from "./src/middlewares/error.middleware.js";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import authRoutes from './src/modules/auth/auth.routes.js'
import superAdminRoutes from './src/modules/superAdmin/superAdmin.routes.js';
import userRoutes from './src/modules/users/user.routes.js';
import leadRoutes from './src/modules/crm/leads/lead.routes.js';
import customerRoutes from './src/modules/crm/customers/customer.routes.js';
import activityRoutes from './src/modules/crm/activities/activity.routes.js';
import quotationRoutes  from './src/modules/crm/quotations/quotation.routes.js';
import invoiceRoutes  from './src/modules/crm/invoices/invoice.routes.js';
import dashboardRoutes  from './src/modules/crm/dashboard/dashboard.routes.js';
import telecallingRoutes from "./src/modules/telecalling/telecalling.routes.js";


dotenv.config();

// connect to db 
await connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", routes);
app.use("/api/auth", authRoutes);  //auth routes
app.use("/api/super-admin",superAdminRoutes);
app.use("/api/users",userRoutes);
app.use("/api/crm/leads",leadRoutes);
app.use("/api/crm/customers",customerRoutes);
app.use("/api/crm/activities",activityRoutes);
app.use("/api/crm/quotations",quotationRoutes);
app.use("/api/crm/invoices",invoiceRoutes);
app.use("/api/crm/dashboard",dashboardRoutes);

// router
app.use("/api/telecalling",telecallingRoutes);

// Global Error Handler
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

await connectDB();

app.get("/", (req, res) => {
  res.send("Welcome to the SaaS backend!");
})

app.listen(PORT, () => {
  console.log(`🚀 SaaS backend running on port http://localhost:${PORT}`);
});