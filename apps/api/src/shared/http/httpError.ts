export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class ValidationError extends HttpError {
  readonly errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super(422, "Dados inválidos");
    this.errors = errors;
  }
}

export const unauthorized = (message = "Sessão inválida ou expirada") =>
  new HttpError(401, message);
export const forbidden = (message = "Sem permissão") => new HttpError(403, message);
export const notFound = (message = "Não encontrado") => new HttpError(404, message);
