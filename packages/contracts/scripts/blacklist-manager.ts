import { ethers } from 'ethers';
import { loadConfig } from './config';
import { getContractAbi } from './deploy';

interface BlacklistManagerArgs {
  contractAddress: string;
  action: 'showAdmin' | 'blacklist' | 'unblacklist';
  collectionId?: number;
  network?: 'unq' | 'qtz' | 'opal';
}

function parseArgs(): BlacklistManagerArgs {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: ts-node blacklist-manager.ts <contractAddress> <action> [collectionId] [network]');
    console.log('Actions:');
    console.log('  showAdmin [network] - show current contract admin');
    console.log('  blacklist <collectionId> [network] - add collection to blacklist');
    console.log('  unblacklist <collectionId> [network] - remove collection from blacklist');
    console.log('Networks: unq, qtz, opal (default: opal)');
    process.exit(1);
  }

  const contractAddress = args[0];
  const action = args[1] as 'showAdmin' | 'blacklist' | 'unblacklist';
  
  let collectionId: number | undefined;
  let network: 'unq' | 'qtz' | 'opal' = 'opal';
  
  if (action === 'showAdmin') {
    // For showAdmin: args[2] is network (optional)
    network = (args[2] as 'unq' | 'qtz' | 'opal') || 'opal';
  } else {
    // For blacklist/unblacklist: args[2] is collectionId, args[3] is network
    collectionId = args[2] ? parseInt(args[2], 10) : undefined;
    network = (args[3] as 'unq' | 'qtz' | 'opal') || 'opal';
    
    if (!collectionId) {
      console.error('Collection ID is required for blacklist/unblacklist actions');
      process.exit(1);
    }
  }

  return { contractAddress, action, collectionId, network };
}

async function getContractVersion(contractAddress: string, rpcUrl: string): Promise<number> {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Try different ABI versions, starting with the newest
    for (let version = 3; version >= 0; version--) {
      try {
        const abi = getContractAbi(version);
        if (!abi) continue;
        
        const contract = new ethers.Contract(contractAddress, abi, provider);
        
        // Check that the contract responds to version() call
        const contractVersion = await contract.version();
        console.log(`Detected contract version: ${contractVersion}`);
        return version;
      } catch (e) {
        // Try next version
        continue;
      }
    }
    
    // If nothing worked, use the latest version
    console.log('Could not detect version, using latest (3)');
    return 3;
  } catch (e) {
    console.log('Error detecting version, using latest (3)');
    return 3;
  }
}

async function showAdmin(contractAddress: string, rpcUrl: string): Promise<void> {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const version = await getContractVersion(contractAddress, rpcUrl);
  const abi = getContractAbi(version);
  
  if (!abi) {
    throw new Error(`ABI not found for version ${version}`);
  }

  const contract = new ethers.Contract(contractAddress, abi, provider);
  
  try {
    const owner = await contract.owner();
    console.log(`Contract owner/admin: ${owner}`);
    
    // Additionally check contract version
    try {
      const contractVersion = await contract.version();
      console.log(`Contract version: ${contractVersion}`);
    } catch (e) {
      console.log('Version method not available');
    }
    
  } catch (error: any) {
    console.error('Error getting contract owner:', error.message);
  }
}

async function manageBlacklist(
  contractAddress: string, 
  rpcUrl: string, 
  action: 'blacklist' | 'unblacklist', 
  collectionId: number,
  accounts: string[]
): Promise<void> {
  if (accounts.length === 0) {
    throw new Error('No accounts configured. Set SOL_ACCOUNTS environment variable.');
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const version = await getContractVersion(contractAddress, rpcUrl);
  const abi = getContractAbi(version);
  
  if (!abi) {
    throw new Error(`ABI not found for version ${version}`);
  }

  // Use first account from config
  const wallet = new ethers.Wallet(accounts[0], provider);
  const contract = new ethers.Contract(contractAddress, abi, wallet);
  
  console.log(`Using account: ${wallet.address}`);
  
  try {
    // Check that account is admin
    const owner = await contract.owner();
    console.log(`Contract owner: ${owner}`);
    
    if (wallet.address.toLowerCase() !== owner.toLowerCase()) {
      // Check if there's an admins mapping
      try {
        const isAdmin = await contract.admins(wallet.address);
        if (!isAdmin) {
          console.error(`Account ${wallet.address} is not admin of the contract`);
          return;
        }
        console.log(`Account ${wallet.address} is admin`);
      } catch (e) {
        console.error(`Account ${wallet.address} is not owner and admins mapping check failed`);
        return;
      }
    } else {
      console.log(`Account ${wallet.address} is owner`);
    }

    const methodName = action === 'blacklist' ? 'addToBlacklist' : 'removeFromBlacklist';
    console.log(`Calling ${methodName} for collection ${collectionId}...`);
    
    const tx = await contract[methodName](collectionId, {
      gasLimit: 300000
    });
    
    console.log(`Transaction sent: ${tx.hash}`);
    console.log('Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`Collection ${collectionId} ${action === 'blacklist' ? 'added to' : 'removed from'} blacklist`);
    
  } catch (error: any) {
    console.error(`Error ${action}ing collection:`, error.message);
    if (error.reason) {
      console.error('Reason:', error.reason);
    }
  }
}

async function main() {
  const { contractAddress, action, collectionId, network } = parseArgs();
  const config = loadConfig();
  
  let networkConfig;
  if (network === 'unq') {
    networkConfig = config.unq;
  } else if (network === 'qtz') {
    networkConfig = config.qtz;
  } else {
    networkConfig = config.opal;
  }
  
  if (!networkConfig.rpcUrl) {
    console.error(`RPC URL not configured for network ${network}`);
    process.exit(1);
  }

  console.log(`Using network: ${network}`);
  console.log(`RPC URL: ${networkConfig.rpcUrl}`);
  console.log(`Contract: ${contractAddress}`);
  console.log(`Action: ${action}`);
  
  if (collectionId !== undefined) {
    console.log(`Collection ID: ${collectionId}`);
  }
  
  try {
    if (action === 'showAdmin') {
      await showAdmin(contractAddress, networkConfig.rpcUrl);
    } else {
      await manageBlacklist(contractAddress, networkConfig.rpcUrl, action, collectionId!, config.accounts);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}