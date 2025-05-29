import { Router } from "express";
import { swap } from "../controller/meteoraDlmm.controller";

const meteoraDlmmRouter = Router();

meteoraDlmmRouter.post("/swap", swap);

export default meteoraDlmmRouter;