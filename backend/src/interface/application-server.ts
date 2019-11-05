import { Service } from "./service";

export interface ApplicationServer extends Service {
    listen(): void
}