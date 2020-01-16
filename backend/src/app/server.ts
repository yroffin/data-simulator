import { injectable, inject } from "inversify";
import "reflect-metadata";
import { ApplicationServer } from "../interface/application-server";
import fastify = require("fastify");
import { Server, IncomingMessage, ServerResponse } from "http";
import { DefaultCtrl } from "../ctrl/default-controller";
import { DefaultLogger } from "../service/default-logger";
import { QuadStore } from "../service/quad-store";
import { Store } from "../interface/store";
import { Logger } from "../interface/logger";
import { ModelCtrl } from "../ctrl/model-controller";

@injectable()
class WebServer implements ApplicationServer {

    @inject("DefaultCtrl")
    private defaultCtrl: DefaultCtrl;
    @inject("ModelCtrl")
    private modelCtrl: ModelCtrl;
    @inject("Logger")
    private logger: Logger;

    public constructor() {
    }

    public initialize() {
    }

    // Create a http server. We pass the relevant typings for our http version used.
    // By passing types we get correctly typed access to the underlying http objects in routes.
    // If using http2 we'd pass <http2.Http2Server, http2.Http2ServerRequest, http2.Http2ServerResponse>
    private server: fastify.FastifyInstance<Server, IncomingMessage, ServerResponse> = fastify({})

    public listen() {
        this.server.post('/ping', this.defaultCtrl.schema(), async (request, reply) => {
            let payload = await this.defaultCtrl.post(request.body);
            reply.code(200).send(JSON.stringify(payload));
        })

        this.server.post('/api/model/validate', this.modelCtrl.schema(), async (request, reply) => {
            console.log('ping')
            let payload = await this.modelCtrl.modelValidate(request.body);
            reply.code(200).send(JSON.stringify(payload));
        })

        this.server.post('/api/model/dump', this.modelCtrl.schema(), async (request, reply) => {
            console.log('ping')
            let payload = await this.modelCtrl.modelDump(request.body);
            reply.code(200).send(JSON.stringify(payload));
        })

        // Run the server!
        this.server.listen(8080, "0.0.0.0", (err, address) => {
            if (err) throw err
            this.logger.info(`server listening on ${address}`)
        })
    }
}

export { WebServer };