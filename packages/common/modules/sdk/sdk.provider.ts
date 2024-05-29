import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Sdk } from '@unique-nft/sdk/full';
import { Config, SignerConfig } from '../config';
import { KeyringProvider } from '@unique-nft/accounts/keyring';

export const sdkProvider: Provider = {
  provide: Sdk,
  useFactory: async (configService: ConfigService<Config>): Promise<Sdk> => {
    const seed = configService.get<SignerConfig>('signer')?.substrateSeed;

    let signer = null;

    if (seed) {
      const provider = new KeyringProvider({
        type: 'sr25519',
      });
      await provider.init();
      signer = provider.addSeed(seed);
    }

    const baseUrl = configService.get('uniqueSdkRestUrl');

    console.log(`Sdk provider created with signer: ${signer}, baseUrl: ${baseUrl}`);
    return new Sdk({
      signer,
      baseUrl,
    });
  },
  inject: [ConfigService],
};
