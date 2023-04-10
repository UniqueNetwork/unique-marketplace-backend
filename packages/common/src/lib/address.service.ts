import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KeyringAccount, KeyringProvider } from '@unique-nft/accounts/keyring';
import { Account, SignatureType } from '@unique-nft/accounts';

@Injectable()
export class AddressService {
  private keyringProvider: KeyringProvider;
  constructor(private configService: ConfigService) {
    this.keyringProvider = new KeyringProvider({ type: SignatureType.Sr25519 });
  }

  async substrateFromSeed(seed: string): Promise<KeyringAccount> {
    if (!seed) throw new Error('seed is required');
    await this.keyringProvider.init();
    return this.keyringProvider.addSeed(seed);
  }
}
