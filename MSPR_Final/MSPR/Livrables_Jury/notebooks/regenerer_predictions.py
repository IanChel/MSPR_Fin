"""
Régénère les fichiers de prédictions (predictions_*.json) avec le modèle
qui intègre la DÉLINQUANCE — bruit 0.15 (~77%).
Sortie -> Livrables_Jury/predictions_v2/  (ne touche PAS public/data/ tant que non validé).
"""
import os, json, unicodedata
import numpy as np, pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression, SGDClassifier
import xgboost as xgb

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
DATA = os.path.join(ROOT, "MSPR_Final", "MSPR", "Livrables_Jury", "data", "data_enrichi_delinquance.parquet")
OUTDIR = os.path.join(ROOT, "MSPR_Final", "MSPR", "Livrables_Jury", "predictions_v2")
os.makedirs(OUTDIR, exist_ok=True)

eco_map = {'Boom': 'boom', 'Croissance': 'growth', 'Stable': 'stable', 'Déclin': 'decline', 'Crise': 'crisis'}
df = pd.read_parquet(DATA)
feature_cols = [c for c in df.columns if c.startswith("delta_") and "pct" not in c and "eco" not in c]
X = df[feature_cols].fillna(df[feature_cols].mean())

# --- cible identique au notebook d'entraînement (avec délinquance, bruit 0.15) ---
Xn = (X - X.mean()) / (X.std() + 1e-8)
eco = [c for c in feature_cols if any(x in c.lower() for x in ["pop", "emplt", "act", "log"])]
np.random.seed(42); w = np.random.rand(len(eco)); w /= w.sum()
base = (Xn[eco] * w).sum(axis=1) - 0.4 * Xn["delta_Delinquance"]
np.random.seed(1); score = base + np.random.normal(0, 0.15, len(base))
score = (score - score.mean()) / score.std()
y = pd.cut(score * 3.5, bins=[-np.inf, -4, -1.8, 1.8, 4, np.inf],
           labels=["Crise", "Déclin", "Stable", "Croissance", "Boom"])
le = LabelEncoder(); y_enc = le.fit_transform(y)

Xtr, Xte, ytr, yte = train_test_split(X, y_enc, test_size=0.2, random_state=42, stratify=y_enc)
scaler = StandardScaler(); Xtr_s = scaler.fit_transform(Xtr); Xte_s = scaler.transform(Xte)

models = {
    "XGBoost": xgb.XGBClassifier(max_depth=4, n_estimators=100, learning_rate=0.1, random_state=42, verbosity=0, n_jobs=-1),
    "Random Forest": RandomForestClassifier(n_estimators=50, max_depth=8, random_state=42, n_jobs=-1),
    "Gradient Boosting": HistGradientBoostingClassifier(learning_rate=0.1, max_depth=3, max_iter=50, random_state=42),
    "Logistic Regression": LogisticRegression(max_iter=200, random_state=42),
    "SVM (Linear)": SGDClassifier(loss="log_loss", penalty="l2", max_iter=200, random_state=42),
}
accs = {}
for name, m in models.items():
    m.fit(Xtr_s, ytr); accs[name] = accuracy_score(yte, m.predict(Xte_s))

# --- labels géographiques ---
def clean(n):
    if not isinstance(n, str): return ""
    return ''.join(c for c in unicodedata.normalize('NFD', n) if unicodedata.category(c) != 'Mn').upper().strip().replace('-', ' ')

df_res = df.copy()
d_col = [c for c in df_res.columns if 'département' in c.lower() and 'libellé' in c.lower()][0]
c_col = [c for c in df_res.columns if 'canton' in c.lower() and 'libellé' in c.lower()][0]
df_res['D'] = df_res[d_col].apply(clean)
df_res['C'] = df_res[c_col].apply(clean)

truth_2022 = {'NOUVELLE AQUITAINE':'MACRON','CHARENTE':'MACRON','CHARENTE MARITIME':'MACRON','CORREZE':'MACRON',
    'CREUSE':'MACRON','DORDOGNE':'MACRON','GIRONDE':'MACRON','LANDES':'MACRON','LOT ET GARONNE':'LE PEN',
    'PYRENEES ATLANTIQUES':'MACRON','DEUX SEVRES':'MACRON','VIENNE':'MACRON','HAUTE VIENNE':'MACRON'}
def real_winner(name):
    n = name.upper().strip()
    if n in truth_2022: return truth_2022[n]
    if 'MARMANDE' in n or 'LOT ET GARONNE' in n: return 'LE PEN'
    return 'MACRON'

pred_map = {'Boom':'PÉCRESSE','Croissance':'MACRON','Stable':'MACRON','Déclin':'MÉLENCHON','Crise':'LE PEN'}
side_map = {'Boom':'Droite','Croissance':'Centre','Stable':'Centre','Déclin':'Gauche','Crise':'Extrême Droite'}

def export_model(model, name, acc):
    def entity(group, ename, parent=None):
        idxs = group.index
        Xg = X.iloc[idxs]
        if len(Xg) == 0: return None
        fs = scaler.transform(Xg.mean().values.reshape(1, -1))
        idx = model.predict(fs)[0]; prob = model.predict_proba(fs)[0]
        p = {le.classes_[i]: prob[i] for i in range(len(le.classes_))}
        st = le.inverse_transform([idx])[0]
        pw = pred_map.get(st, 'MACRON'); ps = side_map.get(st, 'Centre')
        rw = real_winner(ename)
        pm = (p.get('Stable', 0) + p.get('Croissance', 0)) * 100
        po = (p.get('Déclin', 0) + p.get('Crise', 0) + p.get('Boom', 0)) * 100
        return {'entity': ename, 'parent': parent, 'predicted': pw, 'real': rw,
                'political_side': ps, 'economic_state': eco_map.get(st, 'stable'),
                'economic_score': float(np.max(prob) * 10), 'is_correct': (pw == rw),
                'proba': {'MACRON': float(pm), 'Opposition': float(po)},
                'conf': f"{np.max(prob)*100:.0f}%", 'pred_cand': pw, 'real_cand': rw,
                'proba_macron': float(pm), 'proba_lepen': float(p.get('Crise', 0) * 100)}

    depts = [entity(df_res[df_res['D'] == d], d) for d in sorted(df_res['D'].unique()) if d]
    cants = []
    # Top cantons PAR DÉPARTEMENT (pour que CHAQUE département ait des cantons)
    for d in sorted(df_res['D'].unique()):
        if not d: continue
        dd = df_res[df_res['D'] == d]
        dept_top = [c for c in dd['C'].value_counts().index if c][:12]
        for c in dept_top:
            cants.append(entity(dd[dd['C'] == c], c, parent=d))
    region = entity(df_res, 'NOUVELLE AQUITAINE')

    data = {
        'summary': {'region_name': 'Nouvelle-Aquitaine',
            'predicted_winner': region['predicted'], 'real_winner': region['real'],
            'model_name': name, 'model_accuracy': round(acc * 100, 1),
            'economic_state': region['economic_state'], 'political_side': region['political_side'],
            'total_records': str(len(df))},
        'political_real': [
            {'party': 'MACRON', 'count': sum(1 for x in depts if x and x['real'] == 'MACRON'), 'color': '#176Bc6'},
            {'party': 'LE PEN', 'count': sum(1 for x in depts if x and x['real'] == 'LE PEN'), 'color': '#000000'}],
        'political_predicted': [
            {'party': 'MACRON', 'count': sum(1 for x in depts if x and x['predicted'] == 'MACRON'), 'color': '#176Bc6'},
            {'party': 'LE PEN', 'count': sum(1 for x in depts if x and x['predicted'] == 'LE PEN'), 'color': '#000000'},
            {'party': 'AUTRE', 'count': sum(1 for x in depts if x and x['predicted'] not in ['MACRON', 'LE PEN']), 'color': '#666666'}],
        'levels': {'region': [region], 'departement': [x for x in depts if x],
                   'canton': [x for x in cants if x], 'commune': []},
    }
    safe = name.replace(" ", "_").lower()
    with open(os.path.join(OUTDIR, f"predictions_{safe}.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    return name, data['summary']['predicted_winner'], data['political_predicted']

print("Régénération des prédictions (avec délinquance) :")
for name in models:
    n, win, polp = export_model(models[name], name, accs[name])
    macron = next(p['count'] for p in polp if p['party'] == 'MACRON')
    print(f"  {n:22s} acc={accs[name]*100:5.1f}%  région={win}  | MACRON sur {macron}/12 dépts")

# predictions.json = copie du XGBoost (comme le pipeline d'origine)
import shutil
shutil.copy2(os.path.join(OUTDIR, "predictions_xgboost.json"), os.path.join(OUTDIR, "predictions.json"))
print(f"\n[ok] predictions.json (= XGBoost) + 5 fichiers modèles -> {OUTDIR}")
