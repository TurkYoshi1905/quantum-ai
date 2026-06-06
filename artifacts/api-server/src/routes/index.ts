import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import chatsRouter from "./chats";
import messagesRouter from "./messages";
import modelRouter from "./model";
import usersRouter from "./users";
import plansRouter from "./plans";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(chatsRouter);
router.use(messagesRouter);
router.use(modelRouter);
router.use(usersRouter);
router.use(plansRouter);

export default router;
