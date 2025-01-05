import { RequestFormatError } from "../shared/error";

export function getParams(target: any, requiredParams: string[]): any {
    const result: any = {};

    for (const param of requiredParams) {
        if (!target.get(param)) {
            throw new RequestFormatError();
        }
        result[param] = target.get(param);
    }

    return result;
}