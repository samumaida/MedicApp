import { Test, TestingModule } from '@nestjs/testing';
import { PrestazioniController } from './prestazioni.controller';

describe('PrestazioniController', () => {
  let controller: PrestazioniController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrestazioniController],
    }).compile();

    controller = module.get<PrestazioniController>(PrestazioniController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
