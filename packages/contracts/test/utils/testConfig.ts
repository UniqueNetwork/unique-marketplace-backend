const getConfig = () => {
  const {TEST_ETH_PRIVATE_KEYS, TEST_SUBSTRATE_PRIVATE_KEY, TEST_SUB_RPC, TEST_SDK_URL, TEST_ETH_RPC} = process.env;

  if(!TEST_ETH_PRIVATE_KEYS || !TEST_SUBSTRATE_PRIVATE_KEY || !TEST_SUB_RPC || !TEST_ETH_RPC || !TEST_SDK_URL) {
    throw Error('Did you forget to set .env?');
  }

  const subPrivateKeys = ['//Alice', '//Bob', '//Charlie', '//Dave', '//Eve', '//Ferdie']
    .map(account => TEST_SUBSTRATE_PRIVATE_KEY + account);

  const config = {
    ethPrivateKeys: TEST_ETH_PRIVATE_KEYS.split(','),
    subPrivateKeys,
    ethRpcUrl: TEST_ETH_RPC,
    sdkUrl: TEST_SDK_URL,
    contractHelperAddress: '0x842899ecf380553e8a4de75bf534cdf6fbf64049',
    collectionHelperAddress: '0x6c4e9fe1ae37a41e93cee429e8e1881abdcbb54f',
  }

  return config;
}

export default getConfig();
