import { injectable, inject } from "inversify";
import "reflect-metadata";
import { Store } from "../interface/store";
import { Logger } from "../interface/logger";

const leveldown = require('leveldown');
const quadstore = require('quadstore').QuadStore;

@injectable()
class QuadStore implements Store {

    @inject("Logger")
    private logger: Logger;
    
    private store: any;

    public constructor() {
    }

    public initialize() {
        this.logger.info("QuadStore");
        this.store = new quadstore.QuadStore(leveldown('.db'));
    }

    public get(matchingQuads: any): Promise<any> {
        return this.store.get(matchingQuads);
    }

    public put(quads: any): Promise<void> {
        return this.store.put(quads);
    }
}

export { QuadStore };