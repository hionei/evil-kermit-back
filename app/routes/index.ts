import { Router } from "express";
import Controllers from "../controllers";

const router = Router();
const Read = new Controllers.Read();

router.get("/users", Read.getUsers);

export default router;
