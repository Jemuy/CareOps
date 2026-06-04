import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import alertsRouter from "./alerts";
import childrenRouter from "./children";
import staffRouter from "./staff";
import trainingRouter from "./training";
import supervisionsRouter from "./supervisions";
import safeguardingRouter from "./safeguarding";
import incidentsRouter from "./incidents";
import { reg44Router, reg45Router, regulationRouter } from "./regulation";
import governanceRouter from "./governance";
import inspectionRouter from "./inspection";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/dashboard", dashboardRouter);
router.use("/alerts", alertsRouter);
router.use("/children", childrenRouter);
router.use("/staff", staffRouter);
router.use("/training", trainingRouter);
router.use("/supervisions", supervisionsRouter);
router.use("/safeguarding", safeguardingRouter);
router.use("/incidents", incidentsRouter);
router.use("/regulation44", reg44Router);
router.use("/regulation45", reg45Router);
router.use("/regulation", regulationRouter);
router.use("/governance", governanceRouter);
router.use("/inspection", inspectionRouter);

export default router;
