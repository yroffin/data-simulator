import { injectable, inject } from "inversify";
import "reflect-metadata";
import { Ctrl } from "../interface/controller";
import { RouteShorthandOptions } from "fastify";
import { Store } from "../interface/store";
import { Parser } from "../interface/parser";

@injectable()
class DefaultCtrl implements Ctrl {
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
                        type: 'object',
                        properties: {
                            subject: {
                                type: 'string'
                            },
                            predicate: {
                                type: 'string'
                            },
                            object: {
                                type: 'string'
                            },
                            graph: {
                                type: 'string'
                            }
                        }
                    }
                }
            }
        };
    }

    async post(body: any): Promise<any> {
        let result = await this.store.put([body]).catch((reason: any) => {
            console.log('any', reason);
        });
        return this.store.get({graph: 'Customer'});
    }
}

export { DefaultCtrl };