import { ethers, upgrades } from 'hardhat';
import { Sr25519Account } from '@unique-nft/sdk/sr25519';
import { ContractHelpers__factory, Market } from '../typechain-types';
import { Address } from '@unique-nft/utils';

const seed = process.env.SUBSTRATE_SIGNER_SEED!;
const ROYALTY_HELPER_PRODUCTION = "0x69470426d9618a23EA1cf91ffD6A115E4D8dC8be";
const CONTRACT_HELPERS = "0x842899ecf380553e8a4de75bf534cdf6fbf64049";

async function main() {
  const ethereumSigner = (await ethers.getSigners())[0];
  const MarketFactory = await ethers.getContractFactory('Market');
  const contractHelpers = ContractHelpers__factory.connect(CONTRACT_HELPERS, ethereumSigner);

  console.log('Deploying Market...');

  const contract = await upgrades.deployProxy(MarketFactory, [0, ROYALTY_HELPER_PRODUCTION], {
    initializer: 'initialize',
    txOverrides: {
      gasLimit: 7000000,
    },
  });

  await contract.waitForDeployment();
  const marketAddress = await contract.getAddress();
  console.log('Market deployed to:', marketAddress);

  await addAdmin(contract as unknown as Market);

  console.log('Setting sponsoring...');
  // sponsor transactions from contract itself:
  let tx = await contractHelpers.selfSponsoredEnable(marketAddress, {gasLimit: 300000});
  await tx.wait();
  // sponsor every transaction:
  tx = await contractHelpers.setSponsoringRateLimit(marketAddress, 0, {gasLimit: 300000});
  await tx.wait();
  // set generous mode:
  tx = await contractHelpers.setSponsoringMode(marketAddress, 2, {gasLimit: 300000});
  await tx.wait();
}

async function addAdmin(market: Market) {
  console.log('adding admin to contract');
  const account = Sr25519Account.fromUri(seed);

  const ethAddress = Address.mirror.substrateToEthereum(account.address);

  const tx = await market.addAdmin(ethAddress, {
    gasLimit: 300_000,
  });
  await tx.wait();

  console.log(`added admin sub: ${account.address}, eth: ${ethAddress}`);
}

main();
