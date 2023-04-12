import { IPaginationOptions } from 'nestjs-typeorm-paginate';

export interface PaginationRouting extends IPaginationOptions {
  routingLabels: {
    limitLabel: 'pageSize'; // default: limit
  };
}

export interface ISetting {
  [key: string]: string;
}

export interface IWhereOperators {
  _eq?: number | string | boolean;
  _neq?: number | string | boolean;
  _like?: number | string;
  _ilike?: number | string;
  _in?: number[] | string[];
  _is_null?: boolean;
}

export enum OrderByParamsArgs {
  asc = 'asc',
  desc = 'desc',
  asc_nulls_first = 'asc_nulls_first',
  asc_nulls_last = 'asc_nulls_last',
  desc_nulls_first = 'desc_nulls_first',
  desc_nulls_last = 'desc_nulls_last',
}

type TWhereOperations<T> = {
  _and?: {
    [key in keyof T]: TWhereOperations<T> & IWhereOperators;
  }[];
  _or?: {
    [key in keyof T]: TWhereOperations<T> & IWhereOperators;
  }[];
};

export type TOrderByParams<T> = {
  [key in keyof T]: OrderByParamsArgs;
};

export type TWhereParams<T> = {
  [key in keyof T]: IWhereOperators;
};

export type TWhere<T> = TWhereParams<T> & TWhereOperations<T>;

export interface IQueryArgs<T> {
  limit?: number;
  offset?: number;
  where?: TWhere<T>;
  order_by?: TOrderByParams<T>;
  distinct_on?: string;
}

export enum JOIN_TYPE {
  INNER = 'inner',
  LEFT = 'left',
}

export interface ISettingsSchema {
  aliasFields?: ISetting;
  relationsFields?: ISetting;
  customQueryFields?: ISetting;
  relations?: string[];
}

type TOrderBy = 'ASC' | 'DESC';
type TOrderByNulls = 'NULLS FIRST' | 'NULLS LAST';

export type TParamValue = string | number | Array<string | number>;

export enum Operator {
  AND = '_and',
  OR = '_or',
}

export enum OperatorMethods {
  AND = 'andWhere',
  OR = 'orWhere',
}

interface IOrderByEntity {
  order: TOrderBy;
  nulls?: TOrderByNulls;
}

export interface IRelation {
  table: string;
  on: string;
  join?: JOIN_TYPE;
}
export interface IRelations {
  [relationsName: string]: IRelation;
}
