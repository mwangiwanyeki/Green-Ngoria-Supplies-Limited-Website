import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const healthy = await this.prisma.isHealthy();

    if (healthy) {
      return this.getStatus(key, true);
    }

    throw new HealthCheckError(
      'Database health check failed',
      this.getStatus(key, false),
    );
  }
}
