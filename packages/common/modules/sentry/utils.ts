import { ExecutionContext, HttpException } from '@nestjs/common';
import { Extras } from '@sentry/types';
import { Request } from 'express';
// import { SubstrateClientError } from '@unique-nft/substrate-client/errors';

export const getExtra = (error: unknown, context: ExecutionContext): Extras => {
  const extra = {
    error,
    request: undefined,
  };

  const request = context.getArgByIndex<Request>(0);
  if (request) {
    extra.request = {
      ip: request.ip,
      url: request.url,
      body: JSON.stringify(request.body),
      query: request.query,
      params: request.params,
      headers: request.headers,
      cookies: request.cookies,
    };
  }

  return extra;
};

export type ErrorSource = 'REST' | 'SDK' | 'CHAIN_NODE' | 'unknown';

export const getErrorSource = (error: unknown): ErrorSource => {
  if (error instanceof HttpException) return 'REST';

  // todo
  // if (error instanceof SubstrateClientError) {
  //   return error.isEmittedByChain ? 'CHAIN_NODE' : 'SDK';
  // }

  return 'unknown';
};
