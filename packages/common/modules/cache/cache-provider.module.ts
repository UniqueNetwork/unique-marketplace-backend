import { CACHE_MANAGER, Global, Module, Provider } from '@nestjs/common';
import { redisStore } from 'cache-manager-redis-store';
import { ConfigService } from '@nestjs/config';
import { caching, Cache } from 'cache-manager';

import { CacheConfig, CacheType } from "../config";
import { MemoryCache } from "cache-manager/dist/stores";

const cacheProvider: Provider = {
  inject: [ConfigService],
  provide: CACHE_MANAGER,
  useFactory: async (configService: ConfigService): Promise<MemoryCache | Cache> => {
    const cacheConfig: CacheConfig = configService.get('cache');

    switch (cacheConfig.type) {
      case CacheType.DEFAULT:
        return caching('memory', {
          ttl: cacheConfig.ttl,
        });
      case CacheType.REDIS:
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return caching(await redisStore({
          ttl: cacheConfig.ttl,
          url: `redis://${cacheConfig.host}:${cacheConfig.port}/${cacheConfig.db}`,
        }));
      default:
        throw new Error('Invalid cache config');
    }
  },
};

@Global()
@Module({
  providers: [cacheProvider],
  exports: [CACHE_MANAGER],
})
export class CacheProviderModule {}
