import { injectable, inject } from "inversify";
import "reflect-metadata";
import { Ctrl } from "../interface/controller";
import { RouteShorthandOptions } from "fastify";
import { Store } from "../interface/store";
import { Parser } from "../interface/parser";
import * as _ from 'lodash'

@injectable()
class ModelCtrl implements Ctrl {
    @inject("Store")
    private store: Store;
    @inject("Parser")
    private parser: Parser;

    constructor() {
    }

    public initialize() {
    }

    schema(): RouteShorthandOptions {
        return {
            schema: {
                response: {
                    200: {
                        type: 'object'
                    }
                }
            }
        };
    }

    async modelValidate(body: any): Promise<any> {
        let result = await this.parser.validate(body).catch((reason: any) => {
            throw reason;
        });
        return result;
    }

    async modelDump(body: any): Promise<any> {
        let result = await this.parser.toJson(body).catch((reason: any) => {
            throw reason;
        });
        return JSON.parse(result);
    }
}

export { ModelCtrl };