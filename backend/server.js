/**
 * LiMeiHua Lightning Wallet - Backend Server
 * 
 * ชุดซอฟต์แวร์ชุดนี้ มีไว้เพื่อเป็นโครงสร้างพื้นฐานทางการเงินยุคใหม่
 * เพื่อรองรับการไหลของเงินจำนวนมหาศาลของท่านผู้เฒ่าหลี่เหมยฮัว หรือ LiMeiHua Grand Mother
 * และ source code นี้สร้างโดย Mr.Kanutsanan Pongpanna (นายคณัสนันท์ พงษ์พันนา)
 * URL: https://chatgpt.com/g/g-68d289535dec81919445deb9830f2d8e-kanutsanan-pongpanna
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Wallet Service (Mock Implementation)
class WalletService {
  constructor() {
    this.wallets = new Map();
    this.transactions = [];
  }

  createWallet(userId, walletName) {
    const walletId = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const wallet = {
      id: walletId,
      userId,
      name: walletName,
      address: `lnbc_${Math.random().toString(36).substr(2, 20)}`,
      balances: {
        btc: 0,
        usdt: 0,
        taproot: {}
      },
      createdAt: new Date(),
      transactions: []
    };
    this.wallets.set(walletId, wallet);
    return wallet;
  }

  getWallet(walletId) {
    return this.wallets.get(walletId);
  }

  listWallets(userId) {
    return Array.from(this.wallets.values()).filter(w => w.userId === userId);
  }

  sendPayment(fromWalletId, toAddress, amount, currency) {
    const wallet = this.wallets.get(fromWalletId);
    if (!wallet) throw new Error('Wallet not found');

    const transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: wallet.address,
      to: toAddress,
      amount,
      currency,
      status: 'pending',
      createdAt: new Date(),
      hash: `hash_${Math.random().toString(36).substr(2, 20)}`
    };

    wallet.transactions.push(transaction);
    this.transactions.push(transaction);
    return transaction;
  }

  receivePayment(toWalletId, fromAddress, amount, currency) {
    const wallet = this.wallets.get(toWalletId);
    if (!wallet) throw new Error('Wallet not found');

    const transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: fromAddress,
      to: wallet.address,
      amount,
      currency,
      status: 'confirmed',
      createdAt: new Date(),
      hash: `hash_${Math.random().toString(36).substr(2, 20)}`
    };

    wallet.transactions.push(transaction);
    this.transactions.push(transaction);

    // Update balance
    if (currency === 'btc') {
      wallet.balances.btc += amount;
    } else if (currency === 'usdt') {
      wallet.balances.usdt += amount;
    } else {
      wallet.balances.taproot[currency] = (wallet.balances.taproot[currency] || 0) + amount;
    }

    return transaction;
  }

  getTransactionHistory(walletId, limit = 50) {
    const wallet = this.wallets.get(walletId);
    if (!wallet) throw new Error('Wallet not found');
    return wallet.transactions.slice(-limit).reverse();
  }

  estimateFee(amount, currency) {
    // Mock fee estimation
    const feePercentage = 0.001; // 0.1%
    return amount * feePercentage;
  }
}

const walletService = new WalletService();

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'LiMeiHua Lightning Wallet Backend is running' });
});

// Create wallet
app.post('/api/wallets/create', (req, res) => {
  try {
    const { userId, walletName } = req.body;
    if (!userId || !walletName) {
      return res.status(400).json({ error: 'userId and walletName are required' });
    }
    const wallet = walletService.createWallet(userId, walletName);
    res.json({ success: true, wallet });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get wallet
app.get('/api/wallets/:walletId', (req, res) => {
  try {
    const wallet = walletService.getWallet(req.params.walletId);
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    res.json({ success: true, wallet });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List wallets
app.get('/api/wallets', (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const wallets = walletService.listWallets(userId);
    res.json({ success: true, wallets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send payment
app.post('/api/wallets/:walletId/send', (req, res) => {
  try {
    const { toAddress, amount, currency } = req.body;
    if (!toAddress || !amount || !currency) {
      return res.status(400).json({ error: 'toAddress, amount, and currency are required' });
    }
    const transaction = walletService.sendPayment(req.params.walletId, toAddress, amount, currency);
    res.json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Receive payment
app.post('/api/wallets/:walletId/receive', (req, res) => {
  try {
    const { fromAddress, amount, currency } = req.body;
    if (!fromAddress || !amount || !currency) {
      return res.status(400).json({ error: 'fromAddress, amount, and currency are required' });
    }
    const transaction = walletService.receivePayment(req.params.walletId, fromAddress, amount, currency);
    res.json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transaction history
app.get('/api/wallets/:walletId/transactions', (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const transactions = walletService.getTransactionHistory(req.params.walletId, parseInt(limit));
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estimate fee
app.post('/api/estimate-fee', (req, res) => {
  try {
    const { amount, currency } = req.body;
    if (!amount || !currency) {
      return res.status(400).json({ error: 'amount and currency are required' });
    }
    const fee = walletService.estimateFee(amount, currency);
    res.json({ success: true, fee, total: amount + fee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get exchange rates
app.get('/api/exchange-rates', (req, res) => {
  try {
    // Mock exchange rates
    const rates = {
      btc_usd: 45000,
      usdt_usd: 1,
      tap_usd: 0.5
    };
    res.json({ success: true, rates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LiMeiHua Lightning Wallet Backend running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}`);
});

module.exports = app;
