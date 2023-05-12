import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
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
      const authHeader = req.headers.authorization;
      const bearer = authHeader.split(' ')[0];
      const signature = authHeader.split(' ')[1];
      const signerAddress = encodeAddress(req.query.account);
      const payload = this.configService.get<string>('signatureKey');

      if (bearer !== 'Bearer' || !signature || !signerAddress) {
        throw new UnauthorizedException('Authorization required');
      }

      const signatureU8a = hexToU8a(signature);
      const verificationResult = await signatureVerify(payload, signatureU8a, signerAddress);

      if (!verificationResult.isValid) {
        throw new Error('Bad signature');
      }
      console.dir({ verificationResult, valid: verificationResult.isValid }, { depth: 10 });
      if (req.query?.collectionId) {
        console.dir({ collection: req.query?.collectionId }, { depth: 10 });
        await this.sdkMarketService.checkCollectionOwner(signerAddress, req.query.collectionId);
        await this.sessionService.saveSessions(signerAddress, +req.query.collectionId);
      }
      return true;
    } catch (e) {
      throw new UnauthorizedException(`Access denied! ${e.message}`);
    }
  }
}
