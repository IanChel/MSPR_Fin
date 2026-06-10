from fpdf import FPDF

class PDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'Resultats Election Presidentielle 2022 - Nouvelle-Aquitaine', 0, 1, 'C')
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

pdf = PDF()
pdf.add_page()
pdf.set_font('Arial', '', 12)

# Région
pdf.set_font('Arial', 'B', 14)
pdf.cell(0, 10, '1. Region Nouvelle-Aquitaine (2nd Tour)', 0, 1)
pdf.set_font('Arial', '', 12)
pdf.cell(0, 10, 'Vainqueur : Emmanuel Macron (\x7e58.32% des voix)', 0, 1)
pdf.ln(5)

# Départements
pdf.set_font('Arial', 'B', 14)
pdf.cell(0, 10, '2. Par Departement', 0, 1)
pdf.set_font('Arial', '', 12)

departements = [
    "Charente (16) : Emmanuel Macron",
    "Charente-Maritime (17) : Emmanuel Macron",
    "Correze (19) : Emmanuel Macron",
    "Creuse (23) : Emmanuel Macron",
    "Dordogne (24) : Emmanuel Macron",
    "Gironde (33) : Emmanuel Macron",
    "Landes (40) : Emmanuel Macron",
    "Lot-et-Garonne (47) : Marine Le Pen",
    "Pyrenees-Atlantiques (64) : Emmanuel Macron",
    "Deux-Sevres (79) : Emmanuel Macron",
    "Vienne (86) : Emmanuel Macron",
    "Haute-Vienne (87) : Emmanuel Macron"
]

for dep in departements:
    pdf.cell(0, 8, f"- {dep}", 0, 1)

pdf.ln(5)

# Top 50 Communes
pdf.set_font('Arial', 'B', 14)
pdf.cell(0, 10, '3. Vainqueur dans le Top 50 des Communes (Echantillon principal)', 0, 1)
pdf.set_font('Arial', '', 10)

communes = [
    "Bordeaux : Emmanuel Macron", "Limoges : Emmanuel Macron", "Poitiers : Emmanuel Macron",
    "Pau : Emmanuel Macron", "La Rochelle : Emmanuel Macron", "Merignac : Emmanuel Macron",
    "Pessac : Emmanuel Macron", "Niort : Emmanuel Macron", "Bayonne : Emmanuel Macron",
    "Brive-la-Gaillarde : Emmanuel Macron", "Angouleme : Emmanuel Macron", "Talence : Emmanuel Macron",
    "Anglet : Emmanuel Macron", "Agen : Emmanuel Macron", "Mont-de-Marsan : Emmanuel Macron",
    "Perigueux : Emmanuel Macron", "Villenave-d'Ornon : Emmanuel Macron", "Saint-Medard-en-Jalles : Emmanuel Macron",
    "Bergerac : Emmanuel Macron", "Biarritz : Emmanuel Macron", "Begles : Emmanuel Macron",
    "Rochefort : Emmanuel Macron", "Chatellerault : Emmanuel Macron", "Gujan-Mestras : Emmanuel Macron",
    "Dax : Emmanuel Macron", "La Teste-de-Buch : Emmanuel Macron", "Libourne : Emmanuel Macron",
    "Villeneuve-sur-Lot : Emmanuel Macron", "Le Bouscat : Emmanuel Macron", "Gradignan : Emmanuel Macron",
    "Cestas : Emmanuel Macron", "Saintes : Emmanuel Macron", "Mont-de-Marsan : Emmanuel Macron",
    "Tulle : Emmanuel Macron", "Hendaye : Emmanuel Macron", "Royan : Emmanuel Macron",
    "Lescar : Emmanuel Macron", "Oloron-Sainte-Marie : Emmanuel Macron", "Marmande : Marine Le Pen",
    "Eysines : Emmanuel Macron", "Lormont : Emmanuel Macron", "Gueret : Emmanuel Macron",
    "Tarnos : Emmanuel Macron", "Ambares-et-Lagrave : Emmanuel Macron", "Saint-Paul-les-Dax : Emmanuel Macron",
    "Biscarrosse : Emmanuel Macron", "Orthez : Emmanuel Macron", "Saint-Jean-de-Luz : Emmanuel Macron",
    "Macon : Emmanuel Macron", "Cognac : Emmanuel Macron"
]

for i, com in enumerate(communes, 1):
    pdf.cell(0, 6, f"{i}. {com}", 0, 1)

pdf.output('Resultats_Elections_2022_Nouvelle_Aquitaine.pdf')
print("Fichier PDF cree avec succes !")
