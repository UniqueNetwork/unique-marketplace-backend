import { MigrationInterface, QueryRunner } from 'typeorm';
import { CollectionEntity, OfferEntity, TokensEntity } from '../entities';
import { Address } from '@unique-nft/utils';

export abstract class NormalizeAddress1719996623513 implements MigrationInterface {
  name: `NormalizeAddress1719996623513`;

  public async up(queryRunner: QueryRunner): Promise<any> {
    await this.replaceAddress(queryRunner, TokensEntity, 'id', 'owner_token');
    await this.replaceAddress(queryRunner, OfferEntity, 'id', 'seller');
    await this.replaceAddress(queryRunner, CollectionEntity, 'id', 'owner');
  }

  private async replaceAddress(queryRunner: QueryRunner, entityClass, criteriaColumn: string, addressColumn: string) {
    const take = 1000;
    const repository = queryRunner.connection.getRepository(entityClass);

    let foundCount = 0;
    let skip = 0;

    do {
      const items = await repository.find({
        take,
        skip,
        order: { [criteriaColumn]: 'asc' },
      });

      foundCount = items.length;

      if (foundCount) {
        await Promise.all(
          items.map((item) =>
            repository.update(
              {
                [criteriaColumn]: item[criteriaColumn],
              },
              {
                [addressColumn]: Address.extract.addressNormalizedSafe(item[addressColumn]) || item[addressColumn],
              },
            ),
          ),
        );
      }

      skip += take;
    } while (foundCount === take);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    // empty this
  }
}
