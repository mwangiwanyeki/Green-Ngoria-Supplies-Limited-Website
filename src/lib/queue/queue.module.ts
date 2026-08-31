import { Global, Module, DynamicModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from './queue.constants';

const queues = Object.values(QUEUE_NAMES).map((name) =>
  BullModule.registerQueue({
    name,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  }),
);

/**
 * QueueModule — conditionally loads BullMQ only when REDIS_ENABLED=true.
 * When Redis is not available (REDIS_ENABLED=false or absent), all queue
 * operations degrade gracefully — the app runs fully without background jobs.
 */
@Global()
@Module({})
export class QueueModule {
  static forRoot(): DynamicModule {
    const redisEnabled = process.env.REDIS_ENABLED !== 'false';

    if (!redisEnabled) {
      // No Redis — return an empty module so the app starts cleanly
      return {
        module: QueueModule,
        imports: [],
        exports: [],
      };
    }

    return {
      module: QueueModule,
      imports: [
        BullModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            connection: {
              url: config.get<string>('redis.url') ?? 'redis://localhost:6379',
              password: config.get<string>('redis.password') || undefined,
              lazyConnect: true,
              maxRetriesPerRequest: null,
              enableReadyCheck: false,
              retryStrategy: (times: number) => Math.min(times * 1000, 30_000),
            },
          }),
        }),
        ...queues,
      ],
      exports: [BullModule],
    };
  }
}
