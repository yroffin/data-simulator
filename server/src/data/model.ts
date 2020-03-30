export class Model {}

export class RDF {
    subject: string;
    predicate: string;
    object: any;
}

export class AstTree {
    type: string;
    text: string;
    children: AstTree[];
}
