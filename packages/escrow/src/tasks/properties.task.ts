import { Injectable, Logger } from '@nestjs/common';
import { Task, TaskHandler } from 'nestjs-graphile-worker';
import { SdkService } from '../app/sdk.service';
import { InjectRepository } from '@nestjs/typeorm';
import { TokensEntity } from '@app/common/modules/database/entities/tokens.entity';
import { Repository } from 'typeorm';
import { Helpers } from 'graphile-worker';
import { PropertiesEntity } from '@app/common/modules/database/entities/properties.entity';
import { BundleType, CollectionToken, Market, SerializeTokenType, TokenInfo } from './task.types';
import { WorkerService } from 'nestjs-graphile-worker/dist/services/worker.service';
import { CollectionWithInfoV2Dto, NestedToken, TokenWithInfoV2Dto } from '@unique-nft/sdk/full';
import { TypeAttributToken } from '@app/common/modules/types';

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
    await this.addSearchIndexIfNotExists(payload);
  }

  async getTokenInfoItems({ collectionId, tokenId }: CollectionToken): Promise<SerializeTokenType | null> {
    return this.preparePropertiesData(tokenId, collectionId);
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
    token: TokenWithInfoV2Dto;
    collection: CollectionWithInfoV2Dto;
    isBundle: boolean;
    serializeBundle: Array<BundleType>;
  } | null> {
    const { isBundle } = await this.sdkService.isBundle(tokenId, collectionId);
    let token = null;
    let serializeBundle = [];
    if (isBundle) {
      const [bundle, tokenData] = await Promise.all([
        this.sdkService.getBundle(tokenId, collectionId),
        this.sdkService.getTokenSchema(collectionId, tokenId),
      ]);
      if (!tokenData) return null;

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
      if (!token) return null;
    }

    const collection = await this.sdkService.getSchemaCollection(collectionId);
    return {
      token,
      collection,
      isBundle,
      serializeBundle,
    };
  }

  async addSearchIndexIfNotExists(collectionToken: CollectionToken): Promise<void> {
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
    if (searchIndexItems) {
      await this.saveProperties(collectionToken, searchIndexItems);
    }
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
        network: collectionToken?.network || '',
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

  async preparePropertiesData(tokenId: number, collectionId: number): Promise<SerializeTokenType | null> {
    const tokenData = await this.tokenWithCollection(tokenId, collectionId);
    if (!tokenData) {
      return null;
    }

    const source: Set<TokenInfo> = new Set();
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
        items: [tokenData.collection?.info?.cover_image?.url],
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
        items: [tokenData.token.image],
        key: 'image',
        type: TypeAttributToken.ImageURL, //
        is_trait: false,
      });
    }

    if (tokenData.token?.animation_url) {
      source.add({
        locale: null,
        items: [tokenData.token.animation_url],
        key: 'video',
        type: TypeAttributToken.VideoURL,
      });
    }

    if (tokenData.token.media) {
      tokenData.token.media.map((media) => {
        source.add({
          locale: null,
          items: [media.url],
          key: media.type,
          type: TypeAttributToken.MediaURL,
        });
      });
    }

    if (tokenData.token?.attributes) {
      tokenData.token?.attributes.forEach((attribute) => {
        source.add({
          locale: null,
          items: [`${attribute.value}`],
          key: attribute.trait_type,
          type: typeof attribute.value === 'number' ? TypeAttributToken.Number : TypeAttributToken.String,
          is_trait: false,
        });
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
