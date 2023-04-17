import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ErrorTypes } from '@app/common/modules/types/errors';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    try {
      const authHeader = req.headers.authorization;
      const bearer = authHeader.split(' ')[0];
      const token = authHeader.split(' ')[1];

      if (bearer !== 'Bearer' || !token) {
        throw new UnauthorizedException('Authorization required');
      }
      const user = this.jwtService.verify(token);
      await this.verifyAddress(user.address);

      req.adminAddress = user.address;

      return true;
    } catch (e) {
      throw new UnauthorizedException('');
    }
  }
  async verifyAddress(signerAddress) {
    let isAdmin = false;
    const adminList = this.config.get('adminList');
    const list = adminList.split(',');
    if (list.length === 0 || adminList === null || adminList === '') {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: ErrorTypes.FORBIDDEN_MANAGEMENT,
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
