export enum OfferStatus {
  Opened = 'Opened',
  Canceled = 'Canceled',
  Completed = 'Completed',
}

export enum OfferEventType {
  Open = 'Open',
  Revoke = 'Revoke',
  Cancel = 'Cancel',
  Buy = 'Buy',
}

export enum CollectionStatus {
  Enabled = 'Enabled',
  Disabled = 'Disabled',
}

export enum CollectionActive {
  true = 'true',
  false = 'false',
}

export enum CollectionMode {
  Nft = 'Nft',
  Fungible = 'Fungible',
  ReFungible = 'ReFungible',
}

export type DecodedCollection = {
  collectionId: number;
  owner: string;
  mode: CollectionMode;
  tokenPrefix: string;
  name: string;
  description: string;
  data: any;
};

export enum TypeAttributToken {
  ImageURL = 'ImageURL',
  Enum = 'Enum',
  String = 'String',
  Prefix = 'Prefix',
  Number = 'Number',
  VideoURL = 'VideoURL',
}
