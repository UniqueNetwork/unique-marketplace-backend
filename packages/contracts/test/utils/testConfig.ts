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
  }

  return config;
}

export default getConfig();
