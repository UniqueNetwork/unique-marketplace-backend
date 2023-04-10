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

export enum CollectionImportType {
  Env = 'Env',
  Api = 'Api',
}

export enum CollectionMode {
  Nft = 'Nft',
  Fungible = 'Fungible',
  ReFungible = 'ReFungible',
}
