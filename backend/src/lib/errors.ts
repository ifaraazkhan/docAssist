export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class BadRequest extends AppError {
  constructor(message = 'Bad request', code?: string) {
    super(400, message, code)
  }
}

export class Unauthorized extends AppError {
  constructor(message = 'Unauthorized', code?: string) {
    super(401, message, code)
  }
}

export class Forbidden extends AppError {
  constructor(message = 'Forbidden', code?: string) {
    super(403, message, code)
  }
}

export class NotFound extends AppError {
  constructor(message = 'Not found', code?: string) {
    super(404, message, code)
  }
}

export class Conflict extends AppError {
  constructor(message = 'Conflict', code?: string) {
    super(409, message, code)
  }
}

export class TooManyRequests extends AppError {
  constructor(message = 'Too many requests', code?: string) {
    super(429, message, code)
  }
}
