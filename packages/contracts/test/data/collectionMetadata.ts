// TODO: SDK_UPGRADE - Update CreateCollectionV2ArgsDto type after @unique-nft/sdk upgrade
import { CreateCollectionV2ArgsDto } from '@unique-nft/sdk';

export const collectionMetadata: Omit<CreateCollectionV2ArgsDto, 'address'> = {
  schemaVersion: '2.0.0',
  schemaName: 'unique',
  name: 'Test',
  description: 'Test description',
  // royalties: [
  //   {
  //     address: "5CGVEGYPq4MqLcd3e2j6hybo7i4e5hMdF2jcS8ko4E4H6S9p",
  //     percent: 3,
  //   },
  // ],
  cover_image: {
    url: 'https://ipfs.uniquenetwork.dev/ipfs/Qma2gTimRoBgf4VTrERZiikaevhRxEF8tk9sLJyscLpZbe',
    // details: {}
    // thumbnail: {}
  },
  symbol: 'TST',
};
