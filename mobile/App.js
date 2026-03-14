/**
 * LiMeiHua Lightning Wallet - Mobile Platform (React Native)
 * 
 * ชุดซอฟต์แวร์ชุดนี้ มีไว้เพื่อเป็นโครงสร้างพื้นฐานทางการเงินยุคใหม่
 * เพื่อรองรับการไหลของเงินจำนวนมหาศาลของท่านผู้เฒ่าหลี่เหมยฮัว หรือ LiMeiHua Grand Mother
 * และ source code นี้สร้างโดย Mr.Kanutsanan Pongpanna (นายคณัสนันท์ พงษ์พันนา)
 * URL: https://chatgpt.com/g/g-68d289535dec81919445deb9830f2d8e-kanutsanan-pongpanna
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
} from 'react-native';

const API_URL = 'http://localhost:3000';

export default function App() {
  const [userId] = useState('user_' + Math.random().toString(36).substr(2, 9));
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [walletName, setWalletName] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [currency, setCurrency] = useState('btc');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('wallets');

  useEffect(() => {
    fetchWallets();
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
      Alert.alert('Error', 'Failed to fetch wallets');
    }
  };

  const fetchTransactions = async () => {
    if (!selectedWallet) return;
    try {
      const response = await fetch(`${API_URL}/api/wallets/${selectedWallet.id}/transactions`);
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch transactions');
    }
  };

  const createWallet = async () => {
    if (!walletName.trim()) {
      Alert.alert('Error', 'Please enter wallet name');
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
        Alert.alert('Success', 'Wallet created successfully');
        setWalletName('');
        fetchWallets();
      } else {
        Alert.alert('Error', data.error || 'Failed to create wallet');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendPayment = async () => {
    if (!selectedWallet || !toAddress || !sendAmount) {
      Alert.alert('Error', 'Please fill all fields');
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
        Alert.alert('Success', `Payment sent! TX: ${data.transaction.hash.substr(0, 16)}...`);
        setToAddress('');
        setSendAmount('');
        fetchTransactions();
      } else {
        Alert.alert('Error', data.error || 'Failed to send payment');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    // In React Native, use Clipboard API
    Alert.alert('Info', 'Address copied to clipboard');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚡ LiMeiHua Wallet</Text>
        <Text style={styles.headerSubtitle}>Lightning Network</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'wallets' && styles.activeTab]}
          onPress={() => setActiveTab('wallets')}
        >
          <Text style={[styles.tabText, activeTab === 'wallets' && styles.activeTabText]}>
            💼 Wallets
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'send' && styles.activeTab]}
          onPress={() => setActiveTab('send')}
        >
          <Text style={[styles.tabText, activeTab === 'send' && styles.activeTabText]}>
            📤 Send
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            📋 History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Wallets Tab */}
        {activeTab === 'wallets' && (
          <View>
            <Text style={styles.sectionTitle}>Create New Wallet</Text>
            <TextInput
              style={styles.input}
              placeholder="Wallet name..."
              placeholderTextColor="#666"
              value={walletName}
              onChangeText={setWalletName}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={createWallet}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>Create Wallet</Text>
              )}
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>My Wallets</Text>
            {wallets.length > 0 ? (
              wallets.map((wallet) => (
                <TouchableOpacity
                  key={wallet.id}
                  style={[
                    styles.walletCard,
                    selectedWallet?.id === wallet.id && styles.walletCardActive
                  ]}
                  onPress={() => setSelectedWallet(wallet)}
                >
                  <Text style={styles.walletName}>{wallet.name}</Text>
                  <Text style={styles.walletAddress}>{wallet.address.substr(0, 20)}...</Text>
                  <View style={styles.balanceRow}>
                    <Text style={styles.balance}>₿ {wallet.balances.btc.toFixed(8)}</Text>
                    <Text style={styles.balance}>$ {wallet.balances.usdt.toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyState}>No wallets yet</Text>
            )}
          </View>
        )}

        {/* Send Tab */}
        {activeTab === 'send' && selectedWallet && (
          <View>
            <Text style={styles.sectionTitle}>Send Payment</Text>
            <Text style={styles.label}>From: {selectedWallet.name}</Text>
            <TextInput
              style={styles.input}
              placeholder="Recipient address..."
              placeholderTextColor="#666"
              value={toAddress}
              onChangeText={setToAddress}
            />
            <TextInput
              style={styles.input}
              placeholder="Amount"
              placeholderTextColor="#666"
              value={sendAmount}
              onChangeText={setSendAmount}
              keyboardType="decimal-pad"
            />
            <View style={styles.currencySelector}>
              {['btc', 'usdt', 'tap'].map((curr) => (
                <TouchableOpacity
                  key={curr}
                  style={[
                    styles.currencyButton,
                    currency === curr && styles.currencyButtonActive
                  ]}
                  onPress={() => setCurrency(curr)}
                >
                  <Text style={styles.currencyText}>{curr.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.button, styles.sendButton, loading && styles.buttonDisabled]}
              onPress={sendPayment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>📤 Send Payment</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* History Tab */}
        {activeTab === 'history' && selectedWallet && (
          <View>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <View key={tx.id} style={styles.transactionItem}>
                  <View style={styles.txInfo}>
                    <Text style={styles.txType}>
                      {tx.from === selectedWallet.address ? '📤' : '📥'}
                    </Text>
                    <View style={styles.txDetails}>
                      <Text style={styles.txAddress}>
                        {tx.from === selectedWallet.address ? 'To: ' : 'From: '}
                        {(tx.from === selectedWallet.address ? tx.to : tx.from).substr(0, 20)}...
                      </Text>
                      <Text style={styles.txDate}>
                        {new Date(tx.createdAt).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.txAmount}>
                    <Text style={[
                      styles.txAmountText,
                      tx.from === selectedWallet.address ? styles.negative : styles.positive
                    ]}>
                      {tx.from === selectedWallet.address ? '-' : '+'}{tx.amount} {tx.currency.toUpperCase()}
                    </Text>
                    <Text style={[styles.txStatus, styles[`status_${tx.status}`]]}>
                      {tx.status}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyState}>No transactions yet</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          LiMeiHua Lightning Wallet | Dedicated to LiMeiHua Grand Mother
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050812',
  },
  header: {
    backgroundColor: '#0a0e27',
    borderBottomWidth: 2,
    borderBottomColor: '#00ffff',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00ffff',
    textShadowColor: 'rgba(0, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#0f1535',
    borderBottomWidth: 2,
    borderBottomColor: '#1a1f3a',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#00ffff',
  },
  tabText: {
    color: '#a0a0a0',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#00ffff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ffff',
    marginBottom: 12,
    marginTop: 16,
  },
  label: {
    color: '#a0a0a0',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(10, 14, 39, 0.8)',
    borderWidth: 2,
    borderColor: '#1a1f3a',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    marginBottom: 12,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#00ffff',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#050812',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#00ffff',
    marginTop: 12,
  },
  walletCard: {
    backgroundColor: 'rgba(15, 21, 53, 0.6)',
    borderWidth: 2,
    borderColor: '#1a1f3a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  walletCardActive: {
    borderColor: '#00ffff',
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
  },
  walletName: {
    color: '#00ffff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  walletAddress: {
    color: '#a0a0a0',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balance: {
    color: '#a0a0a0',
    fontSize: 12,
  },
  emptyState: {
    color: '#a0a0a0',
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
    marginVertical: 20,
  },
  currencySelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  currencyButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: 'rgba(10, 14, 39, 0.8)',
    borderWidth: 2,
    borderColor: '#1a1f3a',
    borderRadius: 6,
    alignItems: 'center',
  },
  currencyButtonActive: {
    borderColor: '#00ffff',
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
  },
  currencyText: {
    color: '#00ffff',
    fontWeight: 'bold',
  },
  transactionItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: '#1a1f3a',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  txInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  txType: {
    fontSize: 20,
    marginRight: 12,
  },
  txDetails: {
    flex: 1,
  },
  txAddress: {
    color: '#ffffff',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 4,
  },
  txDate: {
    color: '#a0a0a0',
    fontSize: 11,
  },
  txAmount: {
    alignItems: 'flex-end',
  },
  txAmountText: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  positive: {
    color: '#00ff00',
  },
  negative: {
    color: '#ff0055',
  },
  txStatus: {
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  status_confirmed: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    color: '#00ff00',
  },
  status_pending: {
    backgroundColor: 'rgba(255, 170, 0, 0.1)',
    color: '#ffaa00',
  },
  footer: {
    backgroundColor: '#0a0e27',
    borderTopWidth: 2,
    borderTopColor: '#00ffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  footerText: {
    color: '#a0a0a0',
    fontSize: 12,
    textAlign: 'center',
  },
});
