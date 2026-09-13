import type { Request, Response } from "express";
import { importIdSchema, importKindSchema, importTemplates } from "@ecommerce/contracts/imports";
import { authOf } from "@/shared/http/authOf";
import { HttpError } from "@/shared/http/httpError";
import { parseOrThrow } from "@/shared/http/validate";
import { importJobOf, importsScreen, runImport } from "./importsService";
import { fileTypeProblem } from "./uploadRules";

export type ImportsDependencies = { now: () => Date; rateLimited: boolean };

export function importsController({ now }: ImportsDependencies) {
  return {
    async upload(req: Request, res: Response) {
      const { kind } = parseOrThrow(importKindSchema, req.body);
      const file = req.file;
      if (!file) throw new HttpError(400, 'Envie o arquivo no campo "file".');
      const problem = fileTypeProblem(file.originalname, file.mimetype);
      if (problem) throw new HttpError(415, problem);
      const { clientId, userId } = authOf(req);
      const job = await runImport(
        clientId,
        userId,
        kind,
        { name: file.originalname, size: file.size, buffer: file.buffer },
        now(),
      );
      res.status(201).json(job);
    },
    async list(req: Request, res: Response) {
      res.json(await importsScreen(authOf(req).clientId));
    },
    async one(req: Request, res: Response) {
      const { id } = parseOrThrow(importIdSchema, req.params);
      res.json(await importJobOf(authOf(req).clientId, id));
    },
    templates(_req: Request, res: Response) {
      res.json(importTemplates);
    },
  };
}
