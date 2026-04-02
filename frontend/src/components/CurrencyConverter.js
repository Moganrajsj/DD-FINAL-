import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiDollarSign, FiRefreshCw } from 'react-icons/fi';

function CurrencyConverter({ amount, onCurrencyChange }) {
  const [currencies] = useState([
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
  ]);
  
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    return localStorage.getItem('preferred_currency') || 'INR';
  });
  const [convertedAmount, setConvertedAmount] = useState(amount);
  const [conversionRate, setConversionRate] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedCurrency === 'INR') {
      setConvertedAmount(amount);
      setConversionRate(1);
      if (onCurrencyChange) {
        onCurrencyChange({ currency: 'INR', amount, rate: 1 });
      }
    } else {
      convertCurrency(amount, selectedCurrency);
    }
    localStorage.setItem('preferred_currency', selectedCurrency);
  }, [amount, selectedCurrency]);

  const convertCurrency = async (amount, toCurrency) => {
    if (!amount || amount === 0) {
      setConvertedAmount(0);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get('/api/currency/convert', {
        params: {
          amount: amount,
          from: 'INR',
          to: toCurrency
        }
      });
      
      setConvertedAmount(response.data.converted_amount);
      setConversionRate(response.data.rate);
      
      if (onCurrencyChange) {
        onCurrencyChange({
          currency: toCurrency,
          amount: response.data.converted_amount,
          rate: response.data.rate
        });
      }
    } catch (error) {
      console.error('Error converting currency:', error);
      // Fallback to INR if conversion fails
      setConvertedAmount(amount);
      setConversionRate(1);
    } finally {
      setLoading(false);
    }
  };

  const selectedCurrencyData = currencies.find(c => c.code === selectedCurrency) || currencies[0];

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <select
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm text-dark-text focus:border-accent-purple focus:outline-none"
          disabled={loading}
        >
          {currencies.map(currency => (
            <option key={currency.code} value={currency.code}>
              {currency.code} - {currency.name}
            </option>
          ))}
        </select>
        {loading && (
          <FiRefreshCw className="animate-spin text-accent-purple" size={16} />
        )}
      </div>
      <div className="text-lg font-bold text-accent-purple">
        {selectedCurrencyData.symbol}{convertedAmount?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0.00'}
      </div>
      {selectedCurrency !== 'INR' && (
        <span className="text-xs text-dark-muted">
          (Rate: {conversionRate.toFixed(4)})
        </span>
      )}
    </div>
  );
}

export default CurrencyConverter;



