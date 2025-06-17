from flask import Flask, request, jsonify
from flask_cors import CORS
from chatbot import get_chat_response
from investment import StockAnalyzer, Config
import os

app = Flask(__name__)
analyzer = StockAnalyzer()

# Enhanced CORS configuration
CORS(app, resources={r"/api/*": {
    "origins": ["http://localhost:5173"],
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"],
    "supports_credentials": True
}})

@app.route('/api/tasks', methods=['GET', 'POST'])
def tasks():
    """Mock endpoint for tasks (to be replaced with real implementation)."""
    try:
        if request.method == 'GET':
            # Mock task data
            task_data = [
                {"id": 1, "title": "Sample Task 1"},
                {"id": 2, "title": "Sample Task 2"}
            ]
            print("Returning tasks:", task_data)
            return jsonify(task_data)
        elif request.method == 'POST':
            data = request.get_json()
            print(f"Received task: {data}")
            title = data.get('title', '').strip()
            if not title:
                return jsonify({'success': False, 'error': 'Title is required'}), 400
            # Mock task creation
            new_task = {"id": len(task_data) + 1, "title": title}
            print("Adding task:", new_task)
            return jsonify(new_task), 201
    except Exception as e:
        print(f"Error in tasks endpoint: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/finance/chat', methods=['POST'])
def chat():
    """Handle financial chatbot queries."""
    try:
        data = request.get_json()
        print(f"Received request: {data}")
        user_input = data.get('message', '').strip()
        if not user_input:
            print("Error: Empty message")
            return jsonify({'success': False, 'error': 'Empty message'}), 400
        response = get_chat_response(user_input)
        print(f"Sending response: {response}")
        return jsonify({'success': True, 'response': response})
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/finance/analyze', methods=['POST'])
def analyze():
    """Analyze stock based on ticker and budget."""
    try:
        data = request.get_json()
        print(f"Received analysis request: {data}")
        ticker = data.get('ticker', '').strip()
        budget = data.get('budget')
        if not ticker or not budget:
            print("Error: Missing ticker or budget")
            return jsonify({'success': False, 'error': 'Missing ticker or budget'}), 400
        if not isinstance(budget, (int, float)) or budget < Config.MIN_BUDGET or budget > Config.MAX_BUDGET:
            print("Error: Invalid budget")
            return jsonify({'success': False, 'error': f'Budget must be between {Config.MIN_BUDGET} and {Config.MAX_BUDGET}'}), 400
        result = analyzer.analyze_stock(ticker, budget)
        if isinstance(result, tuple):
            score, recommendation = result
            current_price = analyzer.data_collector.get_current_price(ticker)
            if current_price is None:
                return jsonify({'success': False, 'error': 'Could not fetch current price'}), 400
            result = {
                'success': True,
                'ticker': ticker,
                'current_price': float(current_price),
                'score': float(score),
                'recommendation': recommendation
            }
        print(f"Sending analysis response: {result}")
        return jsonify(result)
    except Exception as e:
        print(f"Error in analyze endpoint: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 400

if __name__ == '__main__':
    print("Starting Flask server on http://127.0.0.1:8888")
    app.run(debug=True, host='127.0.0.1', port=8888, threaded=True)