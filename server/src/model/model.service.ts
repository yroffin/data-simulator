import { Injectable, Logger } from '@nestjs/common';
import { Grammars, IToken } from 'ebnf';
import { AstTree } from '../data/model';
import DataLoader = require('dataloader')
import { TechnicalError } from '../data/exception';
import * as _ from 'lodash'

@Injectable()
export class ModelService {
    private readonly logger = new Logger(ModelService.name);

    constructor() {
        this.initialize();
    }

    private parser: Grammars.W3C.Parser;

    /**
     * initialize this component with a default json grammar
        "Steve Harris#1" is "customer" containing {
            "name": "Steve1"
        }
        "Steve Harris#2" is "customer" containing {
            "name": "Steve2"
        }
        "Digiposte#1" is "offer" containing {
            "isOffer": true,
            "isProduct": false
        }
        "Digiposte#2" is "offer" containing {
            "isOffer": true,
            "isProduct": false,
            "offers": [
                {"target": "Digiposte#1"},
                {"target": @ "Digiposte#2"}
            ]
        }
        "TableDigiposte#2" is "offers" containing [
            {"target": "Digiposte#1"},
            {"target": @ "Digiposte#2"}
        ]
        "RefDigiposte#2" is "reference" containing "REFERENCE"
        "RefDigiposte#3" is "reference" containing 12.20
     */
    public initialize() {
        this.logger.verbose("initialize");
        this.refresh(`
          /* https://www.ietf.org/rfc/rfc4627.txt */
          expression           ::= ((WS)* (subject WS* IS WS* predicate WS* CONTAINING WS* value)*)*
          subject              ::= quotedString
          predicate            ::= quotedString
          value                ::= comment | false | null | true | object | array | number | quotedString | quotedAlias
          BEGIN_ARRAY          ::= WS* #x5B WS*  /* [ left square bracket */
          BEGIN_OBJECT         ::= WS* #x7B WS*  /* { left curly bracket */
          BEGIN_COMMENT        ::= WS* "/*" WS*  /* begin comment */
          END_ARRAY            ::= WS* #x5D WS*  /* ] right square bracket */
          END_OBJECT           ::= WS* #x7D WS*  /* } right curly bracket */
          END_COMMENT          ::= WS* "*/" WS*  /* end comment */
          NAME_SEPARATOR       ::= WS* #x3A WS*  /* : colon */
          VALUE_SEPARATOR      ::= WS* #x2C WS*  /* , comma */
          DOUBLE_COTE          ::= '"'
          IS                   ::= 'is'
          CONTAINING           ::= 'containing'
          ALIAS                ::= '@'
          WS                   ::= [#x20#x09#x0A#x0D]+   /* Space | Tab | \n | \r */
          false                ::= "false"
          null                 ::= "null"
          true                 ::= "true"
          object               ::= BEGIN_OBJECT (member (VALUE_SEPARATOR member)*)? END_OBJECT
          member               ::= quotedString NAME_SEPARATOR value
          array                ::= BEGIN_ARRAY (value (VALUE_SEPARATOR value)*)? END_ARRAY
          comment              ::= BEGIN_COMMENT END_COMMENT
          number               ::= "-"? ("0" | [1-9] [0-9]*) ("." [0-9]+)? (("e" | "E") ( "-" | "+" )? ("0" | [1-9] [0-9]*))?
          quotedString         ::= DOUBLE_COTE string DOUBLE_COTE
          quotedAlias          ::= ALIAS WS* DOUBLE_COTE string DOUBLE_COTE
          string               ::= (([#x20-#x21] | [#x23-#x5B] | [#x5D-#xFFFF]) | #x5C (#x22 | #x5C | #x2F | #x62 | #x66 | #x6E | #x72 | #x74 | #x75 HEXDIG HEXDIG HEXDIG HEXDIG))*
          HEXDIG               ::= [a-fA-F0-9]
          `);
    }

    /**
     * load ast from text
     * @param ast 
     * @param token 
     * @param subjects 
     * @param alias 
     */
    private load(ast: AstTree, token: IToken, subjects: AstTree[], alias: AstTree[]): AstTree {
        if (token.children && token.children.length > 0) {
            ast.children = [];
            _.each(token.children, (item) => {
                let sublevel = new AstTree();
                this.load(sublevel, item, subjects, alias);
                ast.type = token.type;
                /**
                 * search for alias and subject
                 */
                if (ast.type === 'subject') {
                    subjects.push(sublevel);
                }
                if (ast.type === 'quotedAlias') {
                    alias.push(sublevel);
                }
                ast.children.push(sublevel);
            });
            return ast;
        } else {
            ast.type = token.type;
            ast.text = token.text;
            return ast;
        }
    }

    /**
     * validate text
     * @param text 
     */
    public async validate(text: string): Promise<AstTree> {
        let token: IToken = this.parse(text);
        return await new Promise((resolve, reject) => {
            let ast = new AstTree();
            let subjects: AstTree[] = [];
            let aliases: AstTree[] = [];
            /**
             * load this model
             */
            this.load(ast, token, subjects, aliases);
            /**
             * extract reference (alias) and check consistency
             */
            let unknown = _.filter(aliases, (alias) => {
                let found = _.filter(subjects, (subject) => {
                    return (subject.type === 'quotedString' && subject.children.length == 1 && subject.children[0].type === 'string' && subject.children[0].text === alias.text);
                })
                return found.length === 0;
            });
            if (unknown.length > 0) {
                reject(new TechnicalError("Unknown references", unknown));
            }
            /**
             * replace all alias by its target
             */
            resolve(ast);
        });
    }

    /**
     * find alias in validated repository, no consistency is checked (ex: ...children[0].children[0].text)
     * @param value 
     * @param ast 
     */
    private async findAlias(value: string, ast: AstTree): Promise<AstTree> {
        return new Promise<AstTree>((resolve) => {
            let found = _.filter(ast.children, (child, index) => {
                return child.type === 'value' && ast.children[index - 2].children[0].children[0].text === value;
            });
            resolve(found[0]);
        });
    }

    /**
     * join
     * @param collection 
     * @param fnAsyncMap 
     * @param separator 
     */
    private async join(collection: any, fnAsyncMap: (item: any) => any, separator?: string): Promise<string> {
        let map = await Promise.all(_.map(collection, fnAsyncMap));
        return _.join(map, separator);
    }

    /**
     * filter
     * @param collection 
     * @param fnAsyncMap 
     * @param fnFilter 
     * @param separator 
     */
    private async filter(collection: any, fnAsyncMap: (item: any) => Promise<any>, fnFilter: (item: any) => any, separator?: string): Promise<string> {
        let map = await Promise.all(_.map(collection, fnAsyncMap));
        return _.join(_.filter(map, fnFilter), separator);
    }

    /**
     * to json
     * @param loader 
     * @param ast 
     */
    private async toJsonString(loader: DataLoader<string, AstTree, string>, ast: AstTree): Promise<string> {
        // iterate on children
        return await this.join(ast.children, async (child) => {
            switch (child.type) {
                case "quotedAlias":
                    let alias = await loader.load(child.children[0].text);
                    let quotedAlias = await this.toJsonString(loader, alias);
                    return `${quotedAlias}`;
                case "quotedString":
                    let quotedString = await this.toJsonString(loader, child);
                    return `"${quotedString}"`;
                // primitives types
                case "string":
                case "false":
                case "true":
                case "number":
                    return child.text;
                case "value":
                    // value is a json data value (object, array ...)
                    let value = await this.toJsonString(loader, child);
                    return `${value}`;
                case "object":
                    // Object is a member collection
                    // Member is a field name and its value
                    return '{' + await this.join(child.children,
                        async (item: any) => {
                            let field = await this.toJsonString(loader, item.children[0]);
                            let value = await this.toJsonString(loader, item.children[1]);
                            return `"${field}" : ${value}`
                        }
                    ) + '}';
                case "array":
                    // Array is a object collection
                    return '[' + await this.join(child.children,
                        async (item) => {
                            let value = await this.toJsonString(loader, item);
                            return `${value}`
                        }
                    ) + ']';
                default:
                    console.log('default:type', child.type)
                    return `unknown type ${child.type}`;
            }
        }, "");
    }

    /**
     * decode a data script
     * @param aliasLoader 
     * @param ast 
     */
    private async decode(aliasLoader: DataLoader<string, AstTree, string>, ast: AstTree): Promise<string> {
        let result = await this.filter(
            ast.children,
            async (subjectPredicateValue: any) => {
                switch (subjectPredicateValue.type) {
                    case "predicate":
                        let predicate = await this.toJsonString(aliasLoader, subjectPredicateValue);
                        return `{"predicate": ${predicate}}`;
                    case "subject":
                        let subject = await this.toJsonString(aliasLoader, subjectPredicateValue);
                        return `{"subject": ${subject}}`;
                    case "value":
                        let value = await this.toJsonString(aliasLoader, subjectPredicateValue);
                        return `{"value": ${value}}`;
                    default:
                        return undefined;
                }
            },
            (item: any) => {
                return item !== undefined;
            },
            ","
        );
        return `[${result}]`;
    }

    /**
     * loader
     * @param text 
     */
    public async toJsonFormat(text: string): Promise<string> {
        let compiled = await this.toJson(text);
        let aggregated = [];
        let predicate;
        let subject;
        _.each(JSON.parse(compiled), (item) => {
            if(item.predicate) {
                predicate = item.predicate;
                return;
            }
            if(item.subject) {
                subject = item.subject;
                return;
            }
            aggregated.push({
                predicate: predicate,
                subject: subject,
                object: item.value
            });
        });
        return JSON.stringify(aggregated);
    }

    /**
     * loader
     * @param text 
     */
    public async toJson(text: string): Promise<string> {
        // Validate all data
        let ast: AstTree = await this.validate(text);
        // Allocate a new dataloader
        let aliasLoader = new DataLoader<string, AstTree, string>(
            (keys) => {
                return Promise.all(_.map(keys, async (key) => {
                    return this.findAlias(key, ast);
                }));
            }
        );
        // iterate on list to aggregate a tripple predicate, subject, value
        return this.decode(aliasLoader, ast);
    }

    /**
     * refresh grammar of this component
     * @param grammar 
     */
    private refresh(grammar: string): void {
        try {
            this.parser = new Grammars.W3C.Parser(grammar, {});
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * parse some piece of text
     * @param text 
     */
    private parse(text: string): IToken {
        this.parser.debug = false;
        return this.parser.getAST(text);
    }
}
