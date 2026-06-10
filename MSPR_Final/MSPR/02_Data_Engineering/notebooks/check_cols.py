import pandas as pd
import os

base_path = r'C:\Users\tarek\Downloads\economic-pulse-analyzer\MSPR_Final\MSPR\01_Donnees\brut'
file_2012 = os.path.join(base_path, 'data_election_2012.xlsx')
file_2017 = os.path.join(base_path, 'data_election_2017.xlsx')

def check_file(path, label):
    print(f"\n--- {label} ---")
    try:
        df = pd.read_excel(path, nrows=1)
        print("Columns:", df.columns.tolist())
    except Exception as e:
        print(f"Error: {e}")

check_file(file_2012, "2012")
check_file(file_2017, "2017")
