import hre from 'hardhat';
const getConfig = () => {
  const {TEST_SUBSTRATE_DONOR_SEED, TEST_ETH_DONOR_SEED, TEST_WS_ENDPOINT, TEST_SDK_URL} = process.env;

  if (!TEST_SDK_URL || !TEST_ETH_DONOR_SEED)
    throw Error('Did you forget to set .env?')

  // Substrate donor needed to top up balances of test users
  const substrateDonorSeed = TEST_SUBSTRATE_DONOR_SEED ?? "//Alice";
  const ethDonorSeed = TEST_ETH_DONOR_SEED;
  const wsRpc = TEST_WS_ENDPOINT ?? "ws://localhost:9944";
  const ethRpc = wsRpc.replace("ws://", "http://").replace("wss://", "https://");
  const sdkUrl = TEST_SDK_URL;

  const config = {
    substrateDonorSeed,
    ethDonorSeed,
    wsRpc,
    ethRpc,
    sdkUrl,
    contractHelperAddress: '0x842899ecf380553e8a4de75bf534cdf6fbf64049',
    collectionHelperAddress: '0x6c4e9fe1ae37a41e93cee429e8e1881abdcbb54f',
  }

  return config;
}

export default getConfig();
