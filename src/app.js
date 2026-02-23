import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import authRoutes from './modules/auth/auth.routes.js';
import superAdminRoutes from './modules/superAdmin/superAdmin.routes.js';
import userRoutes from './modules/users/user.routes.js';
import leadRoutes from './modules/crm/leads/lead.routes.js';
import customerRoutes from './modules/crm/customers/customer.routes.js';
import activityRoutes from './modules/crm/activities/activity.routes.js';
import quotationRoutes from './modules/crm/quotations/quotation.routes.js';
import invoiceRoutes from './modules/crm/invoices/invoice.routes.js';
import dashboardRoutes from './modules/crm/dashboard/dashboard.routes.js';
import telecallingRoutes from "./modules/telecalling/telecalling.routes.js";
import campaignRoutes from "./modules/marketing/campaign.routes.js";
import marketingDashboardRoutes from "./modules/marketing/dashboard.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", routes);
app.use("/api/auth", authRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/crm/leads", leadRoutes);
app.use("/api/crm/customers", customerRoutes);
app.use("/api/crm/activities", activityRoutes);
app.use("/api/crm/quotations", quotationRoutes);
app.use("/api/crm/invoices", invoiceRoutes);
app.use("/api/crm/dashboard", dashboardRoutes);

// Marketing routes
app.use("/api/marketing/campaigns", campaignRoutes);
app.use("/api/marketing/dashboard", marketingDashboardRoutes);

// Telecalling routes
app.use("/api/telecalling", telecallingRoutes);

// Global Error Handler
app.use(errorMiddleware);

export default app;
