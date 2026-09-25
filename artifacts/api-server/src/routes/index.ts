import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import coursesRouter from "./courses";
import quizRouter from "./quiz";
import achievementsRouter from "./achievements";
import chatRouter from "./chat";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(coursesRouter);
router.use(quizRouter);
router.use(achievementsRouter);
router.use(chatRouter);
router.use(dashboardRouter);

export default router;
