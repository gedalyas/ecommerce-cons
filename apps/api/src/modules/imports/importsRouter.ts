import { Router, type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { IMPORT_MAX_BYTES } from "@ecommerce/contracts/imports";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { HttpError } from "@/shared/http/httpError";
import { importsController, type ImportsDependencies } from "./importsController";

const UPLOADS_PER_15_MIN = 10;
const PREVIEWS_PER_15_MIN = 30;

function singleCsv() {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: IMPORT_MAX_BYTES, files: 1, fields: 2, fieldSize: 20 * 1024, parts: 3 },
  });
  const handler = upload.single("file");
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, (error: unknown) => {
      if (error instanceof multer.MulterError) {
        const tooBig = error.code === "LIMIT_FILE_SIZE";
        next(
          new HttpError(
            tooBig ? 413 : 400,
            tooBig
              ? `O arquivo passa de ${Math.round(IMPORT_MAX_BYTES / 1024 / 1024)} MB.`
              : "Envio inválido.",
          ),
        );
        return;
      }
      next(error);
    });
  };
}

export function createImportsRouter(deps: ImportsDependencies): Router {
  const router = Router();
  const controller = importsController(deps);
  const limiter = (limit: number) =>
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit,
      standardHeaders: true,
      legacyHeaders: false,
      skip: () => !deps.rateLimited,
      message: { message: "Muitos envios. Aguarde alguns minutos." },
    });

  router.post(
    "/imports",
    limiter(UPLOADS_PER_15_MIN),
    singleCsv(),
    asyncHandler(controller.upload),
  );
  router.post(
    "/imports/preview",
    limiter(PREVIEWS_PER_15_MIN),
    singleCsv(),
    asyncHandler(controller.preview),
  );
  router.get("/imports", asyncHandler(controller.list));
  router.get("/imports/templates", controller.templates);
  router.get("/imports/:id", asyncHandler(controller.one));
  router.post("/imports/:id/undo", asyncHandler(controller.undo));
  return router;
}
