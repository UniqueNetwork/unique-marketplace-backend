import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ContractHelpers } from '@unique-nft/solidity-interfaces';
import hre from 'hardhat';
import { Market } from '../../../../typechain-types';
import contractHelperAbi from '../abi/ContractHelpers.json';
import SdkHelper from "./SdkHelper";
import testConfig from './testConfig';
import { CollectionRepresentation } from '../types/entities';

interface TestData {
  sdk: SdkHelper;
  collection: CollectionRepresentation,
  marketplace: Market;
  contractHelper: ContractHelpers;
  accounts: SignerWithAddress[];
  // collectionHelper: CollectionHelpers;
}

let initialized = false;
let data: TestData;


export const getTestData = async () => {
  if(initialized) return data;

  const accounts = await hre.ethers.getSigners();
  const sdk = await SdkHelper.init();

  const contractHelper = await hre.ethers.getContractAt(contractHelperAbi, testConfig.contractHelperAddress) as ContractHelpers;

  const MarketFactory = await hre.ethers.getContractFactory('Market');
  const marketplace = await MarketFactory.deploy(0, Date.now()) as Market;
  await marketplace.deployed();

  const [collection] = await Promise.all([
    (sdk.createCollection()),
    (await contractHelper.selfSponsoredEnable(marketplace.address, {gasLimit: 300000})).wait(),
    (await accounts[0].sendTransaction({
      to: marketplace.address,
      value: hre.ethers.utils.parseEther('10'),
    })).wait(),
  ]);

  data = {
    sdk,
    collection,
    marketplace,
    contractHelper,
    accounts,
  }

  initialized = true;
  return data;
}

