import { ethers, upgrades } from 'hardhat';
import { KeyringProvider } from '@unique-nft/accounts/keyring';
import { Market } from '../typechain-types';
import { Address } from '@unique-nft/utils';

const seed = process.env.SUBSTRATE_SIGNER_SEED!;

async function main() {
  const MarketFactory = await ethers.getContractFactory('Market');

  console.log('Deploying Market...');
  const contract = await upgrades.deployProxy(MarketFactory, [0], {
    initializer: 'initialize',
    txOverrides: {
      gasLimit: 7000000,
    },
  });

  await contract.waitForDeployment();
  console.log('Market deployed to:', await contract.getAddress());

  await addAdmin(contract as unknown as Market);
}

async function addAdmin(market: Market) {
  console.log('adding admin to contract');
  const provider = new KeyringProvider({
    type: 'sr25519',
  });
  const signer = provider.addSeed(seed);
  const address = signer.address;
  const ethAddress = Address.mirror.substrateToEthereum(address);

  const tx = await market.addAdmin(ethAddress, {
    gasLimit: 7_000_000,
  });
  await tx.wait();

  console.log(`added admin sub: ${address}, eth: ${ethAddress}`);
}

main();
