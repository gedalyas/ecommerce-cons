export type ApiMessageError = { message: string };
export type ApiValidationError = { message: string; errors: Record<string, string[]> };
export type ApiError = ApiMessageError | ApiValidationError;

export const isApiValidationError = (error: ApiError): error is ApiValidationError =>
  "errors" in error;
