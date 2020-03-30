import { createParamDecorator, HttpException, HttpStatus } from '@nestjs/common';
import * as rawbody from 'raw-body';

export const PlainBody = createParamDecorator(async (data, req) => {
    if (req.args[0].readable) {
        return (await rawbody(req.args[0])).toString().trim();
    }
    throw new HttpException('Body aint text/plain', HttpStatus.INTERNAL_SERVER_ERROR);
});
