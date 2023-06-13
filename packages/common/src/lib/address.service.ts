import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KeyringAccount, KeyringProvider } from '@unique-nft/accounts/keyring';
import { SignatureType } from '@unique-nft/accounts';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import { Address } from '@unique-nft/utils';

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

  getParentCollectionAndToken(address) {
    if (Address.is.ethereumAddress(address)) {
      return Address.is.nestingAddress(address) ? Address.nesting.addressToIds(address) : undefined;
    } else {
      return undefined;
    }
  }

  normalizeSubstrateAddress(address, ss58Format?: number) {
    return Address.is.ethereumAddress(address) ? address : encodeAddress(decodeAddress(address, false, ss58Format));
    // : Address.normalize.substrateAddress(address, ss58Format);
  }
}
