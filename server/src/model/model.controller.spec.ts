import { Test, TestingModule } from '@nestjs/testing';
import { ModelController } from './model.controller';
import { ModelModule } from './model.module';

describe('Model Controller', () => {
  let controller: ModelController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModelController],
      imports: [ModelModule]
    }).compile();

    controller = module.get<ModelController>(ModelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
