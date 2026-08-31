import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('returns public platform information without exposing secrets', () => {
      const result = appController.getRoot();

      expect(result.name).toContain('Green Ngoria');
      expect(result.version).toBe('1.0.0');
      expect(result.documentation).toBe('/api/docs');
      expect(result.health).toBe('/health');
      expect(result).not.toHaveProperty('databaseUrl');
    });
  });
});
