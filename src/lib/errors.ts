export class AppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(message, 403);
        this.name = 'ForbiddenError';
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Not found') {
        super(message, 404);
        this.name = 'NotFoundError';
    }
}

export class ValidationError extends AppError {
    constructor(message: string = 'Validation error') {
        super(message, 400);
        this.name = 'ValidationError';
    }
}

export function errorResponse(error: unknown) {
    if (error instanceof AppError) {
        return Response.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Unhandled error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
}
