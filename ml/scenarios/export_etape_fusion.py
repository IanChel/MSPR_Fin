"""Exporte le Delta Lake (donnees APRES FUSION / AVANT NETTOYAGE) en CSV + Excel,
dans un dossier livrable clair pour la binome. N'ecrase aucun fichier existant."""
import os, glob
import pandas as pd

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DELTA = os.path.join(ROOT, "MSPR_Final", "MSPR", "01_Donnees", "delta_lake_final")
OUTDIR = os.path.join(ROOT, "MSPR_Final", "MSPR", "01_Donnees", "livrables_etapes")
os.makedirs(OUTDIR, exist_ok=True)

parts = sorted(glob.glob(os.path.join(DELTA, "*.parquet")))
df = pd.concat([pd.read_parquet(p) for p in parts], ignore_index=True)
print(f"Delta Lake charge : {df.shape[0]} lignes, {df.shape[1]} colonnes")

csv_path = os.path.join(OUTDIR, "2_apres_fusion_avant_nettoyage.csv")
xlsx_path = os.path.join(OUTDIR, "2_apres_fusion_avant_nettoyage.xlsx")

# CSV avec BOM utf-8 (accents corrects a l'ouverture dans Excel)
df.to_csv(csv_path, index=False, encoding="utf-8-sig")
print("[ok] CSV  ->", csv_path, f"({os.path.getsize(csv_path)/1024/1024:.1f} Mo)")

df.to_excel(xlsx_path, index=False, engine="openpyxl")
print("[ok] XLSX ->", xlsx_path, f"({os.path.getsize(xlsx_path)/1024/1024:.1f} Mo)")

# Petit fichier README pour situer les 3 etapes
readme = os.path.join(OUTDIR, "LISEZ-MOI_etapes.txt")
with open(readme, "w", encoding="utf-8") as f:
    f.write(
        "ETAPES DU PIPELINE DE DONNEES - Nouvelle-Aquitaine\n"
        "==================================================\n\n"
        "1) AVANT TRANSFORMATION (donnees brutes telechargees) :\n"
        "   - MSPR_Final/MSPR/01_Donnees/brut/data_election_2012.xlsx\n"
        "   - MSPR_Final/MSPR/01_Donnees/brut/data_election_2017.xlsx\n"
        "   - MSPR_Final/indicateur data 2016/  (Diplome, Delinquance, Population & emploi, Revenus)\n"
        "   - MSPR_Final/indicateur data 2020/  (Delinquance, Emploi, Population, Revenus)\n"
        "   - MSPR_Final/MSPR/01_Donnees/facteur/securite/  (RALFSS 2017 + securite 2021)\n\n"
        "2) APRES FUSION / AVANT NETTOYAGE (elections + indicateurs fusionnes) :\n"
        "   - 2_apres_fusion_avant_nettoyage.csv   (ce dossier)\n"
        "   - 2_apres_fusion_avant_nettoyage.xlsx  (ce dossier)\n"
        f"   - {df.shape[0]} lignes, {df.shape[1]} colonnes\n"
        "   - Source d'origine : MSPR_Final/MSPR/01_Donnees/delta_lake_final/ (format Delta/Parquet)\n\n"
        "3) APRES NETTOYAGE (version finale, utilisee par le modele ML) :\n"
        "   - MSPR_Final/MSPR/01_Donnees/data_nouvelle_aquitaine_final.csv   (858 024 lignes)\n"
        "   - MSPR_Final/MSPR/01_Donnees/data_nouvelle_aquitaine_final.parquet\n"
    )
print("[ok] README ->", readme)
