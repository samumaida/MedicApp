import { Test, TestingModule } from '@nestjs/testing';
import { PrestazioniService } from './prestazioni.service';

describe('PrestazioniService', () => {
  let service: PrestazioniService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrestazioniService],
    }).compile();

    service = module.get<PrestazioniService>(PrestazioniService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
