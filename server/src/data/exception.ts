export class Exception {}

export class TechnicalError {
    message: string;
    detail: any;

    constructor(message: string, detail: any) {
        this.message = message;
        this.detail = detail;
    }
}