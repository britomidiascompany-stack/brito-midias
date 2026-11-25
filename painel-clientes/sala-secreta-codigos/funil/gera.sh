#!/bin/bash
# Uso: ./gera.sh <scratchpad> <saida.html>   (antes: baixar a planilha, xlsx2json.py e copiar Code.gs como code_dash.js)
set -e; A="$(cd "$(dirname "$0")" && pwd)"
node "$A/calcula.js" "$1" "$1/funil.json"
python3 -I - "$A/modelo.html" "$1/funil.json" "$2" <<'P'
import sys
m=open(sys.argv[1]).read();d=open(sys.argv[2]).read().replace('</','<\\/')
assert m.count('/*DADOS*/')==1
open(sys.argv[3],'w').write(m.replace('/*DADOS*/',d));print('ok',len(d))
P
