import { ethers, upgrades, network } from 'hardhat';
import { Sr25519Account } from '@unique-nft/sdk/sr25519';
import { ContractHelpers__factory, Market } from '../typechain-types';
import { Address } from '@unique-nft/utils';

const seed = process.env.SUBSTRATE_SIGNER_SEED!;
const CONTRACT_HELPERS = '0x842899ecf380553e8a4de75bf534cdf6fbf64049';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(network.name);
  const [ethereumSigner] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(ethereumSigner);
  console.log('Network:', network.name);
  console.log('Signer address:', ethereumSigner.address);
  console.log('Signer balance is:', balance / 10n ** 18n);

  await sleep(10000);

  const MarketFactory = await ethers.getContractFactory('Market', ethereumSigner);
  const contractHelpers = ContractHelpers__factory.connect(CONTRACT_HELPERS, ethereumSigner);

  console.log('Deploying Market...');

  const contract = await upgrades.deployProxy(MarketFactory, [0], {
    initializer: 'initialize',
    txOverrides: {
      gasLimit: 7_000_000,
    },
  });

  await contract.waitForDeployment().catch((e) => {
    console.log(e);
  });
  const marketAddress = await contract.getAddress();
  console.log('Market deployed to:', marketAddress);

  await addAdmin(contract as unknown as Market);
  console.log('Setting sponsoring...');
  // sponsor transactions from contract itself:
  let tx = await contractHelpers.connect(ethereumSigner).setSponsor(marketAddress, ethereumSigner, { gasLimit: 300000 });
  await tx.wait();
  // confirm sponsorship
  console.log('Confirm sponsoring...');
  tx = await contractHelpers.confirmSponsorship(marketAddress, { gasLimit: 300000 });
  await tx.wait();

  // sponsor every transaction:
  console.log('Setting rate limits...');
  tx = await contractHelpers.setSponsoringRateLimit(marketAddress, 0, { gasLimit: 300000 });
  await tx.wait();
  // set generous mode:
  console.log('Setting generous mode...');
  tx = await contractHelpers.setSponsoringMode(marketAddress, 2, { gasLimit: 300000 });
  await tx.wait();

  console.log('Contract ready!');
}

async function addAdmin(market: Market) {
  console.log('Add admin to contract...');
  const account = Sr25519Account.fromUri(seed);

  const ethAddress = Address.mirror.substrateToEthereum(account.address);

  const tx = await market.addAdmin(ethAddress, {
    gasLimit: 300_000,
  });
  await tx.wait();

  console.log(`added admin sub: ${account.address}, eth: ${ethAddress}`);
}

main();
