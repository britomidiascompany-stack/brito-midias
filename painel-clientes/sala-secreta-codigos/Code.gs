/**
 * DASHBOARD SALA SECRETA · Brito Mídias
 * ----------------------------------------------------------------------------
 * Apps Script vinculado à planilha "Tráfego Pago Sala Secreta" (Marketex).
 *
 * COMO INSTALAR (uma vez):
 *   1. Na planilha: Extensões → Apps Script.
 *   2. Cole este arquivo em "Código.gs" (substituindo tudo) e crie um arquivo
 *      HTML chamado exatamente "Index" com o conteúdo de Index.html.
 *   3. Salve (Ctrl+S). Recarregue a planilha → aparece o menu "📊 Dashboard SS".
 *   4. Menu → "Abrir dashboard" abre dentro da planilha.
 *      (Na 1ª vez o Google pede autorização — é o script lendo a própria planilha.)
 *   5. Opcional, pra abrir em tela cheia/compartilhar link:
 *      Implantar → Nova implantação → Tipo: App da Web → Executar como: eu →
 *      Quem pode acessar: qualquer pessoa com o link (ou só você) → Implantar.
 *
 * FONTES DE DADOS (todas nesta planilha):
 *   - "MTADS | SALA SECRETA"  → tráfego diário por criativo (investimento, leads, CPL, criativos)
 *   - "Consolidado SS"        → uma linha por Sala (quarta): audiência, vendas por produto, receita
 *   - "_Links Criativos"      → link clicável de cada criativo (fallback: planilha externa RC | SST)
 *   - "_Período"              → atalhos de período (meses e semanas, quinta→quarta)
 *   - "Entradas Grupo"        → (criada pelo menu) entradas na comunidade por dia — preencher manualmente
 */

var CFG = {
  SHEET_MTADS: 'MTADS | SALA SECRETA',
  SHEET_CONSOLIDADO: 'Consolidado SS',
  SHEET_LINKS: '_Links Criativos',
  SHEET_PERIODOS: '_Período',
  SHEET_ENTRADAS: 'Entradas Grupo',
  SHEET_UNNICHAT: 'Cadastros SS com UTM',
  SHEET_CLINT: 'Cadastros SS Clint',
  CONSOLIDADO_FIRST_DATA_ROW: 12,
  LINKS_EXTERNAL_ID: '1PrxhTlo8xAzU7fERtdaJezNX0tYdg7gRUGiEfMP-VOI',
  LINKS_EXTERNAL_TAB: 'RC | SST',
  TOP_CRIATIVOS: 10,

  // Algumas campanhas mandam a UTM com o ID numerico do Meta em vez do nome
  // (utm_campaign = 120253980943770196). Sem este mapa elas caem em "sem campanha"
  // e o funil do grupo fica subestimado. Para adicionar uma nova: pegue o ID da
  // campanha no Meta e escreva 'ID': 'NN' (NN = o numero entre colchetes do nome).
  CAMP_IDS: {
    '120253980943770196': '04',
    '120253980950760196': '05',
    '120255126783030196': '06',
    '120255445342090196': '07',
    '120255669589380196': '08',
    '120255669858360196': '09',
    '120256478275150196': '10',
    '120256478275620196': '11',
    '120256789156700196': '12',
    '120257008340580196': '13',
    '120257434998940196': '14',
    '120257435014750196': '15'
  }
};

// ============================================================================
// UI / entradas
// ============================================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📊 Dashboard SS')
    .addItem('Abrir dashboard', 'abrirDashboard')
    .addSeparator()
    .addItem('🩺 Verificar e corrigir a planilha', 'verificarECorrigirPlanilha')
    .addSeparator()
    .addItem('Criar aba "Entradas Grupo"', 'criarAbaEntradas')
    .addItem('Sincronizar links dos criativos (RC | SST → _Links Criativos)', 'sincronizarLinks')
    .addItem('🎬 Preencher Video IDs na planilha de criativos', 'preencherVideoIds')
    .addToUi();
}

// ============================================================================
// Manutenção da planilha
// ----------------------------------------------------------------------------
// Dois problemas que travam os números das Salas novas:
//   1. Fórmulas com range FIXO no MTADS (ex.: $E$2:$E$6004). Quando o MTADS
//      passa dessa linha, tudo que vem depois some da conta. Solução: deixar o
//      range aberto ($E$2:$E), que cresce sozinho.
//   2. Data da Sala digitada com o ano errado no "Registro Semanal"
//      (ex.: 23/09/0206). A Sala some de qualquer período.
// Esta função mostra o que encontrou, pede confirmação e só então corrige.
// ============================================================================

var ABAS_COM_FORMULA_MTADS = ['Consolidado SS', 'Trafego Pago SS (Rafael)'];
var REGISTRO_SEMANAL_PRIMEIRA_LINHA = 2;

function verificarECorrigirPlanilha() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var diag = diagnosticar_(ss);

  if (!diag.ranges.length && !diag.datas.length) {
    ui.alert('Tudo certo ✅',
      'Nenhum range travado e nenhuma data com ano errado.\n\n' +
      'Última linha do MTADS: ' + diag.mtadsUltimaLinha + '\n' +
      'Última data com dados: ' + diag.mtadsUltimaData,
      ui.ButtonSet.OK);
    return;
  }

  var msg = '';
  if (diag.ranges.length) {
    msg += 'RANGES TRAVADOS (fórmulas que ignoram as linhas novas do MTADS):\n';
    diag.ranges.forEach(function (r) {
      msg += '  • ' + r.aba + ': ' + r.celulas + ' células param na linha ' + r.limite + '\n';
    });
    msg += '  → vão virar range aberto, que cresce sozinho.\n\n';
  }
  if (diag.datas.length) {
    msg += 'DATAS COM ANO ERRADO (aba Registro Semanal):\n';
    diag.datas.forEach(function (d) {
      msg += '  • ' + d.a1 + ': "' + d.antes + '"  →  ' + d.depoisTexto + '\n';
    });
    msg += '\n';
  }
  msg += 'O MTADS hoje vai até a linha ' + diag.mtadsUltimaLinha + ' (' + diag.mtadsUltimaData + ').\n\n' +
         'Posso corrigir agora? (dá pra desfazer com Ctrl+Z)';

  if (ui.alert('Corrigir a planilha?', msg, ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  var res = aplicarCorrecoes_(ss, diag);
  ui.alert('Pronto ✅',
    res.celulas + ' célula(s) de fórmula destravada(s) e ' + res.datas + ' data(s) corrigida(s).\n\n' +
    'Confira a aba Consolidado SS: as Salas de setembro devem ter saído do zero.\n' +
    'O dashboard já lê os valores novos.',
    ui.ButtonSet.OK);
}

function diagnosticar_(ss) {
  var out = { ranges: [], datas: [], mtadsUltimaLinha: 0, mtadsUltimaData: '—' };

  var mt = ss.getSheetByName(CFG.SHEET_MTADS);
  if (mt) {
    out.mtadsUltimaLinha = mt.getLastRow();
    var d = toDate_(mt.getRange(out.mtadsUltimaLinha, 1).getValue());
    if (d) out.mtadsUltimaData = Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  }

  // 1. ranges fixos apontando pro MTADS
  var padrao = new RegExp("'" + CFG.SHEET_MTADS.replace('|', '\\|') + "'!\\$[A-Z]+\\$\\d+:\\$[A-Z]+\\$(\\d+)", 'g');
  ABAS_COM_FORMULA_MTADS.forEach(function (nome) {
    var sh = ss.getSheetByName(nome);
    if (!sh || sh.getLastRow() < 1) return;
    var formulas = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getFormulas();
    var porLimite = {};
    formulas.forEach(function (linha) {
      linha.forEach(function (f) {
        if (!f) return;
        var m, re = new RegExp(padrao.source, 'g'), vistos = {};
        while ((m = re.exec(f)) !== null) vistos[m[1]] = true;
        Object.keys(vistos).forEach(function (lim) { porLimite[lim] = (porLimite[lim] || 0) + 1; });
      });
    });
    Object.keys(porLimite).forEach(function (lim) {
      out.ranges.push({ aba: nome, limite: lim, celulas: porLimite[lim] });
    });
  });

  // 2. datas de Sala com ano implausível no Registro Semanal
  var rs = ss.getSheetByName('Registro Semanal');
  if (rs && rs.getLastRow() >= REGISTRO_SEMANAL_PRIMEIRA_LINHA) {
    var n = rs.getLastRow() - REGISTRO_SEMANAL_PRIMEIRA_LINHA + 1;
    var vals = rs.getRange(REGISTRO_SEMANAL_PRIMEIRA_LINHA, 1, n, 1).getValues();
    var anterior = null;
    for (var i = 0; i < n; i++) {
      var bruto = vals[i][0];
      if (bruto === '' || bruto === null) { continue; }
      var dt = toDate_(bruto);
      var ok = dt && dt.getFullYear() >= 2000 && dt.getFullYear() <= 2100;
      if (ok) { anterior = dt; continue; }
      if (!anterior) continue; // sem referência anterior, não arrisca
      var esperado = new Date(anterior.getFullYear(), anterior.getMonth(), anterior.getDate() + 7);
      out.datas.push({
        linha: REGISTRO_SEMANAL_PRIMEIRA_LINHA + i,
        a1: 'A' + (REGISTRO_SEMANAL_PRIMEIRA_LINHA + i),
        antes: String(bruto),
        depois: esperado,
        depoisTexto: Utilities.formatDate(esperado, Session.getScriptTimeZone(), 'dd/MM/yyyy')
      });
      anterior = esperado;
    }
  }
  return out;
}

function aplicarCorrecoes_(ss, diag) {
  var celulas = 0;
  // Abre os ranges: troca "$<limite>" por "" → $E$2:$E$6004 vira $E$2:$E
  diag.ranges.forEach(function (r) {
    var sh = ss.getSheetByName(r.aba);
    if (!sh) return;
    celulas += sh.createTextFinder('$' + r.limite).matchFormulaText(true).replaceAllWith('');
  });

  var rs = ss.getSheetByName('Registro Semanal');
  diag.datas.forEach(function (d) {
    rs.getRange(d.linha, 1).setValue(d.depois).setNumberFormat('dd/mm/yyyy');
  });

  SpreadsheetApp.flush();
  return { celulas: celulas, datas: diag.datas.length };
}

// ============================================================================
// Video IDs → planilha "RESULTADOS GERAIS CRIATIVOS" (aba RC | SST, coluna I)
// ----------------------------------------------------------------------------
// A lista abaixo é o que o Claude puxa da conta ANEX 08 e cola aqui.
// Para uma próxima leva de criativos, é só substituir a lista e rodar de novo.
// O script procura o criativo pelo nome na coluna A e escreve o ID na coluna I.
// Não sobrescreve nada que já esteja preenchido — se achar diferente, só avisa.
// ============================================================================

var RC_SST_COL_NOME = 1;   // A — CRIATIVOS
var RC_SST_COL_TIPO = 3;   // C — TIPO
var RC_SST_COL_FASE = 4;   // D — FASE
var RC_SST_COL_VIDEO = 9;  // I — VIDE ID/HASH ANEX 08

// [nome do criativo, video id]  — ANEX 08, puxado em 27/09/2026
var VIDEO_IDS_ANEX08 = [
  ['ADV45_SST_CAP_VOCE NAO DOMINA IA_0.44',                      '1636347031522499'],
  ['ADV46_SST_CAP_A IA PODE CRIAR SISTEMAS PARA VOCÊ_0.45',      '1802426804105392'],
  ['ADV47_SST_CAP_TUDO DEPENDE DE VOCE_0.50',                    '2150074785605104'],
  ['ADV48_SST_CAP_SABIA QUE DA PARA CRIAR SISTEMAS COM IA_0.47', '1102106939184150'],
  ['ADV49_SST_CAP_TRANSFORME SEU CONHECIMENTO EM SISTEMAS_0.42', '1413452790309273'],
  ['ADV50_SST_CAP_SEU SISTEMA FEITO COM IA.1.26',                '977489958708910'],
  ['ADV51_SST_CAP_O CHATGPT CRIA PAGINAS.0.52',                  '1739446750668897'],
  ['ADV52_SST_CAP_A BONECA_0.52',                                '1414452354118158'],
  ['ADV53_SST_CAP_SISTEMA DE OBRAS_0.55',                        '1106965995107495'],
  ['ADV54_SST_CAP_ANOS 80_0.52',                                 '1445049257509842'],
  ['ADV55_SST_CAP_USE O CHATGPT PARA CRIAR SISTEMAS_1.45',       '2045366869517378']
];

function preencherVideoIds() {
  var ui = SpreadsheetApp.getUi();
  var sh;
  try {
    sh = SpreadsheetApp.openById(CFG.LINKS_EXTERNAL_ID).getSheetByName(CFG.LINKS_EXTERNAL_TAB);
  } catch (e) {
    ui.alert('Sem acesso à planilha de criativos. Abra-a com esta mesma conta Google e tente de novo.');
    return;
  }
  if (!sh) { ui.alert('Aba "' + CFG.LINKS_EXTERNAL_TAB + '" não encontrada.'); return; }

  var ultima = sh.getLastRow();
  var nomes = ultima > 1 ? sh.getRange(2, RC_SST_COL_NOME, ultima - 1, 1).getValues() : [];
  var ids = ultima > 1 ? sh.getRange(2, RC_SST_COL_VIDEO, ultima - 1, 1).getValues() : [];

  var porNome = {};
  for (var i = 0; i < nomes.length; i++) {
    var nm = semExtensao_(nomes[i][0]);
    if (nm) porNome[nm] = { linha: i + 2, idAtual: String(ids[i][0] || '').trim() };
  }

  var preencher = [], jaOk = [], conflito = [], novos = [];
  VIDEO_IDS_ANEX08.forEach(function (par) {
    var nome = par[0], id = String(par[1]);
    var achado = porNome[semExtensao_(nome)];
    if (!achado) { novos.push([nome, id]); return; }
    if (!achado.idAtual) { preencher.push({ linha: achado.linha, nome: nome, id: id }); }
    else if (achado.idAtual === id) { jaOk.push(nome); }
    else { conflito.push({ nome: nome, atual: achado.idAtual, novo: id }); }
  });

  var msg = '';
  if (preencher.length) msg += preencher.length + ' criativo(s) já na planilha, com a coluna I vazia → vou preencher.\n';
  if (novos.length)     msg += novos.length + ' criativo(s) NÃO estão na planilha → vou criar a linha (nome + tipo VIDEOS + fase CAPTAÇÃO + ID).\n';
  if (jaOk.length)      msg += jaOk.length + ' já estão com o mesmo ID → não mexo.\n';
  if (conflito.length) {
    msg += '\n⚠️ ' + conflito.length + ' com ID DIFERENTE do que está lá (não vou sobrescrever):\n';
    conflito.forEach(function (c) { msg += '  • ' + c.nome + '\n     planilha: ' + c.atual + '\n     ANEX 08: ' + c.novo + '\n'; });
  }
  if (!preencher.length && !novos.length) {
    ui.alert('Nada a fazer', msg || 'Todos os criativos da lista já estão com o ID correto.', ui.ButtonSet.OK);
    return;
  }
  if (ui.alert('Preencher os Video IDs?', msg + '\nPosso seguir?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  preencher.forEach(function (p) {
    sh.getRange(p.linha, RC_SST_COL_VIDEO).setValue(p.id).setNumberFormat('@');
  });
  if (novos.length) {
    var inicio = sh.getLastRow() + 1;
    novos.forEach(function (n, k) {
      var linha = inicio + k;
      sh.getRange(linha, RC_SST_COL_NOME).setValue(n[0]);
      sh.getRange(linha, RC_SST_COL_TIPO).setValue('VIDEOS');
      sh.getRange(linha, RC_SST_COL_FASE).setValue('CAPTAÇÃO');
      sh.getRange(linha, RC_SST_COL_VIDEO).setValue(n[1]).setNumberFormat('@');
    });
  }
  SpreadsheetApp.flush();
  ui.alert('Pronto ✅',
    preencher.length + ' ID(s) preenchido(s) e ' + novos.length + ' linha(s) nova(s) criada(s) na aba ' +
    CFG.LINKS_EXTERNAL_TAB + '.' + (conflito.length ? '\n\n' + conflito.length + ' conflito(s) foram ignorados — confira na mão.' : ''),
    ui.ButtonSet.OK);
}

// "ADV45_..._0.44.MP4" e "ADV45_..._0.44" viram a mesma chave
function semExtensao_(s) {
  return String(s || '').trim().replace(/\.(mp4|mov|m4v|avi|jpg|jpeg|png)$/i, '').toUpperCase().replace(/\s+/g, ' ');
}

// Copia nome→link da planilha "RESULTADOS GERAIS CRIATIVOS" (aba RC | SST) pra aba _Links Criativos,
// só o que ainda não existe aqui. Não sobrescreve links já preenchidos.
function sincronizarLinks() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var local = ss.getSheetByName(CFG.SHEET_LINKS);
  if (!local) { ui.alert('Aba "' + CFG.SHEET_LINKS + '" não encontrada.'); return; }
  var ext;
  try {
    ext = SpreadsheetApp.openById(CFG.LINKS_EXTERNAL_ID).getSheetByName(CFG.LINKS_EXTERNAL_TAB);
  } catch (e) {
    ui.alert('Sem acesso à planilha externa de criativos (' + CFG.LINKS_EXTERNAL_ID + '). Abra-a com esta mesma conta Google e tente de novo.');
    return;
  }
  if (!ext) { ui.alert('Aba "' + CFG.LINKS_EXTERNAL_TAB + '" não encontrada na planilha externa.'); return; }

  var atuais = buildLinkMap_(local.getDataRange().getValues());
  var extRows = ext.getDataRange().getValues();
  var novos = [];
  for (var i = 1; i < extRows.length; i++) {
    var nome = String(extRows[i][0] || '').trim(), link = String(extRows[i][1] || '').trim();
    if (!nome || !/^https?:\/\//i.test(link)) continue;
    if (atuais[normName_(nome)]) continue;
    atuais[normName_(nome)] = link;
    novos.push([nome, link]);
  }
  if (!novos.length) { ui.alert('Nada a sincronizar — todos os links já estão na aba ' + CFG.SHEET_LINKS + '.'); return; }
  var lastRow = local.getLastRow();
  local.getRange(lastRow + 1, 1, novos.length, 2).setValues(novos);
  ui.alert(novos.length + ' link(s) adicionado(s) à aba ' + CFG.SHEET_LINKS + '.');
}

function abrirDashboard() {
  var html = HtmlService.createHtmlOutputFromFile('Index')
    .setWidth(1320)
    .setHeight(880);
  SpreadsheetApp.getUi().showModalDialog(html, 'Dashboard Sala Secreta · Brito Mídias');
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Dashboard Sala Secreta · Brito Mídias')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function criarAbaEntradas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(CFG.SHEET_ENTRADAS);
  if (sh) {
    SpreadsheetApp.getUi().alert('A aba "' + CFG.SHEET_ENTRADAS + '" já existe.');
    return;
  }
  sh = ss.insertSheet(CFG.SHEET_ENTRADAS);
  sh.getRange('A1:C1').setValues([['Data', 'Entradas no grupo', 'Observação']]);
  sh.getRange('A1:C1').setFontWeight('bold').setBackground('#EDE9FE').setFontColor('#3B0F73');
  sh.getRange('A2:A1000').setNumberFormat('dd/mm/yyyy');
  sh.getRange('B2:B1000').setNumberFormat('0');
  sh.setColumnWidth(1, 110);
  sh.setColumnWidth(2, 150);
  sh.setColumnWidth(3, 320);
  sh.setFrozenRows(1);
  sh.getRange('A2').setNote('Uma linha por dia. O dashboard soma a coluna B dentro do período selecionado.');
  SpreadsheetApp.getUi().alert('Aba "' + CFG.SHEET_ENTRADAS + '" criada. Preencha uma linha por dia (Data · Entradas no grupo).');
}

// ============================================================================
// API chamada pelo Index.html
// ============================================================================

function getDashboardData(startStr, endStr) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = {
    mtads: readSheet_(ss, CFG.SHEET_MTADS),
    consolidado: readSheet_(ss, CFG.SHEET_CONSOLIDADO),
    links: readSheet_(ss, CFG.SHEET_LINKS),
    entradas: readSheet_(ss, CFG.SHEET_ENTRADAS, true),
    unnichat: readSheet_(ss, CFG.SHEET_UNNICHAT, true),
    clint: readSheet_(ss, CFG.SHEET_CLINT, true)
  };

  var start = parseIso_(startStr);
  var end = parseIso_(endStr);
  var out = computeDashboard_(data, start, end);

  // Fallback de links: planilha externa "RESULTADOS GERAIS CRIATIVOS" (aba RC | SST)
  var faltando = out.criativos.filter(function (c) { return !c.link; });
  if (faltando.length) {
    try {
      var ext = SpreadsheetApp.openById(CFG.LINKS_EXTERNAL_ID).getSheetByName(CFG.LINKS_EXTERNAL_TAB);
      if (ext) {
        var map = buildLinkMap_(ext.getDataRange().getValues());
        out.criativos.forEach(function (c) {
          if (!c.link) c.link = map[normName_(c.nome)] || '';
        });
      }
    } catch (e) { /* sem acesso à planilha externa — segue sem link */ }
  }

  out.meta.atualizadoEm = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  return out;
}

function getPresets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rows = readSheet_(ss, CFG.SHEET_PERIODOS, true) || [];
  var meses = [], semanas = [];
  for (var i = 1; i < rows.length; i++) {
    var label = rows[i][0], ini = toDate_(rows[i][1]), fim = toDate_(rows[i][2]);
    if (!label || !ini || !fim) continue;
    var item = { label: String(label), inicio: iso_(ini), fim: iso_(fim) };
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(String(label))) semanas.push(item);
    else meses.push(item);
  }
  return { meses: meses, semanas: semanas };
}

function readSheet_(ss, name, optional) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    if (optional) return null;
    throw new Error('Aba não encontrada: "' + name + '"');
  }
  return sh.getDataRange().getValues();
}

// ============================================================================
// Núcleo (funções puras — sem API do Google, testáveis fora do Apps Script)
// ============================================================================

function computeDashboard_(data, start, end) {
  var mtads = data.mtads || [];
  var cons = data.consolidado || [];
  var links = data.links || [];
  var entradas = data.entradas;

  var linkMap = buildLinkMap_(links);

  // ---------- TRÁFEGO (MTADS diário) ----------
  var t = { investimento: 0, impressoes: 0, alcance: 0, cliques: 0, lpv: 0, leads: 0 };
  var porDia = {};
  var porCriativo = {};
  var dataMin = null, dataMax = null;
  var detalhe = {};        // dia|campanha|criativo -> métricas (base dos filtros por seção)
  var campsMtads = {};     // código da campanha -> nome completo

  for (var i = 1; i < mtads.length; i++) {
    var r = mtads[i];
    var d = toDate_(r[0]);
    if (!d) continue;
    if (!dataMin || d < dataMin) dataMin = d;
    if (!dataMax || d > dataMax) dataMax = d;
    if (d < start || d > end) continue;

    var inv = num_(r[4]), impr = num_(r[5]), alc = num_(r[6]), clk = num_(r[7]), lpv = num_(r[8]), leads = num_(r[9]);
    t.investimento += inv; t.impressoes += impr; t.alcance += alc; t.cliques += clk; t.lpv += lpv; t.leads += leads;

    var k = iso_(d);
    if (!porDia[k]) porDia[k] = { data: k, investimento: 0, leads: 0 };
    porDia[k].investimento += inv; porDia[k].leads += leads;

    var nome = String(r[3] || '').trim();
    if (nome) {
      if (!porCriativo[nome]) porCriativo[nome] = { nome: nome, investimento: 0, leads: 0, impressoes: 0, cliques: 0 };
      porCriativo[nome].investimento += inv; porCriativo[nome].leads += leads;
      porCriativo[nome].impressoes += impr; porCriativo[nome].cliques += clk;
    }

    // base detalhada: um registro por dia × campanha × criativo
    var campNome = String(r[1] || '').trim();
    var cod = campCodigo_(campNome) || 'SN';
    if (cod !== 'SN' && !campsMtads[cod]) campsMtads[cod] = campNome;
    var ck = k + '|' + cod + '|' + nome;
    if (!detalhe[ck]) detalhe[ck] = { data: k, camp: cod, criativo: nome, investimento: 0, impressoes: 0, alcance: 0, cliques: 0, lpv: 0, leads: 0 };
    var dd = detalhe[ck];
    dd.investimento += inv; dd.impressoes += impr; dd.alcance += alc;
    dd.cliques += clk; dd.lpv += lpv; dd.leads += leads;
  }

  var trafego = {
    investimento: t.investimento,
    leads: t.leads,
    cpl: t.leads ? t.investimento / t.leads : null,
    impressoes: t.impressoes,
    alcance: t.alcance,
    cliques: t.cliques,
    lpv: t.lpv,
    cpm: t.impressoes ? t.investimento / t.impressoes * 1000 : null,
    cpc: t.cliques ? t.investimento / t.cliques : null,
    ctr: t.impressoes ? t.cliques / t.impressoes : null,
    connectRate: t.cliques ? t.lpv / t.cliques : null,
    convPagina: t.lpv ? t.leads / t.lpv : null,
    custoLpv: t.lpv ? t.investimento / t.lpv : null,
    diasComDados: Object.keys(porDia).length
  };

  var serie = Object.keys(porDia).sort().map(function (k) {
    var x = porDia[k];
    x.cpl = x.leads ? x.investimento / x.leads : null;
    return x;
  });

  // ---------- CRIATIVOS (ranking no período) ----------
  var criativos = Object.keys(porCriativo).map(function (k) { return porCriativo[k]; })
    .filter(function (c) { return c.leads > 0; })
    .map(function (c) {
      c.cpl = c.investimento / c.leads;
      c.share = t.leads ? c.leads / t.leads : 0;
      c.ctr = c.impressoes ? c.cliques / c.impressoes : null;
      c.link = linkMap[normName_(c.nome)] || '';
      return c;
    })
    .sort(function (a, b) { return b.leads - a.leads || a.cpl - b.cpl; });

  var totalCriativosAtivos = criativos.length;
  criativos = criativos.slice(0, CFG.TOP_CRIATIVOS);

  // ---------- SALAS / VENDAS / AUDIÊNCIA (Consolidado SS) ----------
  var salas = [];
  var v = { workshop: 0, gravacao: 0, palestras: 0, fotos: 0, totalSS: 0, aplicacoesMentoria: 0, mentoria3: 0, mentoria6: 0,
            receitaProdutos: 0, receitaMentoria: 0, receitaTotal: 0 };
  var somaPico = 0, somaPresenca = 0, nPico = 0, nPres = 0, comunidadeUltima = null;

  for (var j = CFG.CONSOLIDADO_FIRST_DATA_ROW - 1; j < cons.length; j++) {
    var c = cons[j];
    var ds = toDate_(c[0]);
    if (!ds) continue;
    if (ds < start || ds > end) continue;

    var sala = {
      data: iso_(ds),
      sem: c[1],
      tema: String(c[2] || '').trim(),
      produto: String(c[3] || '').trim(),
      investimento: num_(c[4]),
      leads: num_(c[9]),
      cpl: num_(c[11]) || null,
      convPagina: num_(c[10]) || null,
      comunidade: num_(c[12]),
      pico: num_(c[13]),
      presenca: num_(c[14]) || null,
      workshop: num_(c[15]),
      gravacao: num_(c[16]),
      palestras: num_(c[17]),
      fotos: num_(c[18]),
      totalSS: num_(c[19]),
      aplicacoesMentoria: num_(c[20]),
      mentoria3: num_(c[21]),
      mentoria6: num_(c[22]),
      receitaProdutos: num_(c[27]),
      receitaMentoria: num_(c[28]),
      receitaTotal: num_(c[29])
    };
    salas.push(sala);

    v.workshop += sala.workshop; v.gravacao += sala.gravacao; v.palestras += sala.palestras; v.fotos += sala.fotos;
    v.totalSS += sala.totalSS; v.aplicacoesMentoria += sala.aplicacoesMentoria;
    v.mentoria3 += sala.mentoria3; v.mentoria6 += sala.mentoria6;
    v.receitaProdutos += sala.receitaProdutos; v.receitaMentoria += sala.receitaMentoria; v.receitaTotal += sala.receitaTotal;

    if (sala.pico > 0) { somaPico += sala.pico; nPico++; }
    if (sala.presenca !== null && sala.presenca > 0) { somaPresenca += sala.presenca; nPres++; }
    if (sala.comunidade > 0) comunidadeUltima = sala.comunidade;
  }

  var vendasQtd = v.totalSS + v.mentoria3 + v.mentoria6;
  var vendas = {
    workshop: v.workshop, gravacao: v.gravacao, palestras: v.palestras, fotos: v.fotos, totalSS: v.totalSS,
    aplicacoesMentoria: v.aplicacoesMentoria, mentoria3: v.mentoria3, mentoria6: v.mentoria6,
    receitaProdutos: v.receitaProdutos, receitaMentoria: v.receitaMentoria, receitaTotal: v.receitaTotal,
    vendasQtd: vendasQtd,
    ticketMedio: vendasQtd ? v.receitaTotal / vendasQtd : null,
    roas: trafego.investimento ? v.receitaTotal / trafego.investimento : null,
    custoPorVenda: vendasQtd ? trafego.investimento / vendasQtd : null
  };

  // ---------- ENTRADAS NO GRUPO (aba opcional, manual) ----------
  var entradasGrupo = null, entradasDisponivel = false;
  if (entradas && entradas.length > 1) {
    entradasDisponivel = true;
    var soma = 0, achou = false;
    for (var e = 1; e < entradas.length; e++) {
      var de = toDate_(entradas[e][0]);
      if (!de || de < start || de > end) continue;
      var qtd = num_(entradas[e][1]);
      if (entradas[e][1] !== '' && entradas[e][1] !== null) { soma += qtd; achou = true; }
    }
    entradasGrupo = achou ? soma : null;
  }

  // ---------- CADASTROS / GRUPO (Unnichat + Clint, sem duplicar) ----------
  // Duas bases de cadastro, uma linha por pessoa em cada:
  //   Unnichat ('Cadastros SS com UTM')  → tem a coluna "Entrou no Grupo"
  //   Clint    ('Cadastros SS Clint')    → NÃO tem essa coluna
  // A mesma pessoa pode estar nas duas. Dedupe pelo e-mail (minúsculo, sem
  // espaços); quem está nas duas conta uma vez e fica com a versão do Unnichat,
  // que é a única que sabe dizer se entrou no grupo.
  var pessoas = {};            // chave → registro unificado
  var campsUnni = {}, campsClint = {}, cadDataMax = null, clintDataMax = null, semEmail = 0;

  function chave_(email, nome, tel, d) {
    var e = String(email || '').trim().toLowerCase();
    if (e) return 'e:' + e;
    var t = String(tel || '').replace(/\D/g, '');
    if (t.length >= 8) return 't:' + t.slice(-10);   // telefone, ignorando DDI
    semEmail++;
    return 'x:' + iso_(d) + '|' + String(nome || '').trim().toLowerCase() + '|' + semEmail;
  }

  // 1) Unnichat — fonte preferida (traz a informação de grupo)
  var unni = data.unnichat;
  if (unni && unni.length > 1) {
    for (var u = 1; u < unni.length; u++) {
      var du = toDate_(unni[u][0]);
      if (!du) continue;
      if (!cadDataMax || du > cadDataMax) cadDataMax = du;
      var codU = campCodigo_(unni[u][8]) || 'SN';   // SN = sem campanha identificada
      campsUnni[codU] = true;
      if (du < start || du > end) continue;
      var kU = chave_(unni[u][2], unni[u][1], unni[u][3], du);
      var noGrupo = String(unni[u][4] || '').trim().toUpperCase() === 'SIM';
      var origU = origem_(unni[u][5], unni[u][6]);
      var ant = pessoas[kU];
      if (ant && ant.fonte === 'unnichat') {
        // Mesma pessoa em dois dias: a atribuição fica com o cadastro mais
        // antigo (foi ele que trouxe a pessoa), mas um "SIM" em qualquer das
        // linhas vale — senão o grupo fica subcontado.
        if (noGrupo) ant.grupo = true;
        if (ant.data <= iso_(du)) continue;
        ant.data = iso_(du); ant.camp = codU; ant.origem = origU;
        continue;
      }
      pessoas[kU] = { data: iso_(du), camp: codU, origem: origU, fonte: 'unnichat', grupo: noGrupo };
    }
  }

  // 2) Clint — só entra quem o Unnichat não tem; nunca sobrescreve
  var cli = data.clint;
  if (cli && cli.length > 1) {
    for (var q = 1; q < cli.length; q++) {
      var dq = toDate_(cli[q][0]);
      if (!dq) continue;
      if (!clintDataMax || dq > clintDataMax) clintDataMax = dq;
      if (dq < start || dq > end) continue;
      var kQ = chave_(cli[q][2], cli[q][1], cli[q][3], dq);
      var codQ = campCodigo_(cli[q][7]) || 'SN';
      campsClint[codQ] = true;
      if (pessoas[kQ]) continue;                     // já veio do Unnichat
      pessoas[kQ] = {
        data: iso_(dq), camp: codQ, origem: origem_(cli[q][4], cli[q][5]),
        fonte: 'clint', grupo: false                 // Clint não informa grupo
      };
    }
  }

  // Agregado por dia × campanha × origem
  var cadMap = {};
  Object.keys(pessoas).forEach(function (k) {
    var p = pessoas[k];
    var ck = p.data + '|' + p.camp + '|' + p.origem;
    if (!cadMap[ck]) cadMap[ck] = {
      data: p.data, camp: p.camp, origem: p.origem,
      cadastros: 0, grupo: 0, unnichat: 0, clint: 0, semGrupoInfo: 0
    };
    var a = cadMap[ck];
    a.cadastros++;
    if (p.fonte === 'unnichat') { a.unnichat++; if (p.grupo) a.grupo++; }
    else { a.clint++; a.semGrupoInfo++; }
  });
  var cadastros = Object.keys(cadMap).map(function (k) { return cadMap[k]; })
    .sort(function (a, b) { return a.data < b.data ? -1 : (a.data > b.data ? 1 : 0); });

  // Lista de campanhas para os filtros: de onde vem cada uma e se dá pra medir custo
  var todosCods = {};
  Object.keys(campsMtads).forEach(function (c) { todosCods[c] = true; });
  Object.keys(campsUnni).forEach(function (c) { todosCods[c] = true; });
  Object.keys(campsClint).forEach(function (c) { todosCods[c] = true; });
  Object.keys(detalhe).forEach(function (k) { todosCods[detalhe[k].camp] = true; });
  var campanhas = Object.keys(todosCods).sort().map(function (c) {
    return {
      cod: c,
      nome: campsMtads[c] || (c === 'SN' ? 'Sem campanha / orgânico' : 'Campanha [' + c + ']'),
      temMtads: !!campsMtads[c],      // tem investimento e leads
      temUnnichat: !!campsUnni[c],    // tem cadastro e "entrou no grupo"
      temClint: !!campsClint[c]       // tem cadastro, mas sem info de grupo
    };
  });

  var audiencia = {
    salas: salas.length,
    picoMedio: nPico ? somaPico / nPico : null,
    presencaMedia: nPres ? somaPresenca / nPres : null,
    comunidadeUltima: comunidadeUltima,
    entradasGrupo: entradasGrupo,
    entradasDisponivel: entradasDisponivel
  };

  return {
    periodo: { inicio: iso_(start), fim: iso_(end), dias: Math.round((end - start) / 86400000) + 1 },
    trafego: trafego,
    serie: serie,
    criativos: criativos,
    totalCriativosAtivos: totalCriativosAtivos,
    salas: salas,
    vendas: vendas,
    audiencia: audiencia,
    detalhe: Object.keys(detalhe).map(function (k) { return detalhe[k]; }),
    cadastros: cadastros,
    campanhas: campanhas,
    meta: {
      dataMin: dataMin ? iso_(dataMin) : null,
      dataMax: dataMax ? iso_(dataMax) : null,
      cadastrosDataMax: cadDataMax ? iso_(cadDataMax) : null,
      clintDataMax: clintDataMax ? iso_(clintDataMax) : null
    }
  };
}

// "[08] [SST] [CAPTACAO]..." ou "MTADS-SST_[13][SST]..." -> "08" / "13".
// Sem colchete com 2 dígitos (orgânico, newsletter, salasecreta) -> null.
function campCodigo_(s) {
  var t = String(s || '').trim();
  var m = t.match(/\[(\d{2})\]/);
  if (m) return m[1];
  // UTM com o ID numerico do Meta: resolve pelo mapa CFG.CAMP_IDS
  var ids = t.match(/\d{12,}/g);
  if (ids) {
    for (var i = 0; i < ids.length; i++) {
      if (CFG.CAMP_IDS[ids[i]]) return CFG.CAMP_IDS[ids[i]];
    }
  }
  return null;
}

// De onde veio o cadastro, pelo utm_source + utm_medium.
// Valores vistos na base (out/26): MTADS-SST, ig/fb + paid (anúncio do Meta
// sem a UTM padrão), organico + unnichat-instagram / ig-bio / email / unnichat
// / elementor, org + youtube / wpp / teleram / manychat, vazio e "-".
function origem_(source, medium) {
  var s = String(source || '').trim().toLowerCase();
  var m = String(medium || '').trim().toLowerCase();
  if (s.indexOf('mtads-sst') === 0) return 'pago';
  if ((s === 'ig' || s === 'fb' || s === 'facebook' || s === 'instagram') && m === 'paid') return 'pago';
  if (s.indexOf('mtads') === 0) return 'outro_funil';
  if (!s || s === '-') return 'sem_utm';
  if (m.indexOf('unnichat-instagram') === 0) return 'ig_unnichat';
  if (m === 'ig-bio' || m === 'bio') return 'bio';
  if (m === 'email' || m === 'e-mail') return 'email';
  if (m === 'unnichat' || m === 'wpp' || m === 'whatsapp') return 'whatsapp';
  return 'org_outros';
}

function buildLinkMap_(rows) {
  var map = {};
  if (!rows) return map;
  for (var i = 1; i < rows.length; i++) {
    var nome = rows[i][0], link = rows[i][1];
    if (!nome || !link) continue;
    var l = String(link).trim();
    if (!/^https?:\/\//i.test(l)) continue;
    map[normName_(nome)] = l;
  }
  return map;
}

function normName_(s) {
  return String(s || '').trim().toUpperCase().replace(/\s+/g, ' ');
}

function num_(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  var s = String(v).replace(/[R$\s]/g, '');
  if (s.indexOf(',') > -1 && s.indexOf('.') > -1) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.indexOf(',') > -1) s = s.replace(',', '.');
  var n = parseFloat(s);
  return isFinite(n) ? n : 0;
}

// Aceita Date, "dd/mm/yyyy", "yyyy-mm-dd" (com ou sem hora). Retorna Date à meia-noite local.
function toDate_(v) {
  if (v === null || v === undefined || v === '') return null;
  if (Object.prototype.toString.call(v) === '[object Date]') {
    if (isNaN(v.getTime())) return null;
    return new Date(v.getFullYear(), v.getMonth(), v.getDate());
  }
  var s = String(v).trim();
  var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  return null;
}

function parseIso_(s) {
  var d = toDate_(s);
  if (!d) throw new Error('Data inválida: ' + s);
  return d;
}

function iso_(d) {
  var mm = ('0' + (d.getMonth() + 1)).slice(-2), dd = ('0' + d.getDate()).slice(-2);
  return d.getFullYear() + '-' + mm + '-' + dd;
}

// Exporta pra teste local em Node (ignorado no Apps Script)
if (typeof module !== 'undefined') {
  module.exports = { computeDashboard_: computeDashboard_, toDate_: toDate_, num_: num_, CFG: CFG };
}
