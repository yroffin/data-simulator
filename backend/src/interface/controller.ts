import { RouteShorthandOptions } from "fastify";
import { Service } from "./service";

export interface Ctrl extends Service {
    schema(): RouteShorthandOptions
    post(body: any): any
}