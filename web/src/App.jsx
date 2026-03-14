/**
 * LiMeiHua Lightning Wallet - Web Platform (React)
 * 
 * ชุดซอฟต์แวร์ชุดนี้ มีไว้เพื่อเป็นโครงสร้างพื้นฐานทางการเงินยุคใหม่
 * เพื่อรองรับการไหลของเงินจำนวนมหาศาลของท่านผู้เฒ่าหลี่เหมยฮัว หรือ LiMeiHua Grand Mother
 * และ source code นี้สร้างโดย Mr.Kanutsanan Pongpanna (นายคณัสนันท์ พงษ์พันนา)
 * URL: https://chatgpt.com/g/g-68d289535dec81919445deb9830f2d8e-kanutsanan-pongpanna
 */

import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [userId, setUserId] = useState('user_' + Math.random().toString(36).substr(2, 9));
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [walletName, setWalletName] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [currency, setCurrency] = useState('btc');
  const [transactions, setTransactions] = useState([]);
  const [exchangeRates, setExchangeRates] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showQR, setShowQR] = useState(false);

  const API_URL = 'http://localhost:3000';

  useEffect(() => {
    fetchWallets();
    fetchExchangeRates();
  }, []);

  useEffect(() => {
    if (selectedWallet) {
      fetchTransactions();
    }
  }, [selectedWallet]);

  const fetchWallets = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wallets?userId=${userId}`);
      const data = await response.json();
      setWallets(data.wallets || []);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    }
  };

  const fetchTransactions = async () => {
    if (!selectedWallet) return;
    try {
      const response = await fetch(`${API_URL}/api/wallets/${selectedWallet.id}/transactions`);
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch(`${API_URL}/api/exchange-rates`);
      const data = await response.json();
      setExchangeRates(data.rates || {});
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    }
  };

  const createWallet = async (e) => {
    e.preventDefault();
    if (!walletName.trim()) {
      setMessage('❌ Please enter wallet name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/wallets/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, walletName })
      });
      const data = await response.json();

      if (data.success) {
        setMessage('✅ Wallet created successfully');
        setWalletName('');
        fetchWallets();
      } else {
        setMessage('❌ ' + (data.error || 'Failed to create wallet'));
      }
    } catch (error) {
      setMessage('❌ ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendPayment = async (e) => {
    e.preventDefault();
    if (!selectedWallet || !toAddress || !sendAmount) {
      setMessage('❌ Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/wallets/${selectedWallet.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toAddress,
          amount: parseFloat(sendAmount),
          currency
        })
      });
      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Payment sent! TX: ${data.transaction.hash.substr(0, 16)}...`);
        setToAddress('');
        setSendAmount('');
        fetchTransactions();
      } else {
        setMessage('❌ ' + (data.error || 'Failed to send payment'));
      }
    } catch (error) {
      setMessage('❌ ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage('✅ Copied to clipboard');
  };

  return (
    <div className="app">
      <header className="header">
        <h1>⚡ LiMeiHua Lightning Wallet</h1>
        <p>Multi-platform Wallet for Lightning Network</p>
      </header>

      <div className="container">
        {message && <div className="message-box">{message}</div>}

        <div className="main-grid">
          {/* Left Panel - Wallets */}
          <div className="left-panel">
            <h2>My Wallets</h2>

            <form onSubmit={createWallet} className="create-wallet-form">
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="Wallet name..."
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Wallet'}
              </button>
            </form>

            <div className="wallets-list">
              {wallets.length > 0 ? (
                wallets.map((wallet) => (
                  <div
                    key={wallet.id}
                    className={`wallet-card ${selectedWallet?.id === wallet.id ? 'active' : ''}`}
                    onClick={() => setSelectedWallet(wallet)}
                  >
                    <h3>{wallet.name}</h3>
                    <p className="address">{wallet.address.substr(0, 16)}...</p>
                    <div className="balances">
                      <div>₿ {wallet.balances.btc.toFixed(8)}</div>
                      <div>$ {wallet.balances.usdt.toFixed(2)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">No wallets yet. Create one!</p>
              )}
            </div>
          </div>

          {/* Right Panel - Wallet Details */}
          {selectedWallet && (
            <div className="right-panel">
              <h2>{selectedWallet.name}</h2>

              {/* Wallet Info */}
              <div className="wallet-info">
                <div className="info-card">
                  <label>Address</label>
                  <div className="address-display">
                    <code>{selectedWallet.address}</code>
                    <button
                      className="copy-btn"
                      onClick={() => copyToClipboard(selectedWallet.address)}
                    >
                      📋
                    </button>
                  </div>
                </div>

                {/* QR Code Button */}
                <button
                  className="qr-btn"
                  onClick={() => setShowQR(!showQR)}
                >
                  {showQR ? '🔒 Hide QR' : '📱 Show QR'}
                </button>

                {showQR && (
                  <div className="qr-display">
                    <p>Scan to receive payment</p>
                    <div className="qr-placeholder">QR Code: {selectedWallet.address}</div>
                  </div>
                )}
              </div>

              {/* Balances */}
              <div className="balances-section">
                <h3>Balances</h3>
                <div className="balance-cards">
                  <div className="balance-card">
                    <span className="currency">₿ BTC</span>
                    <span className="amount">{selectedWallet.balances.btc.toFixed(8)}</span>
                    <span className="usd">${(selectedWallet.balances.btc * (exchangeRates.btc_usd || 45000)).toFixed(2)}</span>
                  </div>
                  <div className="balance-card">
                    <span className="currency">$ USDT</span>
                    <span className="amount">{selectedWallet.balances.usdt.toFixed(2)}</span>
                    <span className="usd">${selectedWallet.balances.usdt.toFixed(2)}</span>
                  </div>
                  {Object.entries(selectedWallet.balances.taproot).map(([token, amount]) => (
                    <div key={token} className="balance-card">
                      <span className="currency">🎁 {token.toUpperCase()}</span>
                      <span className="amount">{amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Send Payment */}
              <div className="send-section">
                <h3>Send Payment</h3>
                <form onSubmit={sendPayment}>
                  <div className="form-group">
                    <label>To Address:</label>
                    <input
                      type="text"
                      value={toAddress}
                      onChange={(e) => setToAddress(e.target.value)}
                      placeholder="Recipient address..."
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Amount:</label>
                      <input
                        type="number"
                        value={sendAmount}
                        onChange={(e) => setSendAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.00000001"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Currency:</label>
                      <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                        <option value="btc">BTC</option>
                        <option value="usdt">USDT</option>
                        <option value="tap">TAP</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="send-btn" disabled={loading}>
                    {loading ? 'Sending...' : '📤 Send'}
                  </button>
                </form>
              </div>

              {/* Transaction History */}
              <div className="transactions-section">
                <h3>Recent Transactions</h3>
                <div className="transactions-list">
                  {transactions.length > 0 ? (
                    transactions.map((tx) => (
                      <div key={tx.id} className="transaction-item">
                        <div className="tx-info">
                          <span className={`tx-type ${tx.status}`}>
                            {tx.from === selectedWallet.address ? '📤' : '📥'}
                          </span>
                          <div className="tx-details">
                            <p className="tx-address">
                              {tx.from === selectedWallet.address ? 'To: ' : 'From: '}
                              {(tx.from === selectedWallet.address ? tx.to : tx.from).substr(0, 16)}...
                            </p>
                            <p className="tx-date">{new Date(tx.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="tx-amount">
                          <span className={tx.from === selectedWallet.address ? 'negative' : 'positive'}>
                            {tx.from === selectedWallet.address ? '-' : '+'}{tx.amount} {tx.currency.toUpperCase()}
                          </span>
                          <span className={`tx-status ${tx.status}`}>{tx.status}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="empty-state">No transactions yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="footer">
        <p>LiMeiHua Lightning Wallet | Dedicated to LiMeiHua Grand Mother | Created by Mr. Kanutsanan Pongpanna</p>
      </footer>
    </div>
  );
}
