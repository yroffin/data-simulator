import { Service } from "./service";
import { AstTree } from "../model/rdf";

export interface Parser extends Service {
    validate(text: string): Promise<AstTree>;
    toJson(text: string): Promise<string>;
}