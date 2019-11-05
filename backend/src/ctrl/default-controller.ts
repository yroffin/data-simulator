import { injectable, inject } from "inversify";
import "reflect-metadata";
import { Ctrl } from "../interface/controller";
import { RouteShorthandOptions } from "fastify";
import { Store } from "src/interface/store";

@injectable()
class DefaultCtrl implements Ctrl {
    @inject("Store")
    private store: Store;

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
        console.log(body);
        await this.store.put([body]);
        return this.store.get({graph: 'g'});
    }
}

export { DefaultCtrl };