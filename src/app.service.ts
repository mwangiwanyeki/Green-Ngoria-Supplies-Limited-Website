import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'Green Ngoria Supplies Limited — Enterprise Platform API',
      description:
        'Mining, mineral processing, engineering and construction of mining plants. ' +
        'Specialisation: gold-processing facilities, CIP/CIL systems.',
      version: '1.0.0',
      documentation: '/api/docs',
      health: '/health',
      timestamp: new Date().toISOString(),
    };
  }
}
