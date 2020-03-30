import { Controller, Request, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ModelService } from './model.service'
import { PlainBody } from '../data/plain-body.decorator';

@Controller('/api/model')
export class ModelController {
    constructor(private readonly modelService: ModelService) { }

    @Post('/validate')
    @ApiOperation({
        description: 'Validate this model',
    })
    @ApiResponse({ status: 200, type: Boolean })
    validate(@PlainBody() body: string) {
        return this.modelService.validate(body);
    }

    @Post('/render')
    @ApiOperation({
        description: 'Render this model',
    })
    @ApiResponse({ status: 200, type: Boolean })
    render(@PlainBody() body: string) {
        return this.modelService.toJson(body);
    }
}
