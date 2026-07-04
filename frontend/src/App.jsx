import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, TrendingUp, Calendar, Layers, Search, BarChart3, DollarSign, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import './index.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="value" style={{ color: entry.color }}>
            {entry.name}: Rp {Number(entry.value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const LossTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">Epoch: {label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="value" style={{ color: entry.color }}>
            {entry.name}: {Number(entry.value).toFixed(6)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const POPULAR_STOCKS = [
  { symbol: 'BBCA.JK', name: 'Bank Central Asia Tbk' },
  { symbol: 'BBRI.JK', name: 'Bank Rakyat Indonesia Tbk' },
  { symbol: 'BMRI.JK', name: 'Bank Mandiri Tbk' },
  { symbol: 'BBNI.JK', name: 'Bank Negara Indonesia Tbk' },
  { symbol: 'TLKM.JK', name: 'Telkom Indonesia Tbk' },
  { symbol: 'ASII.JK', name: 'Astra International Tbk' },
  { symbol: 'GOTO.JK', name: 'GoTo Gojek Tokopedia Tbk' },
  { symbol: 'ICBP.JK', name: 'Indofood CBP Sukses Makmur Tbk' },
  { symbol: 'INDF.JK', name: 'Indofood Sukses Makmur Tbk' },
  { symbol: 'UNTR.JK', name: 'United Tractors Tbk' },
  { symbol: 'AMMN.JK', name: 'Amman Mineral Internasional Tbk' },
  { symbol: 'BREN.JK', name: 'Barito Renewables Energy Tbk' },
  { symbol: 'BRPT.JK', name: 'Barito Pacific Tbk' },
  { symbol: 'ADRO.JK', name: 'Adaro Energy Indonesia Tbk' },
  { symbol: 'PGEO.JK', name: 'Pertamina Geothermal Energy Tbk' },
  { symbol: 'PTBA.JK', name: 'Bukit Asam Tbk' },
  { symbol: 'KLBF.JK', name: 'Kalbe Farma Tbk' },
  { symbol: 'ANTM.JK', name: 'Aneka Tambang Tbk' },
  { symbol: 'AAPL', name: 'Apple Inc. (US)' },
  { symbol: 'MSFT', name: 'Microsoft Corp. (US)' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. (US)' },
  { symbol: 'NVDA', name: 'NVIDIA Corp. (US)' },
  { symbol: 'TSLA', name: 'Tesla Inc. (US)' }
];

function App() {
  const [ticker, setTicker] = useState('BSSR.JK');
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  // Training Progress State
  const [epoch, setEpoch] = useState(0);
  const [loss, setLoss] = useState(null);
  const [valLoss, setValLoss] = useState(null);
  const [lossHistory, setLossHistory] = useState([]);
  const [totalEpochs, setTotalEpochs] = useState(15);
  
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const dropdownRef = useRef(null);

  const ws = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredStocks = POPULAR_STOCKS.filter(stock => 
    stock.symbol.toLowerCase().includes(ticker.toLowerCase()) || 
    stock.name.toLowerCase().includes(ticker.toLowerCase())
  );

  const handlePredict = (e) => {
    e.preventDefault();
    if (!ticker) return;

    setLoading(true);
    setError(null);
    setData(null);
    setEpoch(0);
    setLoss(null);
    setValLoss(null);
    setLossHistory([]);

    if (ws.current) {
      ws.current.close();
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/predict-stream';
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      let finalTicker = ticker.toUpperCase().trim();
      // Auto append .JK for Indonesian stocks if no extension is provided
      if (!finalTicker.includes('.')) {
        finalTicker += '.JK';
      }

      ws.current.send(JSON.stringify({
        ticker: finalTicker,
        days: parseInt(days),
        epochs: parseInt(totalEpochs)
      }));
    };

    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'progress') {
        setEpoch(msg.epoch);
        setLoss(msg.loss);
        setValLoss(msg.val_loss);
        
        setLossHistory(prev => [...prev, {
          epoch: msg.epoch,
          Loss: msg.loss,
          ValLoss: msg.val_loss
        }]);
        
      } else if (msg.type === 'success') {
        const result = msg.data;
        const chartData = [];
        
        result.historical.dates.forEach((date, i) => {
          chartData.push({
            date: date,
            Aktual: result.historical.prices[i],
            Prediksi: null
          });
        });
        
        const lastHistPoint = chartData[chartData.length - 1];
        
        result.forecast.dates.forEach((date, i) => {
          if (i === 0) {
            chartData.push({
              date: lastHistPoint.date,
              Aktual: null, 
              Prediksi: lastHistPoint.Aktual 
            });
          }
          chartData.push({
            date: date,
            Aktual: null,
            Prediksi: result.forecast.prices[i]
          });
        });

        const lastPrice = lastHistPoint.Aktual;
        const finalPredictedPrice = result.forecast.prices[result.forecast.prices.length - 1];
        const expectedReturn = ((finalPredictedPrice - lastPrice) / lastPrice) * 100;

        setData({
          ticker: result.ticker,
          chartData: chartData,
          splitDate: lastHistPoint.date,
          metrics: {
            lastPrice: lastPrice,
            predictedPrice: finalPredictedPrice,
            expectedReturn: expectedReturn
          }
        });
        setLoading(false);
        ws.current.close();
      } else if (msg.type === 'error') {
        setError(msg.message);
        setLoading(false);
        ws.current.close();
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setError("Gagal terhubung ke server secara real-time.");
      setLoading(false);
    };
  };

  useEffect(() => {
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    }
  }, []);

  const progressPercent = Math.min((epoch / totalEpochs) * 100, 100);

  return (
    <>
      <div className="bg-glow"></div>
      <div className="container">
        
        <header className="hero">
          <h1>Prediksi <span className="text-gradient">Saham AI</span></h1>
          <p>Ditenagai oleh Deep Learning (CNN & LSTM). Masukkan ticker saham dan lihat proyeksi harganya di masa depan.</p>
        </header>

        <form className="control-panel" onSubmit={handlePredict}>
          <div className="form-group">
            <label htmlFor="ticker">
              <Search size={18} /> Simbol Ticker (Yahoo Finance)
            </label>
            <div className="input-wrapper" ref={dropdownRef}>
              <TrendingUp size={18} className="input-icon" />
              <input 
                type="text" 
                id="ticker" 
                className="input-field"
                placeholder="Cari saham... (Cth: BBCA.JK atau Apple)"
                value={ticker}
                onChange={(e) => {
                  setTicker(e.target.value);
                  setShowAutocomplete(true);
                }}
                onFocus={() => setShowAutocomplete(true)}
                required
                disabled={loading}
                autoComplete="off"
              />
              {showAutocomplete && ticker && filteredStocks.length > 0 && (
                <div className="autocomplete-dropdown">
                  {filteredStocks.slice(0, 6).map((stock, idx) => (
                    <div 
                      key={idx} 
                      className="autocomplete-item"
                      onClick={() => {
                        setTicker(stock.symbol);
                        setShowAutocomplete(false);
                      }}
                    >
                      <span className="stock-symbol">{stock.symbol}</span>
                      <span className="stock-name">{stock.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <div className="slider-header" style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="days" style={{ margin: 0 }}>
                <Calendar size={18} /> Durasi Proyeksi
              </label>
              <span className="slider-value">{days} Hari</span>
            </div>
            <div className="slider-container">
              <input 
                type="range" 
                id="days" 
                min="1" 
                max="30" 
                value={days}
                onChange={(e) => setDays(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="slider-header" style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="epochs-slider" style={{ margin: 0 }}>
                <Layers size={18} /> Jumlah Epoch (Training)
              </label>
              <span className="slider-value">{totalEpochs} Iterasi</span>
            </div>
            <div className="slider-container">
              <input 
                type="range" 
                id="epochs-slider" 
                min="5" 
                max="200" 
                value={totalEpochs}
                onChange={(e) => setTotalEpochs(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <><Activity size={20} className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', borderTopColor: '#fff' }} /> Menganalisis & Melatih Model...</>
            ) : (
              <><BarChart3 size={20} /> Jalankan Prediksi AI</>
            )}
          </button>

          {error && (
            <div style={{ marginTop: '1.5rem', color: '#ff7b72', padding: '1rem', backgroundColor: 'rgba(255,123,114,0.1)', borderRadius: '12px', border: '1px solid rgba(255,123,114,0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <strong>Error:</strong> {error}
            </div>
          )}
        </form>

        {(loading || lossHistory.length > 0) && (
          <div className="training-panel">
            <h3 className="training-title">
              {loading && <div className="spinner"></div>} 
              {loading ? "Melatih Deep Learning Model" : "Hasil Training Model"}
            </h3>
            
            <div className="progress-container">
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
                <div className="progress-glow" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <div className="progress-stats">
                <span>Iterasi (Epoch): {epoch} / {totalEpochs}</span>
                <span>Loss: {loss ? loss.toFixed(6) : 'Menghitung...'}</span>
              </div>
            </div>
            
            {lossHistory.length > 0 && (
              <div style={{ width: '100%', height: '200px', marginTop: '2rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={lossHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorValLoss" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="epoch" 
                      stroke="#a1a1aa" 
                      tick={{ fill: '#a1a1aa', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#a1a1aa" 
                      tick={{ fill: '#a1a1aa', fontSize: 10 }}
                      domain={['auto', 'auto']}
                      width={60}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<LossTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                    <Area 
                      type="monotone" 
                      dataKey="Loss" 
                      stroke="#3b82f6" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorLoss)" 
                      isAnimationActive={false} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="ValLoss" 
                      stroke="#8b5cf6" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorValLoss)" 
                      isAnimationActive={false} 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', backgroundColor: '#3b82f6', borderRadius: '50%', boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)' }}></div>
                    <span style={{ color: '#a1a1aa', fontWeight: 500 }}>Training Loss</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', backgroundColor: '#8b5cf6', borderRadius: '50%', boxShadow: '0 0 8px rgba(139, 92, 246, 0.6)' }}></div>
                    <span style={{ color: '#a1a1aa', fontWeight: 500 }}>Validation Loss</span>
                  </div>
                </div>
              </div>
            )}
            
            <p className="training-desc" style={{ marginTop: '1.5rem' }}>
              {loading ? `Model sedang dioptimalkan secara real-time pada data historis ${ticker.toUpperCase()}.` : `Selesai melatih model untuk ${ticker.toUpperCase()}.`}
            </p>
          </div>
        )}

        {data && !loading && (
          <div className="chart-container">
            <div className="chart-header" style={{ marginBottom: '1.5rem' }}>
              <h2 className="chart-title">Proyeksi AI: {data.ticker}</h2>
              <p className="chart-subtitle">Harga Aktual vs Proyeksi Deep Learning</p>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  <DollarSign size={22} />
                </div>
                <div className="metric-content">
                  <span className="metric-label">Harga Terakhir</span>
                  <span className="metric-value">Rp {data.metrics.lastPrice.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                  <Target size={22} />
                </div>
                <div className="metric-content">
                  <span className="metric-label">Target Proyeksi ({days} Hari)</span>
                  <span className="metric-value">Rp {data.metrics.predictedPrice.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrap" style={{ 
                  background: data.metrics.expectedReturn >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                  color: data.metrics.expectedReturn >= 0 ? '#10b981' : '#ef4444' 
                }}>
                  {data.metrics.expectedReturn >= 0 ? <ArrowUpRight size={22} /> : <ArrowDownRight size={22} />}
                </div>
                <div className="metric-content">
                  <span className="metric-label">Potensi Return</span>
                  <span className="metric-value" style={{ color: data.metrics.expectedReturn >= 0 ? '#10b981' : '#ef4444' }}>
                    {data.metrics.expectedReturn >= 0 ? '+' : ''}{data.metrics.expectedReturn.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <div style={{ width: '100%', height: '400px', marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorAktual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPrediksi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#a1a1aa" 
                    tick={{ fill: '#a1a1aa', fontSize: 12 }}
                    tickMargin={12}
                    minTickGap={30}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#a1a1aa" 
                    tick={{ fill: '#a1a1aa', fontSize: 12 }}
                    domain={['auto', 'auto']}
                    tickFormatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
                    width={90}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <ReferenceLine x={data.splitDate} stroke="rgba(255,255,255,0.2)" strokeDasharray="5 5" label={{ position: 'top', value: 'Mulai Prediksi', fill: '#a1a1aa', fontSize: 12 }} />
                  
                  <Area 
                    type="monotone" 
                    dataKey="Aktual" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    fillOpacity={1}
                    fill="url(#colorAktual)"
                    dot={false}
                    activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} 
                    animationDuration={1500}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Prediksi" 
                    stroke="#8b5cf6" 
                    strokeWidth={3} 
                    strokeDasharray="5 5" 
                    fillOpacity={1}
                    fill="url(#colorPrediksi)"
                    dot={{ r: 3, fill: '#8b5cf6', stroke: 'none' }} 
                    activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                    animationDuration={2000}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
