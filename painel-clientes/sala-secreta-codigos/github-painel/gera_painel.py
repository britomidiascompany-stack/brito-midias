import json, hashlib, secrets, re, sys, datetime, openpyxl
S = sys.argv[1]               # scratchpad
SRC = sys.argv[2]             # dashboard-appscript dir
OUT = sys.argv[3]
D = json.load(open(S + '/dash_data.json'))
CORTE = '2026-01-01'
salt = secrets.token_hex(16)  # não é publicado: hash não dá pra reverter

def h(x): return hashlib.sha256((salt + x).encode()).hexdigest()[:12]
def key(email, tel):
    e = str(email or '').strip().lower()
    if e: return h('e' + e)
    t = re.sub(r'\D', '', str(tel or ''))
    if len(t) >= 8: return h('t' + t[-10:])
    return ''
def iso(v):
    s = str(v or '').strip()
    m = re.match(r'^(\d{4})-(\d{2})-(\d{2})', s)
    if m: return s[:10]
    m = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{4})', s)
    if m: return '%s-%02d-%02d' % (m.group(3), int(m.group(2)), int(m.group(1)))
    return ''
def ok(v): d = iso(v); return d and d >= CORTE

DIC = []; _ix = {}
def ix(v):
    v = str(v or '').strip()
    if v not in _ix: _ix[v] = len(DIC); DIC.append(v)
    return _ix[v]
def rn(v):
    try: f = float(v); return int(f) if f == int(f) else round(f, 2)
    except: return v
mt = [D['mtads'][0][:10]] + [[iso(r[0]), ix(r[1]), '', ix(r[3])] + [rn(x) for x in r[4:10]] for r in D['mtads'][1:] if ok(r[0])]
CAMP_IDS = dict(re.findall(r"'(\d{12,})':\s*'(\d{2})'", open(SRC + '/Code.gs').read()))
def camp(t):
    t = str(t or '').strip(); m = re.search(r'\[(\d{2})\]', t)
    if m: return '[' + m.group(1) + ']'
    for i in re.findall(r'\d{12,}', t):
        if i in CAMP_IDS: return '[' + CAMP_IDS[i] + ']'
    return ''
def orig(src, med):   # mesmo resultado de origem_() no Code.gs, em forma curta
    s = str(src or '').strip().lower(); m = str(med or '').strip().lower()
    if s.startswith('mtads-sst'): return 'mtads-sst', ''
    if s in ('ig','fb','facebook','instagram') and m == 'paid': return 'mtads-sst', ''
    if s.startswith('mtads'): return 'mtads', ''
    if not s or s == '-': return '', ''
    if m.startswith('unnichat-instagram'): return 'o', 'unnichat-instagram'
    if m in ('ig-bio','bio'): return 'o', 'bio'
    if m in ('email','e-mail'): return 'o', 'email'
    if m in ('unnichat','wpp','whatsapp'): return 'o', 'wpp'
    return 'o', 'x'

cons = [[] for _ in range(11)] + [r[:30] for r in D['consolidado'][11:] if iso(r[0] if r else '')]
un = [D['unnichat'][0][:1]] + [[iso(r[0]), '', key(r[2], r[3]), '', 'SIM' if str(r[4] or '').strip().upper()=='SIM' else ''] + list(orig(r[5], r[6])) + ['', camp(r[8])] for r in D['unnichat'][1:] if ok(r[0])]
cl = [D['clint'][0][:1]] + [[iso(r[0]), '', key(r[2], r[3]), ''] + list(orig(r[4], r[5])) + ['', camp(r[7])] for r in D['clint'][1:] if ok(r[0])]
links = [r[:2] for r in D['links'] if r and r[0]]
extra = json.load(open(S + '/painel/links_extra.json'))
tem = {str(r[0]).strip().upper() for r in links if len(r) > 1 and r[1]}
links += [[n, l] for n, l in extra if n.strip().upper() not in tem]

wb = openpyxl.load_workbook(S + '/dl/planilha_ss.xlsx', read_only=True, data_only=True)
meses, semanas = [], []
for r in list(wb['_Período'].iter_rows(values_only=True))[1:]:
    if not r or not r[0] or not isinstance(r[1], datetime.datetime) or not isinstance(r[2], datetime.datetime): continue
    it = {'label': str(r[0]), 'inicio': r[1].strftime('%Y-%m-%d'), 'fim': r[2].strftime('%Y-%m-%d')}
    (semanas if re.match(r'^\d{2}/\d{2}/\d{4}$', str(r[0])) else meses).append(it)

DATA = {'mtads': mt, 'consolidado': cons, 'links': links, 'entradas': D['entradas'][:1], 'unnichat': un, 'clint': cl}
data_js = json.dumps(DATA, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
pres_js = json.dumps({'meses': meses, 'semanas': semanas}, ensure_ascii=False)

gs = open(SRC + '/Code.gs').read()
cfg = gs[gs.index('var CFG = {'):gs.index('};', gs.index('var CFG = {')) + 2]
nucleo = gs[gs.index('function computeDashboard_('):gs.index('// Exporta pra teste local')]

ATUAL = sys.argv[4]  # '16/11/2026 13:25'
shim = '''
<script>
// ===== Cópia estática do painel da planilha (dados embutidos, sem nome/e-mail/telefone) =====
var DATA = %s;
var DIC = %s;
DATA.mtads.forEach(function(r,i){ if(i>0){ r[1]=DIC[r[1]]; r[3]=DIC[r[3]]; } });
var PRESETS = %s;
var ATUALIZADO = %s;
%s
%s
function rodar_(fn, ok, falha){ setTimeout(function(){ try { ok && ok(fn()); } catch(e){ if (falha) falha(e); else console.error(e); } }, 30); }
function runner_(ok, falha){
  return {
    withSuccessHandler: function(f){ return runner_(f, falha); },
    withFailureHandler: function(f){ return runner_(ok, f); },
    getPresets: function(){ rodar_(function(){ return PRESETS; }, ok, falha); },
    getDashboardData: function(a, b){ rodar_(function(){
      var o = computeDashboard_(DATA, parseIso_(a), parseIso_(b));
      o.meta.atualizadoEm = ATUALIZADO; return o; }, ok, falha); }
  };
}
var google = { script: { run: runner_(null, null) } };
</script>
''' % (data_js, json.dumps(DIC, ensure_ascii=False).replace('</','<\\/'), pres_js, json.dumps(ATUAL), cfg, nucleo)

html = open(SRC + '/Index.html').read()
def rep(a, b, n=1):
    global html
    c = html.count(a)
    assert c == n, (a[:60], c)
    html = html.replace(a, b)

rep('<title>Dashboard Sala Secreta · Brito Mídias</title>', '<title>Painel Sala Secreta</title>')
css = open(S + '/painel/sumario.css').read()
rep('</style>\n</head>', css + '</style>\n</head>')
nav = open(S + '/painel/sumario.html').read().replace('{{ATUAL}}', ATUAL.split(' ')[0])
rep('<body>\n', '<body>\n' + nav)
rep('<div>Lendo a planilha…</div>', '<div>Calculando o período…</div>')
rep('<header class="hero">', '<header class="hero" id="topo">')
rep('<!-- TRÁFEGO -->\n<section>', '<!-- TRÁFEGO -->\n<section id="trafego">')
rep('<!-- FUNIL -->\n<section class="soft">', '<!-- FUNIL -->\n<section class="soft" id="funil">')
rep('<!-- FUNIL ATÉ O GRUPO (Unnichat + Clint) -->\n<section>', '<!-- FUNIL ATÉ O GRUPO (Unnichat + Clint) -->\n<section id="grupo">')
rep('<!-- COMUNIDADE / VENDAS -->\n<section class="soft">', '<!-- COMUNIDADE / VENDAS -->\n<section class="soft" id="vendas">')
rep('<!-- CRIATIVOS -->\n<section class="soft">', '<!-- CRIATIVOS -->\n<section class="soft" id="criativos">')
rep('<!-- SALAS -->\n<section>', '<!-- SALAS -->\n<section id="salas">')
rep('<div class="eyebrow">Sala Secreta · Tráfego Pago · Marketex</div>\n        <h1>Dashboard Sala Secreta</h1>',
    '<div class="eyebrow">Sala Secreta · Tráfego Pago · Marketex</div>\n        <h1>Painel Sala Secreta</h1>')
# card "próximos passos" (fala do menu da planilha) vira aviso da cópia
i = html.index('<h3>Próximos passos do painel</h3>'); j = html.index('</ul>', i) + 5
html = html[:i] + ('<h3>Sobre esta versão</h3>\n      <ul>\n'
  '        <li>É uma <b>cópia do painel da planilha</b> com os dados de <b>' + ATUAL + '</b>. As contas são as mesmas; os números não se atualizam sozinhos.</li>\n'
  '        <li>Pra ver ao vivo, abra a planilha e use o menu <b>📊 Dashboard SS → Abrir dashboard</b>.</li>\n'
  '        <li>Os cadastros entram sem nome, e-mail ou telefone: só data, origem, campanha e se entrou no grupo.</li>\n'
  '      </ul>') + html[j:]
rep('<script>\n// ---------- utils ----------', shim + '<script>\n// ---------- utils ----------')
js = open(S + '/painel/sumario.js').read()
rep('</body>\n</html>', js + '</body>\n</html>')
open(OUT, 'w').write(html)
print('ok', len(html), 'bytes; mtads', len(mt), 'unni', len(un), 'clint', len(cl), 'links', len(links), 'semanas', len(semanas))
