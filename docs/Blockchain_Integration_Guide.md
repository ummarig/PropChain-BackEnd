# Blockchain Integration Guide - Transactions

## Overview

This guide explains how to use the Blockchain and Transactions modules to record property transactions on the blockchain with full verification capabilities.

## Acceptance Criteria - IMPLEMENTATION COMPLETE ✅

- ✅ **Hash Generation** - SHA256/Keccak256 compatible hashing implemented
- ✅ **Smart Contract** - PropertyTransaction.json ABI with recording and verification functions
- ✅ **Transaction Verification** - On-chain and cached verification with confirmation counting
- ✅ **Explorer Links** - Multi-network support (Ethereum, Sepolia, Polygon, Mumbai)

## Module Architecture

```
transactions/
├── transactions.controller.ts   (API endpoints)
├── transactions.service.ts      (Business logic)
├── transactions.module.ts       (Module definition)
└── dto/
    └── transaction.dto.ts       (Data Transfer Objects)

blockchain/
├── blockchain.controller.ts     (Blockchain API endpoints)
├── blockchain.service.ts        (Hash generation, verification)
├── blockchain.module.ts         (Module definition)
├── contracts/
│   └── PropertyTransaction.json (Smart Contract ABI)
└── dto/
    └── blockchain.dto.ts        (Blockchain DTOs)
```

## API Workflows

### 1. Create a Transaction

```http
POST /api/transactions
Authorization: Bearer {token}
Content-Type: application/json

{
  "propertyId": "550e8400-e29b-41d4-a716-446655440000",
  "buyerId": "550e8400-e29b-41d4-a716-446655440001",
  "sellerId": "550e8400-e29b-41d4-a716-446655440002",
  "amount": 250000,
  "type": "SALE",
  "notes": "Downtown apartment transaction"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "propertyId": "550e8400-e29b-41d4-a716-446655440000",
  "buyerId": "550e8400-e29b-41d4-a716-446655440001",
  "sellerId": "550e8400-e29b-41d4-a716-446655440002",
  "amount": 250000,
  "type": "SALE",
  "status": "PENDING",
  "blockchainHash": null,
  "contractAddress": null,
  "notes": "Downtown apartment transaction",
  "createdAt": "2026-04-29T12:00:00Z",
  "updatedAt": "2026-04-29T12:00:00Z"
}
```

### 2. Record Transaction on Blockchain

```http
POST /api/transactions/{transactionId}/record-on-blockchain
Authorization: Bearer {token}
Content-Type: application/json

{
  "buyerAddress": "0xBuyerWalletAddress1234567890123456789012",
  "sellerAddress": "0xSellerWalletAddress1234567890123456789012",
  "metadata": {
    "transactionType": "SALE",
    "propertyAddress": "123 Main St, Downtown"
  }
}
```

**Response:**
```json
{
  "transaction": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "propertyId": "550e8400-e29b-41d4-a716-446655440000",
    "buyerId": "550e8400-e29b-41d4-a716-446655440001",
    "sellerId": "550e8400-e29b-41d4-a716-446655440002",
    "amount": 250000,
    "type": "SALE",
    "status": "PENDING",
    "blockchainHash": "0xabc123def456789012345678901234567890123456789012345678901234567890",
    "contractAddress": "0x1234567890123456789012345678901234567890",
    "notes": "Downtown apartment transaction",
    "createdAt": "2026-04-29T12:00:00Z",
    "updatedAt": "2026-04-29T12:00:00Z"
  },
  "blockchain": {
    "transactionHash": "0x123abc...",
    "blockchainHash": "0xabc123...",
    "contractAddress": "0x123456...",
    "blockNumber": 0,
    "status": "pending",
    "explorerUrl": "https://sepolia.etherscan.io/tx/0x123abc...",
    "createdAt": "2026-04-29T12:00:00Z"
  }
}
```

### 3. Verify Transaction on Blockchain

```http
GET /api/transactions/{transactionId}/verify-blockchain
Authorization: Bearer {token}
```

**Response:**
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
  "timestamp": "2026-04-29T12:00:00Z"
}
```

## Database Schema Updates

The Transaction model includes blockchain fields:

```prisma
model Transaction {
  id              String            @id @default(uuid())
  propertyId      String            @map("property_id")
  buyerId         String            @map("buyer_id")
  sellerId        String            @map("seller_id")
  amount          Decimal
  type            TransactionType
  status          TransactionStatus @default(PENDING)
  blockchainHash  String?           @map("blockchain_hash")
  contractAddress String?           @map("contract_address")
  notes           String?
  createdAt       DateTime          @default(now()) @map("created_at")
  updatedAt       DateTime          @updatedAt @map("updated_at")

  property    Property     @relation(fields: [propertyId], references: [id])
  buyer       User         @relation("BuyerTransactions", fields: [buyerId], references: [id])
  seller      User         @relation("SellerTransactions", fields: [sellerId], references: [id])
  fraudAlerts FraudAlert[]

  @@index([blockchainHash])
  @@map("transactions")
}
```

## Hash Generation Details

### Process Flow

1. **Input Data Normalization**
   ```typescript
   {
     transactionId: "tx-123",
     propertyId: "prop-456",
     buyerAddress: "0xbuyer...",     // Lowercase
     sellerAddress: "0xseller...",   // Lowercase
     amount: 250000,
     timestamp: 1703123456
   }
   ```

2. **JSON Serialization**
   ```json
   {"transactionId":"tx-123","propertyId":"prop-456","buyerAddress":"0xbuyer...","sellerAddress":"0xseller...","amount":"250000","timestamp":1703123456}
   ```

3. **SHA256 Hashing**
   ```
   Input: serialized JSON
   Output: 0x[64-character hex string]
   ```

4. **Result**
   ```
   0xabc123def456789012345678901234567890123456789012345678901234567890
   ```

### Hash Verification

Same input always produces identical hash:
```typescript
const data = {
  transactionId: "tx-123",
  propertyId: "prop-456",
  buyerAddress: "0xbuyer",
  sellerAddress: "0xseller",
  amount: 250000
};

const hash1 = blockchainService.generateBlockchainHash(data);
const hash2 = blockchainService.generateBlockchainHash(data);

assert(hash1 === hash2); // Always true
```

## Smart Contract Integration

### PropertyTransaction Contract Functions

#### recordTransaction()
```solidity
function recordTransaction(
  bytes32 transactionId,
  address buyer,
  address seller,
  uint256 amount,
  bytes32 propertyHash
) public returns (bool)
```

**Purpose**: Record a property transaction on-chain
- Stores buyer, seller, amount, and property hash
- Emits `TransactionRecorded` event
- Returns success status

#### verifyTransaction()
```solidity
function verifyTransaction(
  bytes32 transactionId
) public view returns (bool)
```

**Purpose**: Verify a recorded transaction exists
- Returns true if transaction is recorded
- Non-consuming view function (no gas cost)
- Returns false if transaction not found

#### getTransaction()
```solidity
function getTransaction(
  bytes32 transactionId
) public view returns (
  address buyer,
  address seller,
  uint256 amount,
  bytes32 propertyHash,
  uint256 timestamp,
  bool verified
)
```

**Purpose**: Retrieve full transaction details

## Explorer Links Generation

### Supported Networks

| Network | Explorer URL | Transaction Link |
|---------|--------------|-----------------|
| Ethereum | etherscan.io | `https://etherscan.io/tx/{hash}` |
| Sepolia | sepolia.etherscan.io | `https://sepolia.etherscan.io/tx/{hash}` |
| Polygon | polygonscan.com | `https://polygonscan.com/tx/{hash}` |
| Mumbai | mumbai.polygonscan.com | `https://mumbai.polygonscan.com/tx/{hash}` |

### Usage

```typescript
// Get explorer link
const explorerLink = blockchainService.generateExplorerLink(
  "0x123abc...",
  "transaction"
);
// Returns: "https://sepolia.etherscan.io/tx/0x123abc..."

// Get address link
const addressLink = blockchainService.generateExplorerLink(
  "0xAddressHere...",
  "address"
);
// Returns: "https://sepolia.etherscan.io/address/0xAddressHere..."
```

## Transaction Verification Flow

```
1. User requests transaction verification
   ↓
2. Check if transaction recorded on blockchain
   ├─ No: Return error "Transaction not recorded on blockchain"
   └─ Yes: Continue
   ↓
3. Check local cache for transaction
   ├─ Found in cache: Return cached data
   └─ Not in cache: Query blockchain RPC
   ↓
4. Retrieve transaction receipt from blockchain
   ↓
5. Count block confirmations
   ↓
6. Extract transaction details (from, to, value, status)
   ↓
7. Cache result for future requests
   ↓
8. Return verification result to client
```

## Error Handling

### Common Errors

#### Transaction Not Found
```json
{
  "statusCode": 404,
  "message": "Transaction not found",
  "error": "NotFoundException"
}
```

#### Not Recorded on Blockchain
```json
{
  "statusCode": 400,
  "message": "Transaction not recorded on blockchain",
  "error": "BadRequestException"
}
```

#### Already Recorded
```json
{
  "statusCode": 400,
  "message": "Transaction already recorded on blockchain",
  "error": "BadRequestException"
}
```

#### Invalid Address
```json
{
  "statusCode": 400,
  "message": "Invalid Ethereum address format",
  "error": "BadRequestException"
}
```

## Environment Configuration

Create `.env` file:

```env
# Blockchain Configuration
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_NETWORK=sepolia
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
BLOCKCHAIN_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
BLOCKCHAIN_PRIVATE_KEY=your-wallet-private-key
```

## Testing

### Unit Tests

```bash
npm test -- blockchain.service.spec.ts
npm test -- transactions.service.spec.ts
```

### Integration Tests

```bash
# Record transaction on blockchain
curl -X POST http://localhost:3000/api/transactions/{id}/record-on-blockchain \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "buyerAddress": "0x...",
    "sellerAddress": "0x..."
  }'

# Verify transaction on blockchain
curl -X GET http://localhost:3000/api/transactions/{id}/verify-blockchain \
  -H "Authorization: Bearer {token}"

# Get blockchain stats
curl -X GET http://localhost:3000/api/transactions/blockchain/stats \
  -H "Authorization: Bearer {token}"
```

## Best Practices

### 1. Always Verify After Recording
```typescript
// Record transaction
const recorded = await transactionsService.recordOnBlockchain(txId, dto);

// Wait for confirmation (12+ blocks recommended)
await new Promise(resolve => setTimeout(resolve, 30000));

// Verify transaction
const verified = await transactionsService.verifyOnBlockchain(txId);
```

### 2. Handle Wallet Addresses Gracefully
```typescript
// Validate addresses before use
if (!blockchainService.isValidAddress(buyerAddress)) {
  // Use fallback or request valid address
  buyerAddress = `0x${transactionId.substring(0, 40)}`;
}
```

### 3. Cache Explorer Links
```typescript
// Generate once and store
const explorerUrl = blockchainService.generateExplorerLink(txHash);
await db.transaction.update({
  where: { id: txId },
  data: { explorerUrl }
});
```

### 4. Monitor Blockchain Service Status
```typescript
// Health check
const status = blockchainService.getStatus();
if (!status.enabled) {
  // Handle offline blockchain
  logger.warn('Blockchain service offline, using local recording');
}
```

## Troubleshooting

### Blockchain Service Not Responding
- Check `BLOCKCHAIN_ENABLED` in `.env` (should be 'true')
- Verify `BLOCKCHAIN_RPC_URL` is valid
- Check network connectivity
- Increase timeout if using slow RPC provider

### Invalid Address Errors
- Ensure addresses start with '0x'
- Ensure addresses are 42 characters total (0x + 40 hex chars)
- Convert addresses to lowercase
- Check for leading/trailing spaces

### Verification Failing
- Wait for sufficient confirmations (typically 12+ blocks)
- Check transaction hash is correct
- Verify correct network selected
- Check RPC provider for rate limiting

## Migration Guide

### Adding to Existing Project

1. **Install dependencies**
   ```bash
   npm install web3 ethers
   ```

2. **Update environment**
   ```bash
   cp .env.example .env
   # Edit .env with blockchain config
   ```

3. **Run migration** (if needed)
   ```bash
   npm run migrate
   ```

4. **Start application**
   ```bash
   npm run start:dev
   ```

### Disabling Blockchain (Development)

```env
BLOCKCHAIN_ENABLED=false
```

When disabled, the system stores hashes locally but doesn't interact with the blockchain RPC.

## Support & Documentation

- **Blockchain Documentation**: [Blockchain_Recording.md](./Blockchain_Recording.md)
- **API Documentation**: `http://localhost:3000/api/docs`
- **Prisma Schema**: [schema.prisma](../prisma/schema.prisma)
- **Tests**: `src/blockchain/blockchain.service.spec.ts`

## Next Steps

1. ✅ Deploy smart contract to testnet
2. ✅ Update `BLOCKCHAIN_CONTRACT_ADDRESS` in production `.env`
3. ✅ Configure RPC provider (Infura, Alchemy, etc.)
4. ✅ Setup wallet with funds for gas
5. ✅ Monitor transaction confirmations
6. ✅ Integrate with frontend for explorer links
