import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { RequestFormatError } from "../shared/ErrorResponse";

export function getParams(target: any, requiredParams: string[]): any {
    const result: any = {};
    for (const param of requiredParams) {
        if (!target[param]) {
            throw new RequestFormatError();
        }
        result[param] = target[param];
    }

    return result;
}

export function getQuery(target: any, requiredParams: string[]): any {
    const result: any = {};
    for (const param of requiredParams) {
        if (!target.get(param)) {
            throw new RequestFormatError();
        }
        result[param] = target.get(param);
    }

    return result;
}