import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { hexToU8a } from '@polkadot/util';
import { encodeAddress, signatureVerify } from '@polkadot/util-crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoginGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    try {
      const authHeader = req.headers.authorization;
      const bearer = authHeader.split(' ')[0];
      const signature = authHeader.split(' ')[1];
      const signerAddress = encodeAddress(req.query.account);
      const payload = req.originalUrl.split('?')[0];

      if (bearer !== 'Bearer' || !signature || !signerAddress) {
        throw new UnauthorizedException('Authorization required');
      }

      const signatureU8a = hexToU8a(signature);
      const verificationResult = await signatureVerify(
        payload,
        signatureU8a,
        signerAddress
      );

      if (!verificationResult.isValid) {
        throw new Error('Bad signature');
      }
      return true;
    } catch (e) {
      throw new UnauthorizedException('Access denied');
    }
  }
  async verifyAddress(signerAddress) {
    let isAdmin = false;
    const adminList = this.config.get('adminList');
    const list = adminList.split(',');
    if (list.length === 0 || adminList === null || adminList === '') {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Marketplace disabled management for administrators.',
        error: 'Forbidden',
      });
    }
    list.map((value) => {
      if (value.trim() === signerAddress) {
        isAdmin = true;
      }
    });
    if (!isAdmin) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Access denied',
        error: 'Unauthorized address',
      });
    }
  }
}
