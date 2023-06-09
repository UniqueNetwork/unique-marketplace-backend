import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SdkMarketService } from '../../sdk/sdk.service';
import { hexToU8a } from '@polkadot/util';
import { encodeAddress, signatureVerify } from '@polkadot/util-crypto';
import { ConfigService } from '@nestjs/config';
import { SessionService } from '../session.service';

@Injectable()
export class LoginGuard implements CanActivate {
  constructor(
    private sdkMarketService: SdkMarketService,
    private sessionService: SessionService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    try {
      const typeVerify = req.query.type;
      if (typeVerify === undefined) {
        throw new Error('Not found type verification');
      }
      const authHeader = req.headers.authorization;
      const bearer = authHeader.split(' ')[0];
      const signature = authHeader.split(' ')[1];

      const payload = this.configService.get<string>('signatureKey');

      if (typeVerify === 'metamask') {
        const signerAddressMetamask = req.query.account;
        if (bearer !== 'Bearer' || !signature || !signerAddressMetamask) {
          throw new UnauthorizedException('Authorization required');
        }

        const metamask = await this.sdkMarketService.verifyMessageData(signature, signerAddressMetamask);
        if (metamask) {
          return metamask;
        }
      } else {
        const signerAddress = encodeAddress(req.query.account);
        if (bearer !== 'Bearer' || !signature || !signerAddress) {
          throw new UnauthorizedException('Authorization required');
        }

        const signatureU8a = hexToU8a(signature);
        const verificationResult = await signatureVerify(payload, signatureU8a, signerAddress);

        if (!verificationResult.isValid) {
          throw new Error('Bad signature');
        }

        if (req.query?.collectionId) {
          await this.sdkMarketService.checkCollectionOwner(signerAddress, req.query.collectionId);
          await this.sessionService.saveSessions(signerAddress, +req.query.collectionId);
        }
        return true;
      }
    } catch (e) {
      throw new UnauthorizedException(`Access denied! ${e.message}`);
    }
  }
}
