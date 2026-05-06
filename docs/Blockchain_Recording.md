# Blockchain Transaction Recording

## Overview

This document describes the blockchain transaction recording feature for PropChain, which enables secure, immutable recording of real estate transactions on the blockchain with verification capabilities.

## Features Implemented

### 1. **Hash Generation** ✅
- **Keccak256-compatible SHA256 hashing** - Generates blockchain-compatible transaction hashes
- **Document hashing** - Supports hashing of property documents for verification
- **Deterministic hashing** - Same input always produces same hash for verification
- **Address normalization** - Standardizes Ethereum addresses to lowercase before hashing

**Implementation**: `generateBlockchainHash()` and `generateDocumentHash()` methods in `BlockchainService`

### 2. **Smart Contract Integration** ✅
- **Contract ABI** - PropertyTransaction.json contains the complete contract interface
- **Transaction recording** - Records transactions with buyer, seller, property hash, and amount
- **Transaction verification** - Verifies recorded transactions on-chain
- **Event emission** - Supports TransactionRecorded and TransactionVerified events

**Location**: `src/blockchain/contracts/PropertyTransaction.json`

### 3. **Transaction Verification** ✅
- **On-chain verification** - Verifies transactions exist on the blockchain
- **Confirmation counting** - Tracks number of block confirmations
- **Status tracking** - Monitors pending, confirmed, and failed statuses
- **Cached verification** - Caches transaction data for performance

**Implementation**: `verifyBlockchainTransaction()` method in `BlockchainService`

### 4. **Explorer Links** ✅
- **Multi-network support** - Generates links for Ethereum, Sepolia, Polygon, and Mumbai
- **Transaction links** - Direct links to view transactions on explorer
- **Address links** - Direct links to view wallet addresses
- **Dynamic URL generation** - Automatically selects correct explorer based on network

**Implementation**: `generateExplorerLink()` method in `BlockchainService`

## API Endpoints

### Record Transaction on Blockchain
```
POST /api/blockchain/record-transaction
```

**Request Body**:
```json
{
  "transactionId": "tx-123",
  "propertyId": "prop-456",
  "buyerAddress": "0xBuyerAddress...",
  "sellerAddress": "0xSellerAddress...",
  "amount": 1000000000000000000,
  "metadata": {
    "propertyAddress": "123 Main St",
    "transactionType": "SALE"
  },
  "network": "sepolia"
}
```

**Response**:
```json
{
  "transactionHash": "0x123abc...",
  "blockchainHash": "0xhash...",
  "contractAddress": "0xContract...",
  "blockNumber": 0,
  "status": "pending",
  "explorerUrl": "https://sepolia.etherscan.io/tx/0x123abc...",
  "createdAt": "2026-04-29T00:00:00Z"
}
```

### Verify Transaction on Blockchain
```
POST /api/blockchain/verify-transaction
```

**Request Body**:
```json
{
  "transactionHash": "0x123abc...",
  "network": "sepolia"
}
```

**Response**:
```json
{
  "verified": true,
  "transactionHash": "0x123abc...",
  "blockNumber": 12345,
  "from": "0xBuyerAddress...",
  "to": "0xContractAddress...",
  "value": "1000000000000000000",
  "status": "success",
  "confirmations": 12,
  "timestamp": "2026-04-29T00:00:00Z"
}
```

### Get Explorer Link
```
GET /api/blockchain/explorer-link/{transactionHash}
```

**Response**:
```json
{
  "transactionHash": "0x123abc...",
  "explorerLink": "https://sepolia.etherscan.io/tx/0x123abc...",
  "network": "sepolia"
}
```

### Get Blockchain Statistics
```
GET /api/blockchain/stats
```

**Response**:
```json
{
  "totalTransactions": 150,
  "confirmedTransactions": 145,
  "pendingTransactions": 4,
  "failedTransactions": 1,
  "totalValue": "150000000000000000000",
  "averageGasUsed": "0",
  "lastUpdated": "2026-04-29T00:00:00Z"
}
```

### Get Service Status
```
GET /api/blockchain/status
```

**Response**:
```json
{
  "enabled": true,
  "network": "sepolia",
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "explorerUrl": "https://sepolia.etherscan.io",
  "cachedTransactions": 42
}
```

## Environment Configuration

Add the following variables to your `.env` file:

```env
# Blockchain Configuration
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_NETWORK=sepolia
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
BLOCKCHAIN_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
BLOCKCHAIN_PRIVATE_KEY=your-wallet-private-key
```

### Configuration Details

- **BLOCKCHAIN_ENABLED**: Enable/disable blockchain recording (default: true)
- **BLOCKCHAIN_NETWORK**: Target network (ethereum, sepolia, polygon, mumbai)
- **BLOCKCHAIN_RPC_URL**: RPC endpoint for blockchain communication
- **BLOCKCHAIN_CONTRACT_ADDRESS**: Deployed smart contract address
- **BLOCKCHAIN_PRIVATE_KEY**: Wallet private key for signing transactions

## Supported Networks

| Network | RPC URL | Explorer | Status |
|---------|---------|----------|--------|
| Ethereum Mainnet | https://eth-mainnet.g.alchemy.com/v2/ | etherscan.io | Production |
| Sepolia Testnet | https://sepolia.infura.io/v3/ | sepolia.etherscan.io | Testing |
| Polygon | https://polygon-rpc.com | polygonscan.com | Production |
| Mumbai Testnet | https://rpc-mumbai.maticvigil.com | mumbai.polygonscan.com | Testing |

## Database Schema

The `Transaction` model in Prisma schema includes blockchain fields:

```prisma
model Transaction {
  id              String    @id @default(uuid())
  propertyId      String    @map("property_id")
  buyerId         String    @map("buyer_id")
  sellerId        String    @map("seller_id")
  amount          Decimal
  type            TransactionType
  status          TransactionStatus @default(PENDING)
  blockchainHash  String?   @map("blockchain_hash")
  contractAddress String?   @map("contract_address")
  notes           String?
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // Relations...
  @@index([blockchainHash])
  @@map("transactions")
}
```

## Implementation Details

### Hash Generation Algorithm

1. **Normalize input data**
   - Convert addresses to lowercase
   - Serialize transaction metadata as JSON
   - Include timestamp for uniqueness

2. **Create SHA256 hash**
   - Use crypto module's createHash('sha256')
   - Prefix with '0x' for blockchain compatibility
   - Result: 64-character hex string

3. **Verification**
   - Regenerate hash with same input
   - Compare hashes for integrity verification

### Smart Contract Flow

```
1. Transaction Initiated
   ↓
2. Generate blockchain hash
   ↓
3. Call recordTransaction() on smart contract
   ↓
4. Smart contract emits TransactionRecorded event
   ↓
5. Transaction pending confirmation
   ↓
6. Miners/Validators confirm transaction
   ↓
7. Transaction confirmed (usually 12+ confirmations)
   ↓
8. Update transaction status in database
```

### Transaction Verification Process

```
1. Request verification with transaction hash
   ↓
2. Check local cache first
   ↓
3. If not cached, query blockchain RPC
   ↓
4. Retrieve transaction details and receipt
   ↓
5. Count block confirmations
   ↓
6. Return verification result
   ↓
7. Cache result for future requests
```

## Testing

Run unit tests:
```bash
npm test -- blockchain.service.spec.ts
```

Tests cover:
- Hash generation consistency
- Address normalization
- Transaction recording
- Verification flows
- Explorer link generation
- Service status

## Integration with Transaction Model

When creating a transaction, automatically record it on blockchain:

```typescript
// In transactions service
const transaction = await prisma.transaction.create({
  data: {
    propertyId,
    buyerId,
    sellerId,
    amount,
    type,
    status: 'PENDING',
  },
});

// Record on blockchain
const blockchainRecord = await blockchainService.recordTransactionOnBlockchain({
  transactionId: transaction.id,
  propertyId,
  buyerAddress: buyer.walletAddress,
  sellerAddress: seller.walletAddress,
  amount: amount.toNumber(),
});

// Update with blockchain data
await prisma.transaction.update({
  where: { id: transaction.id },
  data: {
    blockchainHash: blockchainRecord.blockchainHash,
    contractAddress: blockchainRecord.contractAddress,
  },
});
```

## Error Handling

The service implements comprehensive error handling:

- **Invalid addresses**: Validates Ethereum address format
- **Network errors**: Graceful fallback when blockchain unavailable
- **Transaction failures**: Logs and returns error details
- **Service disabled**: Falls back to local-only recording

## Security Considerations

1. **Private Key Management**
   - Store in secure environment variables
   - Use hardware wallets in production
   - Never commit keys to version control

2. **Transaction Verification**
   - Always verify transaction on-chain before confirming
   - Check multiple confirmations (12+) for security
   - Log all verification attempts

3. **Rate Limiting**
   - Implement rate limits on blockchain API calls
   - Use caching to reduce RPC calls
   - Monitor gas costs

## Performance Optimization

1. **Transaction Caching**
   - Cache verified transactions in memory
   - Reduces RPC calls and latency
   - Configurable TTL for cache entries

2. **Batch Operations**
   - Group multiple transactions for batch recording
   - Reduces on-chain transaction count
   - Saves on gas costs

3. **RPC Selection**
   - Use reliable RPC providers (Infura, Alchemy, etc.)
   - Implement failover to backup RPC URLs
   - Monitor RPC availability and response times

## Future Enhancements

1. **Advanced Features**
   - [ ] Multi-signature contract support
   - [ ] Escrow contract integration
   - [ ] NFT generation for transactions
   - [ ] Cross-chain verification

2. **Integration**
   - [ ] Direct wallet connection
   - [ ] MetaMask/WalletConnect support
   - [ ] Gas fee estimation
   - [ ] Transaction acceleration

3. **Analytics**
   - [ ] Transaction analytics dashboard
   - [ ] Gas cost tracking and optimization
   - [ ] Network performance metrics
   - [ ] Blockchain audit logs

## Support

For issues or questions:
- GitHub Issues: [PropChain-BackEnd/issues](https://github.com/propchain/backend/issues)
- Email: blockchain@propchain.com
- Slack: #blockchain-engineering
