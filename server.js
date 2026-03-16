const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fetch = require('node-fetch');
const cors = require('cors');
const { initReferralSystem } = require('./referral');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Initialize ViralSign referral system
initReferralSystem(app);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration
const PORT = process.env.PORT || 3002;
const MIN_PROFIT_PERCENT = 0.5; // Minimum 0.5% profit after fees
const FLASH_LOAN_FEE_AAVE = 0.0005; // 0.05%
const FLASH_LOAN_FEE_BALANCER = 0; // 0%
const GAS_COST_ETH = 0.002; // ~$5 at current prices

// High-volume trading pairs to monitor
const PAIRS = [
  { name: 'ETH/USDC', token0: 'ETH', token1: 'USDC', decimals0: 18, decimals1: 6 },
  { name: 'WBTC/ETH', token0: 'WBTC', token1: 'ETH', decimals0: 8, decimals1: 18 },
  { name: 'ETH/USDT', token0: 'ETH', token1: 'USDT', decimals0: 18, decimals1: 6 },
  { name: 'LINK/ETH', token0: 'LINK', token1: 'ETH', decimals0: 18, decimals1: 18 },
  { name: 'UNI/ETH', token0: 'UNI', token1: 'ETH', decimals0: 18, decimals1: 18 },
  { name: 'AAVE/ETH', token0: 'AAVE', token1: 'ETH', decimals0: 18, decimals1: 18 },
];

// Simulated DEX prices (will be replaced with real API calls)
let opportunities = [];
let lastUpdate = Date.now();

// Uniswap V3 Subgraph query
const UNISWAP_V3_SUBGRAPH = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';
const SUSHISWAP_SUBGRAPH = 'https://api.thegraph.com/subgraphs/name/sushiswap/exchange';

async function fetchUniswapV3Price(pair) {
  // Simplified query - in production would query specific pools
  const query = `
    query {
      pools(first: 5, where: { token0_: { symbol: "${pair.token0}" }, token1_: { symbol: "${pair.token1}" } }) {
        sqrtPriceX96
        token0 { symbol decimals }
        token1 { symbol decimals }
      }
    }
  `;
  
  try {
    // Simulating API call - will implement real fetch in production
    // For MVP, using CoinGecko as reliable price source
    return null;
  } catch (error) {
    console.error('Uniswap V3 fetch error:', error);
    return null;
  }
}

// Fetch prices from CoinGecko (reliable free API)
async function fetchCoinGeckoPrices() {
  try {
    const ids = 'ethereum,bitcoin,chainlink,uniswap,aave';
    const vs_currencies = 'usd,eth';
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vs_currencies}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('CoinGecko fetch error:', error);
    return null;
  }
}

// Simulate DEX price variations (for MVP - will use real data in production)
function simulateDEXPrices(basePrices) {
  const variations = {};
  
  for (const [token, prices] of Object.entries(basePrices || {})) {
    // Uniswap V3 price with small variation
    const uniVariation = (Math.random() - 0.5) * 0.002; // ±0.1%
    variations[token] = {
      uniswap: prices.usd * (1 + uniVariation),
      sushiswap: prices.usd * (1 - uniVariation), // Opposite direction for arbitrage simulation
      eth: prices.eth
    };
  }
  
  return variations;
}

// Calculate arbitrage opportunities
function calculateOpportunities(prices) {
  const ops = [];
  
  for (const pair of PAIRS) {
    const token0 = pair.token0.toLowerCase();
    const token1 = pair.token1.toLowerCase();
    
    // Map token symbols to CoinGecko IDs
    const idMap = {
      'eth': 'ethereum',
      'wbtc': 'bitcoin', 
      'link': 'chainlink',
      'uni': 'uniswap',
      'aave': 'aave'
    };
    
    const id0 = idMap[token0] || token0;
    const id1 = idMap[token1] || token1;
    
    if (!prices[id0] || !prices[id1]) continue;
    
    const price0_uni = prices[id0].uniswap;
    const price0_sushi = prices[id0].sushiswap;
    const price1_uni = prices[id1].uniswap;
    const price1_sushi = prices[id1].sushiswap;
    
    // Calculate pair prices on each DEX
    const pairPriceUni = price0_uni / price1_uni;
    const pairPriceSushi = price0_sushi / price1_sushi;
    
    // Check for arbitrage
    const spread = Math.abs(pairPriceUni - pairPriceSushi) / Math.min(pairPriceUni, pairPriceSushi) * 100;
    
    if (spread > 0.1) { // At least 0.1% spread
      const buyDex = pairPriceUni < pairPriceSushi ? 'Uniswap V3' : 'SushiSwap';
      const sellDex = pairPriceUni < pairPriceSushi ? 'SushiSwap' : 'Uniswap V3';
      const buyPrice = Math.min(pairPriceUni, pairPriceSushi);
      const sellPrice = Math.max(pairPriceUni, pairPriceSushi);
      
      // Calculate with flash loan fees
      const flashFeeAave = FLASH_LOAN_FEE_AAVE * 100;
      const flashFeeBalancer = FLASH_LOAN_FEE_BALANCER * 100;
      const gasCostPercent = (GAS_COST_ETH / (buyPrice * 100)) * 100; // Approximate
      
      const netProfitAave = spread - flashFeeAave - gasCostPercent;
      const netProfitBalancer = spread - flashFeeBalancer - gasCostPercent;
      
      const bestProvider = netProfitBalancer > netProfitAave ? 'Balancer V2' : 'AAVE v3';
      const bestProfit = Math.max(netProfitAave, netProfitBalancer);
      
      if (bestProfit > MIN_PROFIT_PERCENT) {
        ops.push({
          pair: pair.name,
          buyDex,
          sellDex,
          buyPrice: buyPrice.toFixed(6),
          sellPrice: sellPrice.toFixed(6),
          spread: spread.toFixed(3),
          flashLoanFee: (bestProvider === 'Balancer V2' ? 0 : 0.05).toFixed(2),
          gasCost: GAS_COST_ETH.toFixed(4),
          netProfit: bestProfit.toFixed(3),
          recommendedProvider: bestProvider,
          timestamp: Date.now(),
          executionTime: '< 12 seconds',
          confidence: spread > 1 ? 'High' : spread > 0.5 ? 'Medium' : 'Low'
        });
      }
    }
  }
  
  return ops.sort((a, b) => parseFloat(b.netProfit) - parseFloat(a.netProfit));
}

// Main scanner loop
async function scanForArbitrage() {
  try {
    // Fetch real prices
    const basePrices = await fetchCoinGeckoPrices();
    
    if (basePrices) {
      // Simulate DEX variations for MVP
      const dexPrices = simulateDEXPrices(basePrices);
      
      // Calculate opportunities
      opportunities = calculateOpportunities(dexPrices);
      lastUpdate = Date.now();
      
      // Broadcast to all connected clients
      broadcastUpdate();
      
      console.log(`[${new Date().toISOString()}] Scan complete: ${opportunities.length} opportunities found`);
    }
  } catch (error) {
    console.error('Scanner error:', error);
  }
}

// Broadcast to WebSocket clients
function broadcastUpdate() {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'update',
        opportunities,
        lastUpdate,
        count: opportunities.length
      }));
    }
  });
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  // Send immediate update
  ws.send(JSON.stringify({
    type: 'update',
    opportunities,
    lastUpdate,
    count: opportunities.length
  }));
  
  ws.on('close', () => {
    console.log('WebSocket disconnected');
  });
});

// REST API endpoints
app.get('/api/opportunities', (req, res) => {
  res.json({
    opportunities,
    lastUpdate,
    count: opportunities.length,
    nextScan: lastUpdate + 30000
  });
});

app.get('/api/pairs', (req, res) => {
  res.json({ pairs: PAIRS });
});

app.get('/api/config', (req, res) => {
  res.json({
    minProfitPercent: MIN_PROFIT_PERCENT,
    flashLoanFeeAave: FLASH_LOAN_FEE_AAVE * 100,
    flashLoanFeeBalancer: FLASH_LOAN_FEE_BALANCER * 100,
    gasCostEth: GAS_COST_ETH
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Start server
server.listen(PORT, () => {
  console.log(`FlashArb Scanner running on port ${PORT}`);
  console.log(`WebSocket ready for real-time updates`);
  
  // Initial scan
  scanForArbitrage();
  
  // Scan every 30 seconds
  setInterval(scanForArbitrage, 30000);
});

module.exports = { app, server };
