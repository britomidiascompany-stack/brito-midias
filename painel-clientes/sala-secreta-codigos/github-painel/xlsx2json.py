# Reconstroi dash_data.json a partir do xlsx exportado da planilha SS.
# Uso: python3 -I xlsx2json.py <pasta>   (espera <pasta>/dl/planilha_ss.xlsx)
import openpyxl, json, datetime, sys
S=sys.argv[1]
wb=openpyxl.load_workbook(S+'/dl/planilha_ss.xlsx',read_only=True,data_only=True)
TABS={'mtads':'MTADS | SALA SECRETA','consolidado':'Consolidado SS','links':'_Links Criativos','entradas':'Entradas Grupo','unnichat':'Cadastros SS com UTM','clint':'Cadastros SS Clint'}
def cv(v):
    if v is None: return ''
    if isinstance(v,(datetime.datetime,datetime.date)): return v.strftime('%Y-%m-%d')
    return v
out={}
for k,t in TABS.items():
    rows=[[cv(c) for c in r] for r in wb[t].iter_rows(values_only=True)]
    while rows and not any(x!='' for x in rows[-1]): rows.pop()
    out[k]=rows
json.dump(out,open(S+'/dash_data.json','w'),ensure_ascii=False,default=str)
