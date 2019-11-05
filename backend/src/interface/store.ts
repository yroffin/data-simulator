import { Service } from "./service";

export interface Store extends Service {
    get(matchTerms: any): Promise<any>
    put(quads: any): Promise<void>
}