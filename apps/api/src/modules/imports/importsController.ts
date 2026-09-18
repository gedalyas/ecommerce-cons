import type { Request, Response } from "express";
import {
  areaOfImportKind,
  importIdSchema,
  importKindSchema,
  importTemplates,
  type ImportKind,
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
  type UploadedFile,
} from "./importsService";
import { fileTypeProblem } from "./uploadRules";

export type ImportsDependencies = { now: () => Date; rateLimited: boolean };

function uploadedCsv(req: Request): { kind: ImportKind; file: UploadedFile } {
  const { kind } = parseOrThrow(importKindSchema, req.body);
  const file = req.file;
  if (!file) throw new HttpError(400, 'Envie o arquivo no campo "file".');
  const problem = fileTypeProblem(file.originalname, file.mimetype);
  if (problem) throw new HttpError(415, problem);
  return { kind, file: { name: file.originalname, size: file.size, buffer: file.buffer } };
}

export function importsController({ now }: ImportsDependencies) {
  return {
    async upload(req: Request, res: Response) {
      const { kind, file } = uploadedCsv(req);
      const auth = authOf(req);
      assertAreaEdit(auth, areaOfImportKind[kind]);
      res.status(201).json(await runImport(auth, kind, file, now()));
    },
    async preview(req: Request, res: Response) {
      const { kind, file } = uploadedCsv(req);
      res.json(previewImport(kind, file));
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
