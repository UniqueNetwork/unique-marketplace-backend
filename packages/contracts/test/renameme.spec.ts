import { ContractHelpers } from '@unique-nft/solidity-interfaces';
import hre from 'hardhat';
import { Market } from '../../../typechain-types';
import contractHelperAbi from './abi/ContractHelpers.json';
import SdkHelper from './utils/SdkHelper';

describe('Deploy contract', () => {
  it('deploy market', async () => {
    const sdk = await SdkHelper.init();
    const collectionId = await sdk.createCollection();
    const nft = await sdk.createNft(collectionId);

    const [owner, seller, buyer] = await hre.ethers.getSigners();
    const nonce = await owner.getTransactionCount();

    const MarketFactory = await hre.ethers.getContractFactory('Market');
    const contractHelpers = await hre.ethers.getContractAt(contractHelperAbi, '0x842899ecf380553e8a4de75bf534cdf6fbf64049') as ContractHelpers;
    const marketContract = await MarketFactory.deploy(0, 2) as Market;
    await marketContract.deployed();

    const result = await Promise.all([
      (await contractHelpers.selfSponsoredEnable(marketContract.address, {gasLimit: 300000})).wait(),
      (await owner.sendTransaction({
        to: marketContract.address,
        value: hre.ethers.utils.parseEther('1'),
      })).wait()
    ]);


  });
});
