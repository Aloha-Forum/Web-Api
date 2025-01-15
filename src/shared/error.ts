export class RequestFormatError extends Error {
    statusCode = 400;
    message = 'Invalid request body or query paramters';
}

export class AuthenticationError extends Error {
    statusCode = 401;
    message = 'Authentication failed';
}

export class ResourceConflictError extends Error {
    statusCode = 409;
    message = 'Resource conflict';
}

export class ResourceNotFoundError extends Error {
    statusCode = 404;
    message = 'Resource not found';
}

export class UndefinedError extends Error {
    statusCode;
    message = 'Undefined error';

    constructor(statusCode: number) {
        super()
        this.statusCode = statusCode;
    }
}