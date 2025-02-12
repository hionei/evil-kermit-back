import { Router } from "express";
import Controllers from "../controllers";

const router = Router();
const Read = new Controllers.Read();

router.get("/users", Read.getUsers);
router.get("/refresh", Read.getPastEvents);
export default router;
