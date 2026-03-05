<div align="center">

# Kudos

**Transparent grants with milestone-based escrow payouts.**

Sponsors fund confidently. Students build faster. Every payout is verifiable on Algorand.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Algorand](https://img.shields.io/badge/Algorand-Testnet-black?logo=algorand)](https://www.algorand.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

---

## What is Kudos?

A grant platform where sponsors fund student projects through **proof-driven milestones** and **on-chain escrow**. No trust issues — just code, proof, and payouts.

### Features

- 🎯 **Role-based dashboards** — tailored views for sponsors & students
- 🛒 **Proposal marketplace** — publish, discover, and fund projects
- ✅ **Milestone payouts** — submit proof → review → ALGO released from escrow
- 🔒 **Smart contract escrow** — funds locked on Algorand until milestones clear
- 👛 **Wallet-first auth** — Pera Wallet = your identity
- 🔔 **Live notifications** — instant updates on reviews & payouts
- 🤖 **AI assistant** — in-app chatbot for platform help

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · Recharts · Lucide Icons |
| **Backend** | Next.js Route Handlers · MongoDB · JWT (HttpOnly cookies) |
| **Blockchain** | Algorand SDK · Pera Wallet Connect · PyTEAL smart contract |
| **AI** | OpenRouter API (multi-model chatbot) |

---

## Project Structure

```text
app/
  api/                 # REST endpoints (auth, projects, grants, milestones, chat)
  dashboard/student/   # Student dashboard & components
  sponsor/dashboard/   # Sponsor dashboard
components/            # Shared UI & dashboard view components
contexts/              # Theme + Wallet React providers
hooks/                 # Custom hooks (auth, etc.)
lib/                   # Core utilities — DB, auth, blockchain helpers, models
contracts/             # Algorand smart contract source & compiled artifacts
```

---

## How It Works

### Authentication

Users connect their **Pera Wallet**, then register or log in. The server issues a secure session token tied to the wallet address and role (`student` or `sponsor`). Middleware enforces role-based route access across the app.

### Student Workflow

```
Connect Wallet → Register as Student → Submit Proposal
     → Get Funded by Sponsor → Complete Milestones → Receive ALGO Payouts
```

1. **Submit a proposal** with project details, deliverables, timeline, budget, and GitHub link.
2. **Get funded** — a sponsor picks the project and creates an escrow-backed grant.
3. **Complete milestones** — upload proof (file or link) for each milestone.
4. **Get paid** — sponsor reviews and approves; ALGO is released from escrow to the student wallet.
5. **Track everything** — earnings, transaction history, and notifications in one dashboard.

**Dashboard sections:** Overview · My Proposals · Active Grant · Milestones · Earnings · Transactions · Notifications · Settings

### Sponsor Workflow

```
Connect Wallet → Register as Sponsor → Browse Projects
     → Fund Grant (escrow) → Review Milestones → Release Payouts
```

1. **Browse open proposals** on the project marketplace.
2. **Create a grant** — deploy an Algorand escrow contract and fund it.
3. **Review milestones** — approve or reject submitted proof (sequential order enforced).
4. **Complete or cancel** — mark grants done, or clawback remaining escrow if needed.

**Dashboard sections:** Overview · Projects · Active Grant · Transactions

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** (or yarn/pnpm)
- A **MongoDB** instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- An **Algorand Testnet** wallet ([Pera Wallet](https://perawallet.app/))

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/kudos.git
cd kudos
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy the example below into a `.env.local` file in the project root and fill in your values:

```bash
# Database
MONGODB_URI=<your-mongodb-connection-string>

# Auth
JWT_SECRET=<random-secret-min-32-chars>

# Algorand node (defaults work for public testnet)
NEXT_PUBLIC_ALGOD_SERVER=https://testnet-api.algonode.cloud
NEXT_PUBLIC_ALGOD_PORT=
NEXT_PUBLIC_ALGOD_TOKEN=

# Smart contract bytecode (base64-encoded approval & clear programs)
NEXT_PUBLIC_APPROVAL_PROGRAM_B64=<base64-approval-program>
NEXT_PUBLIC_CLEAR_PROGRAM_B64=<base64-clear-program>

# AI chatbot (optional — get a free key at https://openrouter.ai)
OPENROUTER_API_KEY=<your-openrouter-key>
```

> **Security note:** Never commit `.env.local` or any file containing real secrets. The `.gitignore` already excludes it.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Using Kudos Without Local Setup

If you just want to **use** the platform (not develop it):

1. Visit the live deployment URL.
2. Install [Pera Wallet](https://perawallet.app/) on your phone and create/import a testnet account.
3. Open Kudos in your browser → Connect Wallet → Sign up as **Student** or **Sponsor**.
4. Start submitting proposals or funding grants directly from the browser.

No local Node.js, database, or blockchain tools needed.

---

## Smart Contract

The escrow contract is written in Python (PyTEAL-style) and compiled to TEAL:

- **Source:** `contracts/kudos_escrow_contract.py`
- **Compiled artifacts:** `contracts/artifacts/`

The contract locks sponsor funds on creation, tracks milestone progress on-chain, and releases proportional ALGO payouts per approved milestone.

---

## Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please make sure your code passes linting (`npm run lint`) before submitting.

---

## License

This project is open source under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with ❤️ on Algorand</sub>
</div>