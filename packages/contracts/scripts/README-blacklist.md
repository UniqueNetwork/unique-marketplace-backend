# Blacklist Manager Script

Script for managing collection blacklist in the marketplace contract.

## Setup

Before using, make sure the environment variables are configured:

```bash
# Private keys of accounts (comma-separated)
SOL_ACCOUNTS=0x1234...,0x5678...

# RPC URLs for networks
SOL_OPAL_RPC_URL=wss://ws-opal.unique.network
SOL_QTZ_RPC_URL=wss://ws-quartz.unique.network  
SOL_UNQ_RPC_URL=wss://ws.unique.network
```

## Usage

### Show current contract admin

```bash
npm run sol:blacklist <contract_address> showAdmin [network]

# Examples:
npm run sol:blacklist 0x1234567890abcdef showAdmin opal
npm run sol:blacklist 0x1234567890abcdef showAdmin qtz
npm run sol:blacklist 0x1234567890abcdef showAdmin unq
```

### Add collection to blacklist

```bash
npm run sol:blacklist <contract_address> blacklist <collection_id> [network]

# Example:
npm run sol:blacklist 0x1234567890abcdef blacklist 123 opal
```

### Remove collection from blacklist

```bash
npm run sol:blacklist <contract_address> unblacklist <collection_id> [network]

# Example:
npm run sol:blacklist 0x1234567890abcdef unblacklist 123 opal
```

## Parameters

- `contract_address` - marketplace contract address
- `action` - action: `showAdmin`, `blacklist`, `unblacklist`
- `collection_id` - collection ID (only for blacklist/unblacklist)
- `network` - network: `opal` (default), `qtz`, `unq`

## Access Rights

To perform blacklist operations, the account must be:
- Contract owner (owner), OR
- Contract administrator (admin)

The script automatically checks access rights before performing operations.

## Usage Examples

```bash
# 1. Get contract admin on Opal
npm run sol:blacklist 0xabcd1234 showAdmin

# 2. Blacklist collection 456 on Quartz
npm run sol:blacklist 0xabcd1234 blacklist 456 qtz

# 3. Unblacklist collection 456 on Unique
npm run sol:blacklist 0xabcd1234 unblacklist 456 unq
```

## Troubleshooting

### "Account is not admin of the contract"
Make sure the account from `SOL_ACCOUNTS` is the owner or administrator of the contract.

### "RPC URL not configured"
Check that the environment variable for the corresponding network is configured.

### "No accounts configured"
Make sure the `SOL_ACCOUNTS` variable is configured with private keys.