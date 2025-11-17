import React, { useState, useEffect } from 'react';

const API_KEY = 'd4dh9v9r01qovljpqcpgd4dh9v9r01qovljpqcq0';
const BASE_URL = 'https://finnhub.io/api/v1';

const markets = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corp.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla, Inc.' },
];

export default function StockMarket({ onDataFetched }) {
  const [selectedMarket, setSelectedMarket] = useState(markets[0].symbol);
  const [stockData, setStockData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/quote?symbol=${selectedMarket}&token=${API_KEY}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch stock data');
        }
        const data = await response.json();
        setStockData(data);
        onDataFetched([data.c]);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchStockData();
    const interval = setInterval(fetchStockData, 60000); // Fetch every minute

    return () => clearInterval(interval);
  }, [selectedMarket, onDataFetched]);

  const handleMarketChange = (event) => {
    setSelectedMarket(event.target.value);
  };

  return (
    <div>
      <h3>Live Stock Market</h3>
      <select onChange={handleMarketChange} value={selectedMarket}>
        {markets.map((market) => (
          <option key={market.symbol} value={market.symbol}>
            {market.name}
          </option>
        ))}
      </select>
      {error && <p>Error: {error}</p>}
      {stockData && (
        <div>
          <p>Current Price: {stockData.c}</p>
          <p>High Price of the day: {stockData.h}</p>
          <p>Low Price of the day: {stockData.l}</p>
          <p>Open Price of the day: {stockData.o}</p>
          <p>Previous Close Price: {stockData.pc}</p>
        </div>
      )}
    </div>
  );
}
