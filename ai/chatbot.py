import pandas as pd
from groq import Groq
import requests
from io import StringIO

# Initialize Groq client with API key
client = Groq(api_key="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")

# System prompt for financial advisor role
SYSTEM_PROMPT = """
You are Fintrix, a certified financial advisor with access to live NSE stock data. Your capabilities include:
1. Fetching and analyzing the latest NSE listed stocks
2. Providing data-backed investment insights
3. Conservative recommendations with risk analysis

When discussing stocks, always:
- Verify data from the NSE source
- Disclose data freshness (last fetched time)
- Highlight key metrics (ISIN, face value, listing date)
"""

# Initialize conversation history
conversation_history = [
    {"role": "system", "content": SYSTEM_PROMPT}
]

# Cache for NSE data with timestamp
nse_data_cache = {
    'data': None,
    'timestamp': None
}

def fetch_nse_data():
    """Fetch and cache NSE equity data with timestamp"""
    try:
        url = "https://archives.nseindia.com/content/equities/EQUITY_L.csv"
        response = requests.get(url)
        response.raise_for_status()
        
        df = pd.read_csv(StringIO(response.text))
        nse_data_cache['data'] = df
        nse_data_cache['timestamp'] = pd.Timestamp.now()
        return df
    except Exception as e:
        print(f"Error fetching NSE data: {e}")
        return None

def get_stock_info(symbol):
    """Get details for a specific stock symbol"""
    if nse_data_cache['data'] is None:
        fetch_nse_data()
    
    df = nse_data_cache['data']
    if df is not None:
        stock = df[df['SYMBOL'].str.upper() == symbol.upper()]
        if not stock.empty:
            return stock.iloc[0].to_dict()
    return None

def get_chat_response(user_input):
    """Process user input and return a chatbot response"""
    global conversation_history
    
    # Check for stock-related queries
    stock_symbols = []
    if "stock" in user_input.lower() or any(word in user_input.upper() for word in ['NSE', 'RELIANCE', 'TCS', 'INFY']):
        # Refresh data if older than 1 hour
        if (nse_data_cache['timestamp'] is None or 
            (pd.Timestamp.now() - nse_data_cache['timestamp']).seconds > 3600):
            fetch_nse_data()
        
        # Add data freshness note to user input
        if nse_data_cache['timestamp']:
            user_input += f"\n[Data fetched: {nse_data_cache['timestamp'].strftime('%Y-%m-%d %H:%M')}]"
    
    # Add user message to history
    conversation_history.append({"role": "user", "content": user_input})
    
    # Trim history if too long
    if len(conversation_history) > 11:
        conversation_history = [conversation_history[0]] + conversation_history[-10:]
    
    # Call Groq API
    try:
        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=conversation_history,
            temperature=0.7,
            max_tokens=1024
        )
        
        # Process response
        ai_response = response.choices[0].message.content
        
        # Enhance with specific stock data if mentioned
        for symbol in ['RELIANCE', 'TCS', 'HDFC', 'INFY']:
            if symbol in ai_response:
                stock_data = get_stock_info(symbol)
                if stock_data:
                    ai_response += f"\n\n{symbol} Details:\n" + \
                                  f"- Company: {stock_data['NAME OF COMPANY']}\n" + \
                                  f"- ISIN: {stock_data['ISIN NUMBER']}\n" + \
                                  f"- Face Value: ₹{stock_data['FACE VALUE']}\n" + \
                                  f"- Listed Since: {stock_data['DATE OF LISTING']}"
        
        conversation_history.append({"role": "assistant", "content": ai_response})
        return ai_response
    except Exception as e:
        return f"Error in chatbot: {str(e)}"