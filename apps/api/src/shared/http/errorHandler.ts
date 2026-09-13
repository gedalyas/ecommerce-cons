import type { ErrorRequestHandler } from "express";
import { HttpError, ValidationError } from "./httpError";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ValidationError) {
    res.status(error.status).json({ message: error.message, errors: error.errors });
    return;
  }
  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message });
    return;
  }
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ message: "Corpo da requisição inválido" });
    return;
  }
  console.error(error);
  res.status(500).json({ message: "Erro interno. Tente novamente." });
};
