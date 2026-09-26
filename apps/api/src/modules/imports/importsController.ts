import type { Request, Response } from "express";
import {
  areaOfImportKind,
  importIdSchema,
  importTemplates,
  importUploadSchema,
} from "@ecommerce/contracts/imports";
import { assertAreaEdit } from "@/modules/auth/contract";
import { authOf } from "@/shared/http/authOf";
import { HttpError } from "@/shared/http/httpError";
import { parseOrThrow } from "@/shared/http/validate";
import {
  importJobOf,
  importsScreen,
  previewImport,
  runImport,
  undoImportJob,
  type ImportRequest,
} from "./importsService";
import { fileTypeProblem } from "./uploadRules";

export type ImportsDependencies = { now: () => Date; rateLimited: boolean };

function uploadedCsv(req: Request): ImportRequest {
  const { kind, mapping } = parseOrThrow(importUploadSchema, req.body);
  const file = req.file;
  if (!file) throw new HttpError(400, 'Envie o arquivo no campo "file".');
  const problem = fileTypeProblem(file.originalname, file.mimetype);
  if (problem) throw new HttpError(415, problem);
  return {
    kind,
    file: { name: file.originalname, size: file.size, buffer: file.buffer },
    mapping: mapping ?? null,
  };
}

export function importsController({ now }: ImportsDependencies) {
  return {
    async upload(req: Request, res: Response) {
      const upload = uploadedCsv(req);
      const auth = authOf(req);
      assertAreaEdit(auth, areaOfImportKind[upload.kind]);
      res.status(201).json(await runImport(auth, upload, now()));
    },
    async preview(req: Request, res: Response) {
      const upload = uploadedCsv(req);
      const auth = authOf(req);
      assertAreaEdit(auth, areaOfImportKind[upload.kind]);
      res.json(await previewImport(auth.clientId, upload));
    },
    async list(req: Request, res: Response) {
      res.json(await importsScreen(authOf(req)));
    },
    async one(req: Request, res: Response) {
      const { id } = parseOrThrow(importIdSchema, req.params);
      res.json(await importJobOf(authOf(req).clientId, id));
    },
    async undo(req: Request, res: Response) {
      const { id } = parseOrThrow(importIdSchema, req.params);
      res.json(await undoImportJob(authOf(req), id, now()));
    },
    templates(_req: Request, res: Response) {
      res.json(importTemplates);
    },
  };
}
