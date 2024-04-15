import '@openzeppelin/hardhat-upgrades';

import { ethers, upgrades } from 'hardhat';

async function main() {
  const Market = await ethers.getContractFactory('Market');
  console.log('Deploying Market...');
  const box = await upgrades.deployProxy(Market, [0], { initializer: 'initialize' });
  await box.deployed();
  console.log('Market deployed to:', box.address);
}

main();
