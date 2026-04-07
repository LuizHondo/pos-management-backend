export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const notFound = (message: string = "Not found") => {
  return new AppError(404, message);
};

export const forbidden = (message: string = "Forbidden") => {
  return new AppError(403, message);
};

export const badRequest = (message: string = "Bad request") => {
  return new AppError(400, message);
};

export const unauthorized = (message: string = "Unauthorized") => {
  return new AppError(401, message);
};
