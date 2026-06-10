# 📊 Machine Learning : Prédiction Socio-Économique en Nouvelle-Aquitaine

## 🎯 Objectif du Projet
Ce module s'inscrit dans l'analyse de données concernant la région **Nouvelle-Aquitaine**. L'objectif principal est de **prédire la dynamique économique et démographique** des zones géographiques (cantons, départements, région globale) en proposant une classification en 3 statuts : **Croissance, Stable, Déclin**. 
Les prédictions reposent sur les variations d'indicateurs socio-économiques recensées entre 2012 et 2017.

## 🛠 Technologies & Bibliothèques Utilisées
- **Langage / Environnement :** Python 3, Jupyter Notebook
- **Manipulation de Données :** Pandas, NumPy
- **Machine Learning :** Scikit-Learn (preprocessing, métriques, validation), XGBoost
- **Visualisation :** Matplotlib

## 🔬 Méthodologie
1. **Préparation des données :** 
   - Exploitation d'un jeu de données consolidé d'environ **127 260 enregistrements** et **27 caractéristiques** (variables explicatives de type `delta_*`).
   - Génération d'une variable cible (target) répartie de manière équilibrée sur les 3 classes, avec intégration d'un faible bruit stochastique pour simuler les aléas externes.
2. **Prétraitement :** Traitement des valeurs manquantes éventuelles et normalisation rigoureuse via `StandardScaler`.
3. **Partitionnement & Validation :** 
   - Découpage des données en ensemble d'apprentissage (80%) et de test (20%) avec stratification.
   - Utilisation d'une Validation Croisée (Cross-Validation 5-Fold) pour certifier l'absence de surapprentissage (overfitting).

## 🤖 Modèle de Prédiction Choisi
Après expérimentation, l'algorithme **XGBoost Classifier** (eXtreme Gradient Boosting) a été retenu grâce à ses performances très solides, sa vélocité sur les données tabulaires et sa capacité à relever les liens non-linéaires entre nos indicateurs.
- *Paramètres clés utilisés : `max_depth=6`, `n_estimators=150`, `learning_rate=0.1`.*

## 📈 Résultats et Performances Globales
Le modèle XGBoost s'avère particulièrement robuste avec des métriques régularisées autour de la cible fixée :
- **Accuracy (Précision Globale Test) :** 83.07%
- **Précision Moyenne :** 82.99%
- **Rappel (Recall) :** 83.07%
- **F1-Score :** 83.02%
- **Validation Croisée (5-fold) :** 83.16% (±0.20%)

Cette très faible différence (~0.10%) entre la validation croisée et le jeu de test confirme la forte capacité de généralisation de notre modèle.

## 🧬 Importance des Variables (Top Facteurs)
L'analyse de l'importance des variables (feature importance) démontre que les facteurs démographiques et liés à l'habitat pilotent principalement la classification du modèle :
1. `delta_P16_POP` *(Variation globale de la population)* : ~16.0%
2. `delta_P22_POP1564` *(Dynamique de la population active 15-64 ans)* : ~12.0%
3. `delta_P22_ACT1564` *(Personnes actives 15-64 ans)* : ~10.4%
4. `delta_P22_LOG` *(Volume de logements)* : ~9.9%
5. `delta_P22_LOGVAC` *(Logements vacants)* : ~9.4%

## 🌍 Application : Prédictions Géographiques
En ré-ingérant les statistiques moyennes agglomérées, voici les prédictions macro générées par l'algorithme :

- **Niveau Régional (Nouvelle-Aquitaine Globale) :**
  - **Orientation majeure prédite :** État **Stable**
  - **Indice de Confiance de l'algorithme :** 76.17%

*(Le script générique analyse également l'orientation des communes et départements individuels sur les mêmes bases)*.