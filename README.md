# Grant Tracker - Transparent Fund Management System

A blockchain-based grant and fund tracking system built on Algorand for transparent, milestone-based allocation and utilization of student project funds.

## Features

- **Role-Based Authentication**: Support for Students and Sponsors
- **Pera Wallet Integration**: Secure wallet connection for Algorand blockchain
- **MongoDB Database**: Store user profiles and project data
- **Milestone-Based Funding**: Smart contract-based fund disbursement
- **Real-Time Dashboard**: Track grants, milestones, and transactions

## Tech Stack

- **Frontend**: Next.js 16 with TypeScript
- **Blockchain**: Algorand (via Pera Wallet & algosdk)
- **Database**: MongoDB
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB running locally or connection URI
- Pera Wallet mobile app for testing

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env.local`:
```
MONGODB_URI=mongodb://localhost:27017/grant-tracking
NEXT_PUBLIC_ALGOD_TOKEN=
NEXT_PUBLIC_ALGOD_SERVER=https://testnet-api.algonode.cloud
NEXT_PUBLIC_ALGOD_PORT=443
```

3. Start MongoDB (if running locally):
```bash
mongod
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## User Roles

### Student
- Submit project proposals
- Track milestones and funding
- Receive milestone-based payments

### Sponsor
- Create and fund grants
- Monitor project progress
- Track fund utilization
- Approve milestone completions

## Authentication Flow

### Signup
1. Enter name, email, and organization
2. Select role (Student/Sponsor)
3. Connect Pera Wallet via QR code
4. Account created and redirected to dashboard

### Login
1. Scan QR code with Pera Wallet
2. System checks wallet address and role
3. Redirected to role-specific dashboard

## Project Structure

```
├── app/
│   ├── api/auth/          # Authentication endpoints
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── students/          # Student dashboard
│   └── sponsors/          # Sponsor dashboard
├── contexts/
│   └── WalletContext.tsx  # Pera Wallet integration
├── lib/
│   ├── mongodb.ts         # MongoDB connection
│   └── types.ts           # TypeScript types
└── .env.local             # Environment variables
```

## Next Steps

- Implement smart contracts for milestone-based fund disbursement
- Add project creation and management features
- Build sponsor approval mechanism for milestone completions
- Create transaction dashboard with real-time updates
- Add escrow functionality for conditional payments

## License

MIT
