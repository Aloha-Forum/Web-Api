import { Status } from './Status';

export function ErrorResponse(status: Status, message: string = null) {
    return { status, body: message };
}
