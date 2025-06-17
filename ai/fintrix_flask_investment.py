from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from fintrix_investment import StockAnalyzer
from fintrix_chat_bot import get_chat_response
import threading
import os

app = Flask(__name__)

# Configure SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tasks.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# CORS configuration with dynamic origins
CORS(app, resources={r"/api/*": {
    "origins": os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(","),
    "methods": ["GET", "POST", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type"],
    "supports_credentials": True
}})

# Task model for database
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)

# Thread-safe StockAnalyzer initialization
analyzer_lock = threading.Lock()
analyzer = None

def get_analyzer():
    global analyzer
    with analyzer_lock:
        if analyzer is None:
            analyzer = StockAnalyzer()
    return analyzer

# Create database tables
with app.app_context():
    db.create_all()

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Retrieve all tasks from the database."""
    try:
        tasks = Task.query.all()
        return jsonify([{"id": task.id, "title": task.title} for task in tasks])
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks', methods=['POST'])
def add_task():
    """Add a new task to the database."""
    try:
        data = request.get_json()
        title = data.get('title', '').strip()
        if not title:
            return jsonify({'success': False, 'error': 'Title is required'}), 400
        task = Task(title=title)
        db.session.add(task)
        db.session.commit()
        return jsonify({"id": task.id, "title": task.title})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task by ID."""
    try:
        task = Task.query.get_or_404(task_id)
        db.session.delete(task)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Task deleted'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/finance/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_input = data.get('message', '').strip()
        if not user_input:
            return jsonify({'success': False, 'error': 'Empty message'}), 400
        response = get_chat_response(user_input)
        return jsonify({'success': True, 'response': response})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/finance/analyze', methods=['POST'])
def analyze_stock():
    """Analyze a stock based on ticker and budget."""
    try:
        data = request.get_json()
        ticker = data.get('ticker', 'RELIANCE.NS').upper().strip()
        budget = float(data.get('budget', 5000))
        if not ticker or budget <= 0:
            return jsonify({'success': False, 'error': 'Invalid ticker or budget'}), 400
        analyzer = get_analyzer()
        score, recommendation = analyzer.analyze_stock(ticker, budget, 'short')
        return jsonify({
            'success': True,
            'ticker': ticker,
            'score': score,
            'recommendation': recommendation,
            'current_price': analyzer.data_collector.get_current_price(ticker)
        })
    except ValueError:
        return jsonify({'success': False, 'error': 'Invalid budget format'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': f'Analysis failed: {str(e)}'}), 500

if __name__ == '__main__':
    print("Starting Flask server on http://127.0.0.1:8888")
    app.run(debug=True, host='127.0.0.1', port=8888, threaded=True)
