# GouvData ML Analytics

Dashboard React unifié et pipeline Machine Learning XGBoost pour la prédiction des élections présidentielles 2022 en Nouvelle-Aquitaine, à partir des dynamiques socio-économiques.

## Architecture

Le projet est organisé comme une seule source de vérité pour simplifier les mises à jour de données et de modèles.

```
mon-projet/
├── public/
│   └── data/
│       └── predictions.json        ← UNIQUE fichier de sortie ML + lu par le frontend
├── ml/
│   ├── notebooks/
│   │   └── Nouvelle_Aquitaine_ML.ipynb
│   ├── data/                        ← CSV bruts (.gitignore exclut les CSV)
│   └── models/                      ← .pkl sauvegardés
├── src/                             ← Dashboard React
└── package.json
```

## Workflow Utilisateur Final

1. **Mettre à jour les données** : Placez votre fichier CSV (ex: `data_nouvelle_aquitaine_final.csv`) dans le dossier `ml/data/`.
2. **Lancer le Pipeline ML** : Ouvrez et exécutez `ml/notebooks/Nouvelle_Aquitaine_ML.ipynb` (Run All). Le notebook écrira directement ses résultats dans `public/data/predictions.json`.
3. **Lancer le Dashboard** :
   ```bash
   npm install   # (Si ce n'est pas déjà fait)
   npm run dev
   ```
   Ouvrez `http://localhost:5173` dans votre navigateur pour visualiser les vraies prédictions dynamiques avec les filtres en cascade (Région → Département → Canton).

## Fonctionnalités

- **Prédictions XGBoost** : Accuracy multi-classes (croissance/stable/déclin) + mapping avec l'échiquier politique.
- **Filtres Dynamiques en Cascade** : Filtrez par Département ou Canton pour voir les indicateurs ajustés en temps réel.
- **Spectre Politique Dynamique** : Affiche les scénarios gagnants réels calculés par le modèle, au lieu de scénarios statiques.
