import { SelectQueryBuilder } from 'typeorm';
import { IQueryArgs, ISetting, ISettingsSchema } from './base.constans';

export class BaseService<T, S> {
  private readonly DEFAULT_PAGE_SIZE = 10;
  protected readonly aliasFields: ISetting = {};
  protected readonly relationsFields: ISetting = {};
  protected readonly customQueryFields: ISetting = {};
  private readonly relations: string[] = [];

  constructor(schemas: ISettingsSchema = {}) {
    const {
      aliasFields = {},
      relationsFields = {},
      customQueryFields = {},
      relations = [],
    } = schemas;
    this.aliasFields = aliasFields;
    this.relationsFields = relationsFields;
    this.relations = relations;
    this.customQueryFields = customQueryFields;
  }

  async getDataAndCount(qb: SelectQueryBuilder<T>) {
    const data = await qb.getRawMany();
    let count = 0;
    if (data?.length) {
      count = await this.getCount(qb);
    }

    return { data, count };
  }

  protected routeLablel() {
    return {
      routingLabels: {
        limitLabel: 'page-size', // default: limit
        pageLabel: 'current-page', //default: page
      },
    };
  }
  protected async getDataAndCountMany(qb: SelectQueryBuilder<T>) {
    const items = await qb.getMany();
    let itemsCount = 0;
    if (items?.length) {
      itemsCount = await this.getCount(qb);
    }

    return { itemsCount, items };
  }

  protected async getCount(qb: SelectQueryBuilder<T>): Promise<number> {
    return qb.getCount();
  }

  protected getConditionField(
    qb: SelectQueryBuilder<T>,
    field: string
  ): string {
    return `"${this.relationsFields[field] ?? qb.alias}"."${
      this.aliasFields[field] ?? field
    }"`;
  }
}
