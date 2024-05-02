import '@openzeppelin/hardhat-upgrades';

import { ethers, upgrades } from 'hardhat';

async function main() {
  const Market = await ethers.getContractFactory('Market');

  console.log('Deploying Market...');
  const box = await upgrades.deployProxy(Market, [0], {
    initializer: 'initialize',
    txOverrides: {
      gasLimit: 7000000,
    },
  });

  await box.waitForDeployment();
  console.log('Market deployed to:', box.address);
}

main();
