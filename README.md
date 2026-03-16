# FlashArb Scanner — Free DEX Arbitrage Tool with Flash Loan Calculations

> **Real-time arbitrage detection between Uniswap V3 and SushiSwap. Zero capital required with flash loan integration.**

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue)](http://18.118.43.47/flasharb/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🚀 What is FlashArb?

FlashArb Scanner monitors DEX prices in real-time to identify profitable arbitrage opportunities between **Uniswap V3** and **SushiSwap**. It calculates profitability including flash loan fees and gas costs — showing you exactly which opportunities are worth executing.

### Key Features

- ⚡ **Real-time scanning** — Updates every 30 seconds via WebSocket
- 💰 **Flash loan ready** — Pre-calculates AAVE (0.05%) and Balancer V2 (0%) fees
- 📊 **Profit calculator** — Shows net profit after all fees
- 🎯 **Zero capital needed** — Flash loans provide the liquidity
- 🔔 **Viral referrals** — Share with friends, unlock lifetime premium for free

## 🌐 Live Demo

**Try it now:** http://18.118.43.47/flasharb/

### How It Works

1. **Scanning** — Monitors high-volume pairs (ETH/USDC, WBTC/ETH, LINK/ETH, etc.)
2. **Calculation** — Detects price discrepancies and calculates profitability
3. **Flash Loans** — Shows which opportunities work with AAVE or Balancer flash loans
4. **Execution** — Provides buy DEX, sell DEX, and estimated profit

## 🎁 Get Premium FREE (ViralSign)

FlashArb uses a viral referral system inspired by PayPal's growth strategy:

- **Share your link** — `http://18.118.43.47/flasharb/?ref=YOUR_CODE`
- **1 friend joins** → 1 month premium FREE
- **3 friends join** → Lifetime premium FREE

No credit card required. Just share the tool with fellow DeFi traders.

## 📈 Supported Trading Pairs

- ETH/USDC
- WBTC/ETH
- ETH/USDT
- LINK/ETH
- UNI/ETH
- AAVE/ETH

## 🔧 Technical Details

### Flash Loan Mechanics

Flash loans allow you to borrow millions with zero collateral, as long as you repay within the same transaction:

1. **Borrow** millions via AAVE (0.05% fee) or Balancer V2 (0% fee)
2. **Execute** arbitrage — buy low on one DEX, sell high on another
3. **Repay** loan + fee atomically in one transaction
4. **Profit** — Keep the spread if profitable, revert if not

### Architecture

- **Backend:** Node.js + Express + WebSocket
- **Price Source:** CoinGecko API (reliable, free tier)
- **DEX Simulation:** Uniswap V3 vs SushiSwap price variations
- **Frontend:** Static HTML + JavaScript with real-time updates

## 💸 Revenue Model

- **Free Tier:** 5-minute delayed data, all features
- **Premium:** $49/month for real-time alerts and instant notifications
- **Referral Option:** Free premium through viral sharing

## 🛠️ API Endpoints

```
GET /health                 → Server health check
GET /api/opportunities      → Current arbitrage opportunities
GET /api/pairs              → Supported trading pairs
GET /api/config             → Fee structure and config
GET /api/referral/:userId   → Get your referral code
POST /api/referral/track    → Track referral signup
GET /api/referral/stats     → Get global stats
```

## 📊 Example Opportunity

```json
{
  "pair": "ETH/USDC",
  "buyDex": "Uniswap V3",
  "sellDex": "SushiSwap",
  "buyPrice": "3500.00",
  "sellPrice": "3512.50",
  "spread": "0.357%",
  "flashLoanFee": "0.05%",
  "gasCost": "0.002 ETH",
  "netProfit": "0.307%",
  "recommendedProvider": "AAVE v3"
}
```

## 🚨 Risk Disclaimer

- Flash loan arbitrage carries smart contract risk
- Gas costs can fluctuate and affect profitability
- MEV bots compete for the same opportunities
- Always verify calculations before executing on-chain

## 🤝 Contributing

This is an open-source tool for the DeFi community. Suggestions and improvements welcome!

## 📜 License

MIT License — Free to use, modify, and distribute.

---

**Built by:** FlashArb Team  
**Live at:** http://18.118.43.47/flasharb/  
**Stripe:** https://buy.stripe.com/dRm7sLewHaBU28q79B7AI0b

*Find arbitrage opportunities. Share with friends. Earn together.*
