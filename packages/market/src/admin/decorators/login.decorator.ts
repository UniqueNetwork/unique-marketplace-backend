import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LoginGuard } from '../guards/login.guard';

export function ApiBearerAuthMetamaskAndSubstrate() {
  return applyDecorators(
    ApiBearerAuth(),
    UseGuards(LoginGuard),
    ApiQuery({ name: 'account', type: 'string', required: false }),
    ApiQuery({
      name: 'type',
      type: 'string',
      required: true,
      enum: ['metamask', 'keyring'],
      example: 'metamask',
    }),
  );
}
