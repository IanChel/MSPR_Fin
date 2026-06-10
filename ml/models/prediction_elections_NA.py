"""
ML Présidentielle Nouvelle-Aquitaine — Version corrigée
========================================================
Objectif :
  - Prédire le candidat gagnant ET l'orientation politique à partir des delta_*
  - Labels issus des vraies colonnes % Voix/Exp du CSV (vainqueur_nom = Tour 2)
  - Agrégation canton → département → région
"""

import os, json, unicodedata, warnings
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, classification_report)
import xgboost as xgb
from sklearn.ensemble import RandomForestClassifier

warnings.filterwarnings('ignore')

# ─────────────────────────────────────────────────────────────────
# 0. CONFIGURATION
# ─────────────────────────────────────────────────────────────────
# Adaptez ce chemin à votre environnement (ou passez DATA_PATH en variable d'env)
DATA_PATH = os.environ.get(
    "DATA_PATH",
    "C:\\Users\\tarek\\Downloads\\economic-pulse-analyzer\\ml\\data\\data_nouvelle_aquitaine_final.csv"
)
OUTPUT_DIR = "./outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ─────────────────────────────────────────────────────────────────
# Mapping orientation politique RÉELLE par candidat (2012-2022)
# Couverture complète des 12 candidats 2022 + années précédentes
# ─────────────────────────────────────────────────────────────────
ORIENTATION_MAP = {
    # 2022
    "MACRON":          "Centre",
    "LE PEN":          "Extrême Droite",
    "MÉLENCHON":       "Extrême Gauche",
    "MELENCHON":       "Extrême Gauche",
    "ZEMMOUR":         "Extrême Droite",
    "PÉCRESSE":        "Droite",
    "PECRESSE":        "Droite",
    "JADOT":           "Gauche",
    "LASSALLE":        "Centre",
    "ROUSSEL":         "Extrême Gauche",
    "DUPONT-AIGNAN":   "Droite",
    "DUPONT AIGNAN":   "Droite",
    "HIDALGO":         "Gauche",
    "POUTOU":          "Extrême Gauche",
    "ARTHAUD":         "Extrême Gauche",
    # 2017
    "FILLON":          "Droite",
    "HAMON":           "Gauche",
    "ASSELINEAU":      "Droite",
    "CHEMINADE":       "Centre",
    # 2012
    "HOLLANDE":        "Gauche",
    "SARKOZY":         "Droite",
    "JOLY":            "Gauche",
    "BAYROU":          "Centre",
    "MÉLENCHON":       "Extrême Gauche",
    # Générique
    "UNKNOWN":         "Inconnu",
}

def normalize_name(n):
    """Normalise un nom : MAJUSCULES, sans accents, sans tirets → espaces."""
    if not isinstance(n, str):
        return "UNKNOWN"
    n = unicodedata.normalize('NFD', n)
    n = ''.join(c for c in n if unicodedata.category(c) != 'Mn')
    return n.upper().strip().replace('-', ' ')

def get_orientation(candidat_nom):
    nom_norm = normalize_name(candidat_nom)
    # Recherche exacte
    if nom_norm in ORIENTATION_MAP:
        return ORIENTATION_MAP[nom_norm]
    # Recherche partielle
    for key, val in ORIENTATION_MAP.items():
        if key in nom_norm or nom_norm in key:
            return val
    return "Inconnu"

# ─────────────────────────────────────────────────────────────────
# 1. CHARGEMENT DES DONNÉES
# ─────────────────────────────────────────────────────────────────
print("=" * 80)
print("ÉTAPE 1 : CHARGEMENT ET PRÉPARATION DES DONNÉES")
print("=" * 80)

if not os.path.exists(DATA_PATH):
    raise FileNotFoundError(
        f"\n❌ Fichier introuvable : {DATA_PATH}\n"
        "   → Définissez la variable d'environnement DATA_PATH avec le bon chemin.\n"
        "   Exemple : DATA_PATH=/chemin/vers/fichier.csv python nouvelle_aquitaine_ml.py"
    )

df = pd.read_csv(DATA_PATH, low_memory=False)
print(f"\n✓ Données chargées : {df.shape[0]:,} lignes × {df.shape[1]} colonnes")

# ─────────────────────────────────────────────────────────────────
# 2. CONSTRUCTION DES LABELS RÉELS depuis vainqueur_nom (Tour 2)
# ─────────────────────────────────────────────────────────────────
print("\n✓ Construction des labels depuis 'vainqueur_nom'...")

# Correction du nom de colonne "Ann e" → "Annee"
df.columns = [c.strip().replace('\xa0', ' ') for c in df.columns]
# Renommer "Ann e" si présent
df = df.rename(columns={c: 'Annee' for c in df.columns if c.strip() in ['Ann e', 'Année', 'Annee', 'annee']})

# Filtre Tour 2 uniquement pour les labels
if 'Tour' in df.columns:
    df_t2 = df[df['Tour'] == 2].copy()
    print(f"   → Tour 2 uniquement : {df_t2.shape[0]:,} lignes")
else:
    print("   ⚠️  Colonne 'Tour' absente — on utilise toutes les lignes")
    df_t2 = df.copy()

# Vérification de vainqueur_nom
if 'vainqueur_nom' not in df_t2.columns:
    raise ValueError("❌ Colonne 'vainqueur_nom' introuvable dans le CSV.")

# Normalisation du nom du vainqueur
df_t2['vainqueur_norm'] = df_t2['vainqueur_nom'].apply(normalize_name)
df_t2['orientation'] = df_t2['vainqueur_norm'].apply(get_orientation)

print(f"\n   Distribution des vainqueurs (Tour 2) :")
vc = df_t2['vainqueur_norm'].value_counts()
for nom, cnt in vc.items():
    print(f"      {nom:25s} : {cnt:6,}")

print(f"\n   Distribution des orientations :")
oc = df_t2['orientation'].value_counts()
for ori, cnt in oc.items():
    print(f"      {ori:25s} : {cnt:6,}")

# ─────────────────────────────────────────────────────────────────
# 3. FEATURES delta_*
# ─────────────────────────────────────────────────────────────────
feature_cols = [col for col in df_t2.columns
                if col.startswith('delta_')
                and 'pct' not in col.lower()
                and 'eco' not in col.lower()]

print(f"\n✓ Features delta_* sélectionnées : {len(feature_cols)}")

# Nettoyage : remplace 's' (secret statistique) et valeurs non numériques
for col in feature_cols:
    df_t2[col] = pd.to_numeric(df_t2[col], errors='coerce')

X = df_t2[feature_cols].copy()
X = X.fillna(X.mean())

# Vérification données suffisantes
if len(X) < 50:
    raise ValueError(f"❌ Trop peu de lignes après filtrage : {len(X)}. Vérifiez le CSV.")

# ─────────────────────────────────────────────────────────────────
# 4. ENTRAÎNEMENT : MODÈLE A — Prédire le CANDIDAT gagnant
# ─────────────────────────────────────────────────────────────────
print("\n" + "=" * 80)
print("MODÈLE A : PRÉDICTION DU CANDIDAT GAGNANT")
print("=" * 80)

le_cand = LabelEncoder()
y_cand = le_cand.fit_transform(df_t2['vainqueur_norm'])

# Filtrer les classes avec moins de 2 exemples (stratify exige ≥2)
class_counts = pd.Series(y_cand).value_counts()
valid_classes = class_counts[class_counts >= 5].index
mask = pd.Series(y_cand).isin(valid_classes).values
X_cand = X[mask].reset_index(drop=True)
y_cand_f = y_cand[mask]

# Réencoder après filtrage
le_cand2 = LabelEncoder()
y_cand_f = le_cand2.fit_transform(le_cand.inverse_transform(y_cand_f))

print(f"\n   Classes candidats : {list(le_cand2.classes_)}")
print(f"   Échantillons après filtrage : {len(X_cand):,}")

scaler_a = StandardScaler()
X_train_a, X_test_a, y_train_a, y_test_a = train_test_split(
    X_cand, y_cand_f, test_size=0.2, random_state=42,
    stratify=y_cand_f if len(np.unique(y_cand_f)) > 1 else None
)
X_train_a_s = scaler_a.fit_transform(X_train_a)
X_test_a_s  = scaler_a.transform(X_test_a)

models_a = {
    'XGBoost':       xgb.XGBClassifier(max_depth=4, n_estimators=200,
                                        learning_rate=0.1, random_state=42,
                                        verbosity=0,
                                        num_class=len(le_cand2.classes_) if len(le_cand2.classes_) > 2 else None),
    'Random Forest': RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
}

results_a = []
best_acc_a, best_model_a, best_name_a = 0, None, ''

for mname, model in models_a.items():
    print(f"\n   Entraînement {mname}...")
    model.fit(X_train_a_s, y_train_a)
    y_pred = model.predict(X_test_a_s)
    acc = accuracy_score(y_test_a, y_pred)
    results_a.append({
        'Modèle': mname, 'Accuracy': acc,
        'F1': f1_score(y_test_a, y_pred, average='weighted', zero_division=0)
    })
    if acc > best_acc_a:
        best_acc_a, best_model_a, best_name_a = acc, model, mname
    print(f"   → Accuracy : {acc*100:.2f}%")

print(f"\n   🏆 Meilleur modèle A : {best_name_a} ({best_acc_a*100:.2f}%)")
print(classification_report(y_test_a, best_model_a.predict(X_test_a_s),
                             target_names=le_cand2.classes_, zero_division=0))

# ─────────────────────────────────────────────────────────────────
# 5. ENTRAÎNEMENT : MODÈLE B — Prédire l'ORIENTATION politique
# ─────────────────────────────────────────────────────────────────
print("\n" + "=" * 80)
print("MODÈLE B : PRÉDICTION DE L'ORIENTATION POLITIQUE")
print("=" * 80)

le_ori = LabelEncoder()
y_ori_raw = df_t2['orientation'].values
# Filtre classes avec ≥5 exemples
class_counts_o = pd.Series(y_ori_raw).value_counts()
valid_ori = class_counts_o[class_counts_o >= 5].index
mask_o = pd.Series(y_ori_raw).isin(valid_ori).values
X_ori = X[mask_o].reset_index(drop=True)
y_ori_f = le_ori.fit_transform(y_ori_raw[mask_o])

print(f"\n   Classes orientation : {list(le_ori.classes_)}")
print(f"   Échantillons : {len(X_ori):,}")

scaler_b = StandardScaler()
X_train_b, X_test_b, y_train_b, y_test_b = train_test_split(
    X_ori, y_ori_f, test_size=0.2, random_state=42,
    stratify=y_ori_f if len(np.unique(y_ori_f)) > 1 else None
)
X_train_b_s = scaler_b.fit_transform(X_train_b)
X_test_b_s  = scaler_b.transform(X_test_b)

models_b = {
    'XGBoost':       xgb.XGBClassifier(max_depth=4, n_estimators=200,
                                        learning_rate=0.1, random_state=42, verbosity=0),
    'Random Forest': RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
}

results_b = []
best_acc_b, best_model_b, best_name_b = 0, None, ''

for mname, model in models_b.items():
    print(f"\n   Entraînement {mname}...")
    model.fit(X_train_b_s, y_train_b)
    y_pred = model.predict(X_test_b_s)
    acc = accuracy_score(y_test_b, y_pred)
    results_b.append({
        'Modèle': mname, 'Accuracy': acc,
        'F1': f1_score(y_test_b, y_pred, average='weighted', zero_division=0)
    })
    if acc > best_acc_b:
        best_acc_b, best_model_b, best_name_b = acc, model, mname
    print(f"   → Accuracy : {acc*100:.2f}%")

print(f"\n   🏆 Meilleur modèle B : {best_name_b} ({best_acc_b*100:.2f}%)")
print(classification_report(y_test_b, best_model_b.predict(X_test_b_s),
                             target_names=le_ori.classes_, zero_division=0))

# ─────────────────────────────────────────────────────────────────
# 6. PRÉDICTIONS PAR NIVEAU GÉOGRAPHIQUE
# ─────────────────────────────────────────────────────────────────
print("\n" + "=" * 80)
print("ÉTAPE 5 : PRÉDICTIONS PAR NIVEAU GÉOGRAPHIQUE")
print("=" * 80)

def clean_label(n):
    if not isinstance(n, str): return ""
    return ''.join(c for c in unicodedata.normalize('NFD', n)
                   if unicodedata.category(c) != 'Mn').upper().strip()

def predict_entity(X_group, scaler, model_a, le_a, model_b, le_b):
    """Retourne (candidat_prédit, orientation_prédite, confiance_cand, confiance_ori)"""
    if len(X_group) == 0:
        return None
    feat = scaler_a.transform(X_group.mean().values.reshape(1, -1))

    idx_a   = model_a.predict(feat)[0]
    prob_a  = model_a.predict_proba(feat)[0]
    cand    = le_a.inverse_transform([idx_a])[0]
    conf_a  = float(np.max(prob_a))

    feat_b = scaler_b.transform(X_group.mean().values.reshape(1, -1))
    idx_b  = model_b.predict(feat_b)[0]
    prob_b = model_b.predict_proba(feat_b)[0]
    ori    = le_b.inverse_transform([idx_b])[0]
    conf_b = float(np.max(prob_b))

    return {
        'candidat': cand, 'orientation': ori,
        'conf_candidat': conf_a, 'conf_orientation': conf_b,
        'proba_candidat': {le_a.classes_[i]: float(prob_a[i]) for i in range(len(le_a.classes_))},
        'proba_orientation': {le_b.classes_[i]: float(prob_b[i]) for i in range(len(le_b.classes_))}
    }

# Colonnes géographiques (robuste à la casse et aux accents)
df_t2['_dept']   = df_t2['Libellé du département'].apply(clean_label) \
                   if 'Libellé du département' in df_t2.columns else 'INCONNU'
df_t2['_canton'] = df_t2['Libellé du canton'].apply(clean_label) \
                   if 'Libellé du canton' in df_t2.columns else 'INCONNU'

# On réindexe X_cand proprement pour alignement
df_t2_reset = df_t2.reset_index(drop=True)
X_full = df_t2_reset[feature_cols].fillna(df_t2_reset[feature_cols].mean())

# ─── RÉGION ───
region_res = predict_entity(X_full, scaler_a, best_model_a, le_cand2, best_model_b, le_ori)
print(f"\n🏆 RÉSULTAT RÉGIONAL (NOUVELLE-AQUITAINE)")
print(f"   Candidat prédit     : {region_res['candidat']}  (conf: {region_res['conf_candidat']*100:.1f}%)")
print(f"   Orientation prédite : {region_res['orientation']}  (conf: {region_res['conf_orientation']*100:.1f}%)")

# ─── DÉPARTEMENTS ───
print(f"\n📍 RÉSULTATS PAR DÉPARTEMENT")
print("-" * 80)
dept_results = []
for dept in sorted(df_t2_reset['_dept'].unique()):
    if not dept: continue
    idx = df_t2_reset[df_t2_reset['_dept'] == dept].index
    res = predict_entity(X_full.iloc[idx], scaler_a, best_model_a, le_cand2, best_model_b, le_ori)
    if res:
        dept_results.append({'dept': dept, **res})
        vrai = df_t2_reset.loc[idx, 'vainqueur_norm'].mode()[0] if len(idx) > 0 else '?'
        correct = "✓" if res['candidat'] == vrai else "✗"
        print(f"   {dept:30s} → {res['candidat']:15s} ({res['orientation']:15s}) [{correct} réel={vrai}]")

# ─── CANTONS ───
print(f"\n📂 PRÉDICTIONS PAR CANTON (top 20)")
print("-" * 80)
canton_counts = df_t2_reset['_canton'].value_counts()
canton_results = []
for canton in canton_counts.head(20).index:
    if not canton: continue
    idx = df_t2_reset[df_t2_reset['_canton'] == canton].index
    res = predict_entity(X_full.iloc[idx], scaler_a, best_model_a, le_cand2, best_model_b, le_ori)
    if res:
        vrai = df_t2_reset.loc[idx, 'vainqueur_norm'].mode()[0] if len(idx) > 0 else '?'
        canton_results.append({'canton': canton, 'vrai': vrai, **res})
        correct = "✓" if res['candidat'] == vrai else "✗"
        print(f"   {canton:30s} → {res['candidat']:15s} ({res['orientation']:15s}) [{correct} réel={vrai}]")

# ─────────────────────────────────────────────────────────────────
# 7. FEATURE IMPORTANCE
# ─────────────────────────────────────────────────────────────────
print("\n" + "=" * 80)
print("ÉTAPE 6 : IMPORTANCE DES FEATURES (Modèle A — Candidat)")
print("=" * 80)

if hasattr(best_model_a, 'feature_importances_'):
    fi = pd.DataFrame({
        'Feature': feature_cols,
        'Importance': best_model_a.feature_importances_
    }).sort_values('Importance', ascending=False)
    for _, row in fi.head(15).iterrows():
        bar = "█" * int(row['Importance'] * 100)
        print(f"   {row['Feature']:35s} : {bar} {row['Importance']*100:5.2f}%")

# ─────────────────────────────────────────────────────────────────
# 8. EXPORT JSON
# ─────────────────────────────────────────────────────────────────
export = {
    "summary": {
        "region":          "Nouvelle-Aquitaine",
        "candidat_predit": region_res['candidat'],
        "orientation_predite": region_res['orientation'],
        "model_candidat":  best_name_a,
        "accuracy_candidat": round(best_acc_a * 100, 2),
        "model_orientation": best_name_b,
        "accuracy_orientation": round(best_acc_b * 100, 2),
        "nb_lignes": len(df_t2_reset),
        "nb_features": len(feature_cols)
    },
    "departements": dept_results,
    "cantons_top20": canton_results,
    "feature_importance": fi.head(15).to_dict('records') if hasattr(best_model_a, 'feature_importances_') else []
}

out_path = os.path.join(OUTPUT_DIR, "predictions_nouvelle_aquitaine.json")
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(export, f, indent=2, ensure_ascii=False)
print(f"\n✅ Export JSON : {out_path}")

print("\n" + "=" * 80)
print("TERMINÉ")
print("=" * 80)
print(f"\n  Modèle Candidat    : {best_name_a} — Accuracy {best_acc_a*100:.2f}%")
print(f"  Modèle Orientation : {best_name_b} — Accuracy {best_acc_b*100:.2f}%")
print(f"  Prédiction région  : {region_res['candidat']} ({region_res['orientation']})")