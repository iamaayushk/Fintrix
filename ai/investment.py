import os
import warnings
import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error
import xgboost as xgb
from prophet import Prophet
from arch import arch_model
import torch
import torch.nn as nn

warnings.filterwarnings('ignore')

class Config:
    NSE_TICKERS_URL = "https://archives.nseindia.com/content/equities/EQUITY_L.csv"
    BSE_TICKERS_URL = "https://www.bseindia.com/corporates/List_Scrips.aspx"
    SHORT_TERM_DAYS = 30
    LONG_TERM_DAYS = 365 * 3
    LOOKBACK_WINDOW = 60
    TEST_SIZE = 0.2
    RANDOM_STATE = 42
    MIN_BUDGET = 1000
    MAX_BUDGET = 100000

config = Config()

class DataCollector:
    def __init__(self):
        self.nse_tickers = self._load_nse_tickers()
        self.bse_tickers = self._load_bse_tickers()
        
    def _load_nse_tickers(self):
        try:
            df = pd.read_csv(config.NSE_TICKERS_URL)
            return df['SYMBOL'].unique().tolist()
        except:
            return ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'HDFC.NS']
        
    def _load_bse_tickers(self):
        return ['RELIANCE.BO', 'TCS.BO', 'HDFCBANK.BO', 'INFY.BO']
    
    def get_stock_data(self, ticker, period='5y'):
        try:
            stock = yf.Ticker(ticker)
            df = stock.history(period=period)
            df = df[['Open', 'High', 'Low', 'Close', 'Volume']]
            df.columns = [col.lower() for col in df.columns]
            return df
        except Exception as e:
            print(f"Error fetching data for {ticker}: {e}")
            return None
    
    def get_current_price(self, ticker):
        try:
            stock = yf.Ticker(ticker)
            data = stock.history(period='1d')
            return data['Close'].iloc[-1]
        except:
            return None

class DataPreprocessor:
    def __init__(self):
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        
    def prepare_data(self, df, target_col='close', lookback=60):
        if df is None or len(df) < lookback * 2:
            return None, None, None, None
        data = df[[target_col]].values
        data_scaled = self.scaler.fit_transform(data)
        X, y = [], []
        for i in range(lookback, len(data_scaled)):
            X.append(data_scaled[i-lookback:i, 0])
            y.append(data_scaled[i, 0])
        X, y = np.array(X), np.array(y)
        split = int(len(X) * (1 - config.TEST_SIZE))
        X_train, X_test = X[:split], X[split:]
        y_train, y_test = y[:split], y[split:]
        X_train = X_train.reshape(X_train.shape[0], X_train.shape[1], 1)
        X_test = X_test.reshape(X_test.shape[0], X_test.shape[1], 1)
        return X_train, X_test, y_train, y_test
    
    def prepare_tabular_data(self, df, target_col='close', lookback=60):
        if df is None or len(df) < lookback * 2:
            return None, None, None, None
        df = df.copy()
        df['returns'] = df[target_col].pct_change()
        df['volatility'] = df['returns'].rolling(5).std()
        df['ma_10'] = df[target_col].rolling(10).mean()
        df['ma_50'] = df[target_col].rolling(50).mean()
        df['momentum'] = df[target_col] / df[target_col].shift(lookback) - 1
        df.dropna(inplace=True)
        df['target'] = (df[target_col].shift(-1) > df[target_col]).astype(int)
        features = ['returns', 'volatility', 'ma_10', 'ma_50', 'momentum', 'volume']
        X = df[features]
        y = df['target']
        split = int(len(X) * (1 - config.TEST_SIZE))
        X_train, X_test = X[:split], X[split:]
        y_train, y_test = y[:split], y[split:]
        return X_train, X_test, y_train, y_test

class LSTMModel(nn.Module):
    def __init__(self, input_size=1, hidden_size=50, num_layers=2, output_size=1):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, output_size)
        
    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).requires_grad_()
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).requires_grad_()
        out, (hn, cn) = self.lstm(x, (h0.detach(), c0.detach()))
        out = self.fc(out[:, -1, :])
        return out

class TransformerModel(nn.Module):
    def __init__(self, input_size=1, num_layers=2, nhead=1, dim_feedforward=64, output_size=1):
        super().__init__()
        self.encoder_layer = nn.TransformerEncoderLayer(
            d_model=input_size, nhead=nhead, dim_feedforward=dim_feedforward
        )
        self.transformer_encoder = nn.TransformerEncoder(self.encoder_layer, num_layers=num_layers)
        self.decoder = nn.Linear(input_size, output_size)
        
    def forward(self, x):
        x = x.permute(1, 0, 2)
        x = self.transformer_encoder(x)
        x = x[-1, :, :]
        x = self.decoder(x)
        return x

class StockAnalyzer:
    def __init__(self):
        self.data_collector = DataCollector()
        self.preprocessor = DataPreprocessor()
        self.models = {
            'LSTM': None,
            'Transformer': None,
            'XGBoost': None,
            'Prophet': None,
            'GARCH': None
        }
        
    def train_lstm(self, X_train, y_train, epochs=20):
        model = LSTMModel()
        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
        X_train = torch.FloatTensor(X_train)
        y_train = torch.FloatTensor(y_train).view(-1, 1)
        for epoch in range(epochs):
            optimizer.zero_grad()
            outputs = model(X_train)
            loss = criterion(outputs, y_train)
            loss.backward()
            optimizer.step()
        self.models['LSTM'] = model
        return model
    
    def train_transformer(self, X_train, y_train, epochs=20):
        model = TransformerModel()
        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
        X_train = torch.FloatTensor(X_train)
        y_train = torch.FloatTensor(y_train).view(-1, 1)
        for epoch in range(epochs):
            optimizer.zero_grad()
            outputs = model(X_train)
            loss = criterion(outputs, y_train)
            loss.backward()
            optimizer.step()
        self.models['Transformer'] = model
        return model
    
    def train_xgboost(self, X_train, y_train):
        model = xgb.XGBClassifier(
            objective='binary:logistic',
            n_estimators=100,
            max_depth=3,
            learning_rate=0.1,
            random_state=config.RANDOM_STATE
        )
        model.fit(X_train, y_train)
        self.models['XGBoost'] = model
        return model
    
    def train_prophet(self, df):
        if df is None or len(df) < 100:
            return None
        prophet_df = df.reset_index()[['Date', 'close']].rename(columns={'Date': 'ds', 'close': 'y'})
        # Ensure 'ds' is datetime
        prophet_df['ds'] = pd.to_datetime(prophet_df['ds'], errors='coerce')
        if prophet_df['ds'].isnull().any():
            print("Error: Invalid datetime values in stock data")
            return None
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            changepoint_prior_scale=0.05
        )
        model.fit(prophet_df)
        self.models['Prophet'] = model
        return model
    
    def train_garch(self, df, p=1, q=1):
        if df is None or len(df) < 100:
            return None
        returns = df['close'].pct_change().dropna() * 100
        model = arch_model(returns, vol='Garch', p=p, q=q)
        fitted_model = model.fit(disp='off')
        self.models['GARCH'] = fitted_model
        return fitted_model
    
    def predict_future(self, ticker, days=30):
        df = self.data_collector.get_stock_data(ticker)
        if df is None:
            return None
        results = {}
        X_train, X_test, y_train, y_test = self.preprocessor.prepare_data(df)
        if X_train is not None:
            if not self.models['LSTM']:
                self.train_lstm(X_train, y_train)
            lstm_model = self.models['LSTM']
            last_sequence = X_test[-1:]
            lstm_predictions = []
            for _ in range(days):
                next_pred = lstm_model(torch.FloatTensor(last_sequence))
                lstm_predictions.append(next_pred.item())
                last_sequence = np.append(last_sequence[:, 1:, :], next_pred.detach().numpy().reshape(1, 1, 1), axis=1)
            lstm_predictions = self.preprocessor.scaler.inverse_transform(
                np.array(lstm_predictions).reshape(-1, 1)
            ).flatten()
            results['LSTM'] = lstm_predictions
        if X_train is not None:
            if not self.models['Transformer']:
                self.train_transformer(X_train, y_train)
            transformer_model = self.models['Transformer']
            last_sequence = X_test[-1:]
            transformer_predictions = []
            for _ in range(days):
                next_pred = transformer_model(torch.FloatTensor(last_sequence))
                transformer_predictions.append(next_pred.item())
                last_sequence = np.append(last_sequence[:, 1:, :], next_pred.detach().numpy().reshape(1, 1, 1), axis=1)
            transformer_predictions = self.preprocessor.scaler.inverse_transform(
                np.array(transformer_predictions).reshape(-1, 1)
            ).flatten()
            results['Transformer'] = transformer_predictions
        X_train_tab, X_test_tab, y_train_tab, y_test_tab = self.preprocessor.prepare_tabular_data(df)
        if X_train_tab is not None:
            if not self.models['XGBoost']:
                self.train_xgboost(X_train_tab, y_train_tab)
            current_features = X_test_tab.iloc[-1:].values
            prob_increase = self.models['XGBoost'].predict_proba(current_features)[0][1]
            results['XGBoost'] = prob_increase
        prophet_model = self.train_prophet(df)
        if prophet_model:
            future = prophet_model.make_future_dataframe(periods=days)
            forecast = prophet_model.predict(future)
            prophet_predictions = forecast['yhat'].tail(days).values
            results['Prophet'] = prophet_predictions
        garch_model = self.train_garch(df)
        if garch_model:
            forecasts = garch_model.forecast(horizon=days)
            results['GARCH'] = np.sqrt(forecasts.variance.values[-1, :])
        return results
    
    def analyze_stock(self, ticker, budget, horizon='short'):
        if horizon == 'short':
            days = config.SHORT_TERM_DAYS
        else:
            days = config.LONG_TERM_DAYS
        predictions = self.predict_future(ticker, days)
        if not predictions:
            return {'success': False, 'error': 'Insufficient data'}
        current_price = self.data_collector.get_current_price(ticker)
        if current_price is None:
            return {'success': False, 'error': 'Could not fetch current price'}
        num_shares = int(budget / current_price)
        if num_shares == 0:
            return {'success': False, 'error': 'Budget too low for this stock'}
        score = 0
        if 'LSTM' in predictions and 'Transformer' in predictions and 'Prophet' in predictions:
            avg_price_pred = (
                predictions['LSTM'][-1] + 
                predictions['Transformer'][-1] + 
                predictions['Prophet'][-1]
            ) / 3
            price_return = (avg_price_pred - current_price) / current_price
            score += price_return * 100
        if 'XGBoost' in predictions:
            score += (predictions['XGBoost'] - 0.5) * 50
        if 'GARCH' in predictions:
            avg_volatility = np.mean(predictions['GARCH'])
            if horizon == 'short':
                score -= avg_volatility * 2
            else:
                score -= avg_volatility
        score = max(0, min(100, score + 50))
        if score >= 80:
            reco = "Strong Buy"
        elif score >= 60:
            reco = "Buy"
        elif score >= 40:
            reco = "Hold"
        elif score >= 20:
            reco = "Sell"
        else:
            reco = "Strong Sell"
        return {
            'success': True,
            'ticker': ticker,
            'current_price': float(current_price),
            'score': float(score),
            'recommendation': reco
        }