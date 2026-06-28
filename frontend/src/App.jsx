import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity } from 'lucide-react';
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

  const ws = useRef(null);

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

    ws.current = new WebSocket('ws://localhost:8000/api/predict-stream');

    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({
        ticker: ticker.toUpperCase(),
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

        setData({
          ticker: result.ticker,
          chartData: chartData,
          splitDate: lastHistPoint.date
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
            <label htmlFor="ticker">Simbol Ticker (Yahoo Finance)</label>
            <input 
              type="text" 
              id="ticker" 
              className="input-field"
              placeholder="Contoh: BBCA.JK"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="days" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Durasi Proyeksi</span>
              <span className="text-gradient" style={{ fontWeight: 'bold' }}>{days} Hari</span>
            </label>
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

          <div className="form-group">
            <label htmlFor="epochs" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Jumlah Epoch (Training)</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              <input 
                type="range" 
                id="epochs-slider" 
                min="5" 
                max="200" 
                value={totalEpochs}
                onChange={(e) => setTotalEpochs(e.target.value)}
                disabled={loading}
                style={{ flex: 1 }}
              />
              <input 
                type="number" 
                id="epochs"
                min="5" 
                max="200" 
                value={totalEpochs}
                onChange={(e) => setTotalEpochs(e.target.value)}
                disabled={loading}
                className="input-field"
                style={{ width: '80px', padding: '0.4rem', textAlign: 'center' }}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>Menganalisis & Melatih Model...</>
            ) : (
              <><Activity size={20} /> Jalankan Prediksi</>
            )}
          </button>

          {error && (
            <div style={{ marginTop: '1.5rem', color: '#ff7b72', padding: '1rem', backgroundColor: 'rgba(255,123,114,0.1)', borderRadius: '6px', border: '1px solid rgba(255,123,114,0.4)' }}>
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
                  <LineChart data={lossHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                    <XAxis 
                      dataKey="epoch" 
                      stroke="#848d97" 
                      tick={{ fill: '#848d97', fontSize: 10 }}
                    />
                    <YAxis 
                      stroke="#848d97" 
                      tick={{ fill: '#848d97', fontSize: 10 }}
                      domain={['auto', 'auto']}
                      width={60}
                    />
                    <Tooltip content={<LossTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="Loss" 
                      stroke="#2f81f7" 
                      strokeWidth={2} 
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ValLoss" 
                      stroke="#d2a8ff" 
                      strokeWidth={2} 
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#2f81f7', borderRadius: '50%' }}></div>
                    <span style={{ color: '#848d97' }}>Training Loss</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#d2a8ff', borderRadius: '50%' }}></div>
                    <span style={{ color: '#848d97' }}>Validation Loss</span>
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
            <div className="chart-header">
              <h2 className="chart-title">Proyeksi: {data.ticker}</h2>
              <p className="chart-subtitle">Harga Aktual vs Proyeksi Model AI</p>
            </div>
            <div style={{ width: '100%', height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#848d97" 
                    tick={{ fill: '#848d97', fontSize: 12 }}
                    tickMargin={10}
                    minTickGap={30}
                  />
                  <YAxis 
                    stroke="#848d97" 
                    tick={{ fill: '#848d97', fontSize: 12 }}
                    domain={['auto', 'auto']}
                    tickFormatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
                    width={90}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine x={data.splitDate} stroke="#848d97" strokeDasharray="3 3" />
                  
                  <Line 
                    type="monotone" 
                    dataKey="Aktual" 
                    stroke="#238636" 
                    strokeWidth={3} 
                    dot={false}
                    activeDot={{ r: 6 }} 
                    animationDuration={1500}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Prediksi" 
                    stroke="#d2a8ff" 
                    strokeWidth={3} 
                    strokeDasharray="5 5" 
                    dot={{ r: 3, fill: '#d2a8ff', stroke: 'none' }} 
                    activeDot={{ r: 6, fill: '#d2a8ff' }}
                    animationDuration={2000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
