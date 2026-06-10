from flask import Flask, render_template, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

import json
import os

# Lecture directe des résultats générés par le modèle IA à partir du fichier JSON
DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'predictions.json')

def get_results_data():
    if os.path.exists(DATA_PATH):
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"error": "Les données de prédiction n'ont pas été trouvées."}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/results')
def api_results():
    return jsonify(get_results_data())

if __name__ == '__main__':
    app.run(debug=True, port=5000)