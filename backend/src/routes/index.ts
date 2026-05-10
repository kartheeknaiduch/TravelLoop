import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import tripsRouter from "./trips";
import citiesRouter from "./cities";
import activitiesRouter from "./activities";
import dashboardRouter from "./dashboard";
import communityRouter from "./community";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/trips", tripsRouter);
router.use("/cities", citiesRouter);
router.use("/activities", activitiesRouter);
router.use("/dashboard", dashboardRouter);
router.use("/community", communityRouter);
router.use("/admin", adminRouter);

export default router;
