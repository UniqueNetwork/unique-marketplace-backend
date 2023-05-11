import * as fs from 'fs';
import { join } from 'path';
import { SelectQueryBuilder } from 'typeorm';
import { PaginationRequest } from '../offers/dto/offers.dto';
import { PaginationResult } from '../offers/interfaces/offers.interface';

export function readApiDocs(nameFile: string) {
  return fs.readFileSync(join(__dirname, 'assets', 'docs', nameFile)).toString();
}

export function queryArray(name: string, itemType: string) {
  return {
    name,
    required: false,
    isArray: true,
    schema: {
      items: {
        type: itemType,
        default: '',
      },
      type: 'array',
    },
  };
}

export async function paginate<T>(query: SelectQueryBuilder<T>, parameter: PaginationRequest): Promise<PaginationResult<T>> {
  const page = parameter.page ?? 1;
  const pageSize = parameter.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  query.skip(offset);
  query.take(pageSize);

  const items = await query.getMany();
  const itemsCount = await query.getCount();

  return {
    page,
    pageSize,
    itemsCount,
    items,
  };
}
