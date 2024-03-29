import { Injectable, Logger } from '@nestjs/common';
import { Task, TaskHandler } from 'nestjs-graphile-worker';
import { SdkService } from '../app/sdk.service';
import { InjectRepository } from '@nestjs/typeorm';
import { TokensEntity } from '@app/common/modules/database/entities/tokens.entity';
import { Repository } from 'typeorm';
import { Helpers } from 'graphile-worker';
import { PropertiesEntity } from '@app/common/modules/database/entities/properties.entity';
import { BundleType, CollectionToken, Market, SerializeTokenType, TokenInfo, TypeAttributToken } from './task.types';
import { WorkerService } from 'nestjs-graphile-worker/dist/services/worker.service';
import { NestedToken } from '@unique-nft/sdk/full';

@Injectable()
@Task('collectProperties')
export class PropertiesTask {
  private logger = new Logger(PropertiesTask.name);

  constructor(
    private sdkService: SdkService,
    private readonly graphileWorker: WorkerService,
    @InjectRepository(TokensEntity)
    private tokensRepository: Repository<TokensEntity>,
    @InjectRepository(PropertiesEntity)
    private propertiesRepository: Repository<PropertiesEntity>,
  ) {}

  /**
   * Properties Task Handler
   * @description Incoming data handler. Processes data on the `collectProperties` event
   * @param {Object} payload - input data
   * @param helpers
   */
  @TaskHandler()
  async handler(payload: Market.Payload, helpers: Helpers): Promise<void> {
    this.addSearchIndexIfNotExists(payload);
  }

  async getTokenInfoItems({ collectionId, tokenId }: CollectionToken): Promise<SerializeTokenType> {
    const source = await this.preparePropertiesData(tokenId, collectionId);
    return source;
  }

  private findNestedToken(bundle: NestedToken, tokenId: number): NestedToken | undefined {
    if (bundle.tokenId === tokenId) {
      return bundle;
    }
    if (bundle.nestingChildTokens?.length) {
      for (let i = 0; i < bundle.nestingChildTokens.length; i++) {
        const nested = this.findNestedToken(bundle.nestingChildTokens[i], tokenId);
        if (nested) return nested;
      }
    }
  }

  async tokenWithCollection(
    tokenId: number,
    collectionId: number,
  ): Promise<{
    token: any;
    collection: any;
    isBundle: boolean;
    serializeBundle: Array<BundleType>;
  }> {
    const { isBundle } = await this.sdkService.isBundle(tokenId, collectionId);
    let token = null;
    let serializeBundle = [];
    if (isBundle) {
      const [bundle, tokenData] = await Promise.all([
        this.sdkService.getBundle(tokenId, collectionId),
        this.sdkService.getTokenSchema(collectionId, tokenId),
      ]);
      token = tokenData;

      if (bundle.tokenId === tokenId) {
        token.nestingChildTokens = bundle.nestingChildTokens;
      } else {
        const nested = this.findNestedToken(bundle, tokenId);
        if (nested?.nestingParentToken) {
          token.nestingParentToken = nested.nestingParentToken;
        } else {
          this.logger.error(`Invalid nestingParentToken for ${collectionId}x${tokenId}`);
          token.nestingChildTokens = bundle.nestingChildTokens;
        }
      }
      serializeBundle = this.sdkService.serializeBunlde(token);
    } else {
      token = await this.sdkService.getTokenSchema(collectionId, tokenId);
    }
    const collection = await this.sdkService.getSchemaCollection(collectionId);
    return {
      token,
      collection,
      isBundle,
      serializeBundle,
    };
  }

  async addSearchIndexIfNotExists(collectionToken: CollectionToken): Promise<any> {
    const { collectionId, tokenId, network } = collectionToken;

    const dbIndexList = await this.propertiesRepository.find({
      where: { collection_id: collectionId, token_id: tokenId, network },
    });

    if (dbIndexList.length > 0) {
      // Delete the index
      const deleteResult = await this.propertiesRepository.delete({
        collection_id: collectionId,
        token_id: tokenId,
        network,
      });
      this.logger.log(
        `Deleted properties collection: ${collectionId}, token: ${tokenId} in ${network} > ${deleteResult.affected} records`,
      );
    }

    const searchIndexItems = await this.getTokenInfoItems(collectionToken);
    return this.saveProperties(collectionToken, searchIndexItems);
  }

  async saveProperties(collectionToken: CollectionToken, source: SerializeTokenType): Promise<PropertiesEntity[]> {
    const items = source.items;
    const total = items
      .filter(
        (i) =>
          [TypeAttributToken.Enum, TypeAttributToken.String].includes(i.type) &&
          !['collectionCover', 'prefix', 'description', 'collectionName', 'tokenId', 'image', 'video'].includes(i.key),
      )
      .reduce((acc, item) => {
        return acc + item.items.length;
      }, 0);
    const listItems = this.setListItems(items);
    source.token = this.dropProperties(source.token);

    const propertiesDataItems: PropertiesEntity[] = items.map((item) =>
      this.propertiesRepository.create({
        collection_id: collectionToken.collectionId,
        token_id: collectionToken.tokenId,
        network: collectionToken?.network,
        locale: item.locale,
        items: item.items,
        key: item.key,
        is_trait: item.is_trait,
        type: item.type,
        count_item: this.setCountItem(item),
        total_items: total,
        list_items: listItems,
        attributes: source.token as any,
        nested: source.serializeBundle as any,
      }),
    );

    this.logger.log(
      `Updated properties collection: ${collectionToken.collectionId} token: ${collectionToken.tokenId} in ${collectionToken.network}`,
    );

    return this.propertiesRepository.save(propertiesDataItems);
  }

  async preparePropertiesData(tokenId: number, collectionId: number): Promise<any> {
    const tokenData = await this.tokenWithCollection(tokenId, collectionId);

    const source = new Set();
    // Collection
    source
      .add({
        locale: null,
        items: [tokenData.collection.tokenPrefix],
        key: 'prefix',
        type: TypeAttributToken.Prefix,
        is_trait: false,
      })
      .add({
        locale: null,
        items: [tokenData.collection.description],
        key: 'description',
        type: TypeAttributToken.String,
        is_trait: false,
      })
      .add({
        locale: null,
        items: [tokenData.collection.name],
        key: 'collectionName',
        type: TypeAttributToken.String,
        is_trait: false,
      })
      .add({
        locale: null,
        items: [tokenData.collection?.schema?.coverPicture?.fullUrl],
        key: 'collectionCover',
        type: TypeAttributToken.ImageURL,
        is_trait: false,
      });

    // Token
    source.add({
      locale: null,
      items: [`${tokenId}`],
      key: 'tokenId',
      type: TypeAttributToken.Number,
      is_trait: false,
    });

    if (tokenData.token?.image) {
      source.add({
        locale: null,
        items: [tokenData.token.image?.fullUrl],
        key: 'image',
        type: TypeAttributToken.ImageURL, //
        is_trait: false,
      });
    }

    if (tokenData.token?.video) {
      source.add({
        locale: null,
        items: [tokenData.token.video?.fullUrl],
        key: 'video',
        type: TypeAttributToken.VideoURL,
      });
    }

    for (const [key, val] of Object.entries(tokenData.token?.attributes) as [string, any]) {
      source.add({
        locale: this.getLocation(val),
        items: this.getValueToken(val),
        key: val.name?._,
        type: val.isEnum ? TypeAttributToken.Enum : TypeAttributToken.String,
        is_trait: val.isEnum,
      });
    }

    return {
      items: [...source],
      token: tokenData.token,
      collection: tokenData.collection,
      serializeBundle: tokenData.serializeBundle,
    };
  }

  private setCountItem(item: TokenInfo): number {
    if (
      [TypeAttributToken.Enum, TypeAttributToken.String].includes(item.type) &&
      !['collectionCover', 'prefix', 'description', 'collectionName'].includes(item.key)
    ) {
      return 0;
    }
    return item.items.length;
  }

  private dropProperties(token: any): SerializeTokenType {
    const properties = token?.properties || [];
    if (properties.length > 0) {
      delete token.properties;
    }
    if (token?.nestingChildTokens) {
      token.nestingChildTokens.forEach((item) => {
        this.dropProperties(item as any);
      });
    }
    return token;
  }

  private setListItems(items: TokenInfo[]): string[] {
    return items
      .filter(
        (i) =>
          [TypeAttributToken.Enum, TypeAttributToken.String].includes(i.type) &&
          !['collectionCover', 'prefix', 'description', 'collectionName', 'tokenId', 'image'].includes(i.key),
      )
      .reduce((acc, item) => {
        acc = [...acc, ...item.items];
        return acc;
      }, []);
  }

  private getLocation(attribute: any): string | null {
    if (Array.isArray(attribute.value)) {
      return [
        ...new Set(
          attribute.value.map((i) =>
            Object.keys(i)
              .filter((i) => i !== '_')
              .join(','),
          ),
        ),
      ].join(',');
    } else {
      if (typeof attribute.value === 'string') {
        return null;
      } else {
        return Object.keys(attribute.value)
          .filter((i) => i !== '_')
          .join(',');
      }
    }
  }

  private getValueToken(attribute: any): Array<string> {
    if (Array.isArray(attribute.value)) {
      return attribute.value.map((item) => item._);
    }
    return attribute.value._ ? [attribute.value._] : [attribute.value];
  }
}
