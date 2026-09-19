import { Router, type RequestHandler } from "express";
import {
  UNDER_DEVELOPMENT_MESSAGE,
  isScreenReleased,
  storeScreens,
  type StoreScreen,
} from "@ecommerce/contracts/auth";
import type { AuthContext } from "@/shared/http/auth.types";
import { forbidden } from "@/shared/http/httpError";
import { screenRoutePrefixes } from "./screenRoutes";

export function assertScreenReleased(auth: AuthContext, screen: StoreScreen): void {
  if (!isScreenReleased(auth.release, screen)) throw forbidden(UNDER_DEVELOPMENT_MESSAGE);
}

export function requireScreen(screen: StoreScreen): RequestHandler {
  return (req, _res, next) => {
    const auth = req.auth;
    if (!auth) {
      next();
      return;
    }
    try {
      assertScreenReleased(auth, screen);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function createScreenGuards(): Router {
  const router = Router();
  for (const screen of storeScreens) {
    const prefixes = screenRoutePrefixes[screen];
    if (prefixes.length > 0) router.use([...prefixes], requireScreen(screen));
  }
  return router;
}
