import yfinance as yf
import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv1D, MaxPooling1D, LSTM, Dense, Dropout, BatchNormalization
from tensorflow.keras.optimizers import Adam
from tensorflow.keras import regularizers
from tensorflow.keras.callbacks import EarlyStopping

# Ensure reproducibility
np.random.seed(42)
tf.random.set_seed(42)

def predict_stock(ticker: str, days: int, epochs: int = 15, epoch_callback=None):
    # 1. Ambil Data
    df = yf.download(ticker, start="2020-01-01", progress=False)
    if df.empty or len(df) < 100:
        raise ValueError(f"Data tidak cukup atau ticker {ticker} tidak valid.")

    # 2. Preprocessing
    close_prices = df['Close'].values.reshape(-1, 1)
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(close_prices)

    lookback = 60
    X, y = [], []
    for i in range(lookback, len(scaled_data)):
        X.append(scaled_data[i-lookback:i, 0])
        y.append(scaled_data[i, 0])
    
    X, y = np.array(X), np.array(y)
    X = np.reshape(X, (X.shape[0], X.shape[1], 1))

    # 3. Model Architecture
    model = Sequential()
    
    # Conv1D
    model.add(Conv1D(
        filters=32,
        kernel_size=3,
        activation='relu',
        input_shape=(lookback, 1),
        kernel_regularizer=regularizers.l2(0.01)
    ))
    model.add(BatchNormalization())
    model.add(MaxPooling1D(pool_size=2))
    model.add(Dropout(0.2))

    # LSTM
    model.add(LSTM(
        units=32,
        return_sequences=False,
        kernel_regularizer=regularizers.l2(0.01)
    ))
    model.add(BatchNormalization())
    model.add(Dropout(0.2))

    # Output
    model.add(Dense(units=1))

    model.compile(optimizer=Adam(learning_rate=0.001), loss='mean_squared_error')

    early_stopping = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)

    # Custom Callback for WebSocket
    class EpochProgressCallback(tf.keras.callbacks.Callback):
        def on_epoch_end(self, epoch, logs=None):
            if epoch_callback:
                loss = logs.get('loss') if logs else 0
                val_loss = logs.get('val_loss') if logs else 0
                epoch_callback(epoch + 1, loss, val_loss)

    ws_callback = EpochProgressCallback()

    # 4. Train Model (optimized for speed)
    model.fit(
        X, y,
        epochs=epochs,
        batch_size=32,
        validation_split=0.2,
        callbacks=[early_stopping, ws_callback],
        verbose=0
    )

    # 5. Predict Future
    current_batch = scaled_data[-lookback:].reshape(1, lookback, 1)
    preds_scaled = []

    for _ in range(days):
        nxt = model.predict(current_batch, verbose=0)
        preds_scaled.append(nxt[0, 0])
        current_batch = np.append(current_batch[:, 1:, :], nxt.reshape(1, 1, 1), axis=1)

    preds_actual = scaler.inverse_transform(np.array(preds_scaled).reshape(-1, 1))

    # Prepare response data
    # Last 30 days of historical data for context
    hist_dates = [d.strftime('%Y-%m-%d') for d in df.index[-30:]]
    # Handle single element access correctly based on pandas version, using .item() if needed or just float()
    try:
        hist_prices = [float(p) for p in df['Close'].values[-30:]]
    except:
        hist_prices = [float(p.item()) for p in df['Close'].values[-30:]]

    f_dates = pd.bdate_range(start=df.index[-1] + pd.Timedelta(days=1), periods=days)
    future_dates_str = [d.strftime('%Y-%m-%d') for d in f_dates]
    future_prices = [float(p[0]) for p in preds_actual]

    return {
        "ticker": ticker,
        "historical": {
            "dates": hist_dates,
            "prices": hist_prices
        },
        "forecast": {
            "dates": future_dates_str,
            "prices": future_prices
        }
    }
