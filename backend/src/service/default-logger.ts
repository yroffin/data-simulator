import { injectable } from "inversify";
import "reflect-metadata";
import { Logger } from "../interface/logger";
import * as winston from "winston"

@injectable()
class DefaultLogger implements Logger {
    private logger: winston.Logger;

    /**
     * default constructor
     */
    public constructor() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.json(),
            defaultMeta: { service: 'user-service' },
            transports: [
                //
                // - Write to all logs with level `info` and below to `combined.log` 
                // - Write all logs error (and below) to `error.log`.
                //
                new winston.transports.File({ filename: 'error.log', level: 'error' }),
                new winston.transports.File({ filename: 'combined.log' })
            ]
        });

        //
        // If we're not in production then log to the `console` with the format:
        // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
        // 
        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(new winston.transports.Console({
                format: winston.format.simple()
            }));
        }
    }

    public initialize() {
        this.info("DefaultLogger");
    }

    public info(message?: any, ...optionalParams: any[]): void {
        this.log('info', message, optionalParams);
    }

    public warn(message?: any, ...optionalParams: any[]): void {
        this.log('warn', message, optionalParams);
    }

    public error(message?: any, ...optionalParams: any[]): void {
        this.log('error', message, optionalParams);
    }

    public debug(message?: any, ...optionalParams: any[]): void {
        this.log('debug', message, optionalParams);
    }

    protected log(level: string, message?: any, ...optionalParams: any[]): void {
        this.logger.log({
            level: level,
            message: message,
            args: optionalParams
          });
    }
}

export { DefaultLogger };