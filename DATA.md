# Données du projet

Pour garder le dépôt léger et **poussable sur GitHub** (limite de 100 Mo/fichier),
les **données lourdes ne sont pas versionnées**. Seuls le code, les notebooks,
les modèles et les livrables (rapport, présentation) sont dans le dépôt.

## Ce qui EST dans le dépôt
- `src/`, `public/` — dashboard React (+ `public/data/*.json`, sorties de prédictions)
- `ml/` — notebooks, scripts et modèles ML
- `MSPR_Final/MSPR/02_Data_Engineering`, `03_Data_Science`, `Livrables_Jury` — notebooks ETL & ML
- `outputs/` — `Rapport final.pdf` et `Presentation 1.pptx`

## Ce qui N'EST PAS dans le dépôt (à récupérer séparément)
Ces dossiers/fichiers sont exclus via `.gitignore` :
- `MSPR_Final/MSPR/01_Donnees/` — données brutes, intermédiaires et finales
  (dont `data_nouvelle_aquitaine_final.csv` ≈ 2,2 Go, parquet ≈ 294 Mo, Delta Lake)
- `MSPR_Final/indicateur data 2016/` et `indicateur data 2020/` — sources INSEE brutes
- Tout fichier `*.csv` / `*.parquet` lourd

➡️ **Récupérer ces données auprès de l'équipe** (Google Drive / WeTransfer) et les
replacer dans la même arborescence avant de relancer les notebooks.

## Relancer le projet
```bash
# Dashboard
npm install
npm run dev

# Notebooks Python : créer un environnement et installer les dépendances
python -m venv .venv
.venv\Scripts\activate
pip install pandas scikit-learn xgboost matplotlib jupyter
```
