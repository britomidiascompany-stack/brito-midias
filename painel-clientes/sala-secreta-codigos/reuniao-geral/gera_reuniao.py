# Gera a página de reunião (LS, Sala Secreta, Mapeamento e Distribuição).
# Uso: python3 -I gera_reuniao.py <repo github-relatorios-ls> <saida.html>
# O bloco do LS é copiado do relatorio resumo-reuniao-ls022-ls023. Os outros blocos têm números fixos,
# lidos em 23/11/2026 dos relatórios linkados em cada bloco.
import re, sys
REPO, OUT = sys.argv[1], sys.argv[2]
R = 'https://britomidiascompany-stack.github.io/marketex/relatorios/'
ls = open(REPO + '/relatorios/resumo-reuniao-ls022-ls023/index.html', encoding='utf-8').read()
css = ls[ls.index('<style>') + 7:ls.index('</style>')]
brand = ls[ls.index('<div class="brand">'):ls.index('<span class="pill">')]
corpo_ls = ls[ls.index('<section'):ls.rindex('</section>') + 10]
assert corpo_ls.count('<section') == 4

def mini(t, v, h='', cls=''):
    return f'<div class="mini"><small>{t}</small><b class="{cls}">{v}</b><div class="h">{h}</div></div>'
def tab(cab, linhas, dest=None):
    th = ''.join(f'<th style="text-align:left">{c}</th>' if c == 'Conteúdo' else f'<th>{c}</th>' for c in cab)
    td = lambda c: f'<td class="tx" style="text-align:left">{c}</td>' if len(re.sub('<[^>]+>', '', c)) > 24 else f'<td>{c}</td>'
    tr = ''.join('<tr>' + ''.join(td(c) for c in l) + '</tr>' for l in linhas)
    return f'<div class="tab"><table><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table></div>'
def sec(titulo, conteudo, intro='', soft=False):
    i = f'<p class="intro">{intro}</p>' if intro else ''
    return f'<section class="{"soft" if soft else ""}"><div class="in"><h2>{titulo}</h2>{i}{conteudo}</div></section>'
def acoes(itens):
    return '<div class="mud">' + ''.join(f'<div><b>{t}</b><span>{d}</span></div>' for t, d in itens) + '</div>'

# ---------- Sala Secreta ----------
ss = sec('Dados principais', tab(
    ['Novembro · 01 a 23/11', 'Cadastros', 'Custo por cadastro', 'Entraram no grupo', 'Custo por entrada'],
    [['Pago (R$ 3.939 investidos)', '1.534', 'R$ 2,57', '1.022', 'R$ 3,85'],
     ['Orgânico', '1.024', 'sem custo', '689', 'sem custo'],
     ['<b>Total, com cadastros sem origem</b>', '<b>2.634</b>', '<b>R$ 1,50</b>', '<b>1.729</b>', '<b>R$ 2,28</b>']]),
    'Pessoa única, sem repetidos. O dia 23/11 é parcial. O custo total divide a verba por todas as pessoas, pagas e orgânicas.')
ss += sec('Resultado da semana', tab(
    ['', '09 a 15/11', '16 a 22/11', 'Variação'],
    [['Investimento', 'R$ 1.032', 'R$ 1.281', '+24%'],
     ['Cadastros do pago', '439', '475', '+8%'],
     ['Custo por cadastro', 'R$ 2,35', 'R$ 2,70', '+15%'],
     ['Entradas no grupo do pago', '270', '298', '+10%'],
     ['Custo por entrada', 'R$ 3,82', 'R$ 4,30', '+13%'],
     ['Cadastros do orgânico', '459', '310', '−32%'],
     ['Entradas no grupo do orgânico', '279', '205', '−27%'],
     ['<b>Total de entradas no grupo</b>', '<b>556</b>', '<b>506</b>', '<b>−9%</b>']]),
    'Em 15 e 16/11 o link do grupo teve problema e poucas entradas foram registradas, nas duas semanas.', True)
IG = lambda n, u: f'<a href="https://www.instagram.com/p/{u}/" target="_blank" rel="noopener">{n}</a>'
ss += sec('Orgânico: por que entrou menos gente', tab(
    ['Posts no perfil (grade do Instagram)', '02 a 08/11', '09 a 15/11', '16 a 22/11'],
    [['Posts no total', '10', '14', '<b>8</b>'],
     ['Reels', '4', '6', '<b>3</b>'],
     ['Pedindo ESPIAR (Sala Secreta)', '4', '7', '<b>3</b>'],
     ['Comentários nos posts de ESPIAR', '575', '<b>2.384</b>', '<b class="neg">402</b>'],
     ['Pedindo MAPEAMENTO', '2', '3', '5'],
     ['Cadastros orgânicos na Sala', '195', '459', '310']])
    + '<br>' + tab(['Cadastros orgânicos', '09 a 15/11', '16 a 22/11'],
    [['Total da semana', '459', '310'],
     ['Só 13 e 14/11 (pico)', '<b>231</b>', '–'],
     ['Média dos outros dias', '46 por dia', '44 por dia']])
    + '<p class="nota">Conferido direto no perfil @anatex em 23/11. Comentários acumulados até essa data. Em 18/11, dia da Sala, não houve post na grade (ata de 19/11). O e-mail foi de 16 cadastros para 1. Reels de teste e stories não aparecem na grade.</p>',
    'Dois Reels com ESPIAR, de 12 e 14/11, coincidem com o pico. Na semana seguinte foram 3 posts com ESPIAR em vez de 7, e nenhum teve o mesmo alcance de comentários.')
ss += sec('Posts que fizeram diferença', tab(
    ['Post', 'Conteúdo', 'Comentários'],
    [[IG('Reel, 12/11 16h', 'Dfpyp1hyPr2'), 'ESPIAR. Coisas que o ChatGPT faz: o que você aprendeu pode virar uma profissão', '<b>1.268</b>'],
     [IG('Reel, 14/11 06h', 'Dft3MkTvB-k'), 'ESPIAR. O talento que você subestima vira produto digital (fixado no perfil)', '<b>632</b>'],
     [IG('Reel, 08/11', 'DfejReKO5qY'), 'ESPIAR. Você viu essa novidade? O ChatGPT...', '277'],
     [IG('Imagem, 15/11 19h', 'Dfx3OhDPF9k'), 'ESPIAR. 9 códigos para criar imagens (118 em 16/11)', '251'],
     [IG('Reel, 17/11', 'Df1w5Y3sjwn'), 'ESPIAR. O padrão que trava o seu crescimento. O melhor da semana de 16 a 22/11', '203'],
     [IG('Reel, 07/11', 'DfdEV2KpoUx'), 'ESPIAR. Convite para a Sala Secreta no fim da legenda', '196'],
     [IG('Reel, 21/11', 'DgBR_G2B4Ov'), 'ESPIAR. Edição de vídeos com IA', '111'],
     [IG('Reel, 20/11', 'Df-v3zQM1Is'), 'ESPIAR. Vários tipos de imagem com uma só foto', '88'],
     [IG('Carrossel, 13/11', 'DfstXM-o9cE'), 'MAPEAMENTO, não a Sala. Passo a passo do clone', '394'],
     [IG('Carrossel, 22/11', 'DgDzoloIyE-'), 'MAPEAMENTO, não a Sala. Sistemas e tarefas com IA', '378']])
    + '<p class="nota">Stories de 18/11 com ESPIAR: 28 cadastros e 25 entradas no grupo, a melhor taxa da semana. O Unnichat não registra de qual post veio cada cadastro, então a ligação entre post e cadastro é pela data.</p>', soft=True)
ss += sec('Ponto de melhoria: conversão da página', tab(
    ['01 a 23/11', 'Investimento', 'Visualizações', 'Leads', 'Conversão', 'Custo por entrada no grupo'],
    [['Página A', 'R$ 1.967', '1.458', '746', '<b>51,2%</b>', 'R$ 3,71'],
     ['Página B', 'R$ 931', '932', '371', '39,8%', 'R$ 4,00'],
     ['Página C', 'R$ 1.041', '1.075', '417', '38,8%', 'R$ 4,05'],
     ['<b>Total</b>', '<b>R$ 3.939</b>', '<b>3.465</b>', '<b>1.534</b>', '<b>44,3%</b>', '<b>R$ 3,85</b>']])
    + '<div class="aviso">Se a conversão for de 44% para 55% com as mesmas visualizações: cerca de 370 cadastros a mais, e o custo por cadastro cai de R$ 2,57 para perto de R$ 2,07. É uma simulação.</div>'
    + '<p class="nota">Não comparar com setembro (92,5%): até 14/10 o lead era contado em dobro. Na semana de 17 a 22/11 a conversão foi de 50,2%. As páginas rodam em campanhas diferentes, então a diferença entre elas não é um teste controlado.</p>',
    '44 de cada 100 pessoas que abrem a página se cadastram. A proposta é criar uma página nova e testar contra a Página A.', True)
ss += sec('Próximos passos', acoes([
    ('Página nova', 'Criar uma nova página de captura e testar contra a Página A, que é a que mais converte hoje.'),
    ('Tema da Sala de 25/11', 'Definir hoje. O carrossel de divulgação vence em 24/11 e ainda espera o tema.'),
    ('Repetir o que puxou o pico', 'Novos Reels com 3 comandos de ChatGPT e ESPIAR no fim, na linha dos de 12 e 14/11, e stories no dia da Sala.'),
    ('Reels de teste', 'Pedir ao Pedro as datas, os links e a palavra de cada Reels de teste de 12 a 22/11.'),
    ('Idade do público', '[12] baixou para R$ 20 por dia e o ADV51 foi desligado nela em 23/11, porque 61% dos leads dele têm 55 anos ou mais.')]))

# ---------- Mapeamento ----------
mp = sec('Dados principais', '<div class="grid g4">'
    + mini('Investimento c/imp', 'R$ 6.525', '04 a 23/11, até as 14h')
    + mini('Começaram o quiz', '253', 'R$ 25,79 cada')
    + mini('Deixaram contato', '140', 'R$ 46,61 cada')
    + mini('Qualificados', '69', 'R$ 94,57 cada')
    + mini('Clicaram em agendar', '25', 'R$ 261,01 cada') + '</div>'
    '<p class="nota">O clique em agendar abre o WhatsApp. Ainda não medimos quantos viraram Mapeamento marcado.</p>')
mp += sec('Resultado: o qualificado está bom, o agendamento não', tab(
    ['', 'Quente [60]', 'Frio [59]'],
    [['Investimento com imposto', 'R$ 3.950', 'R$ 2.575'],
     ['Qualificados', '48', '21'],
     ['Custo por qualificado', '<b>R$ 82,30</b>', '<b>R$ 122,61</b>'],
     ['Clicaram em agendar', '20', '5'],
     ['Custo por clique em agendar', 'R$ 197,52', 'R$ 514,98']]),
    'O custo por qualificado do quente já está abaixo do melhor resultado da Aplicação antiga. A perda está entre qualificar e agendar.', True)
mp += sec('Onde as pessoas param', tab(
    ['Qualificados que chegaram até', 'Quente [60]', 'Frio [59]', 'Total'],
    [['Tela 1 (qualificou)', '48', '21', '69'],
     ['Tela 2, antes do vídeo 1', '46', '19', '65'],
     ['Passou do vídeo 1', '36 <span class="neg">(−22%)</span>', '10 <span class="neg">(−47%)</span>', '46'],
     ['Passou do vídeo 2', '28', '9', '37'],
     ['Escolheu como seguir', '25', '7', '32'],
     ['Chegou ao fim e clicou em agendar', '19', '5', '24']])
    + '<p class="nota">Público frio: quase metade dos que chegam ao vídeo 1 sai nele (9 de 19). No quente são 10 de 46. Amostra pequena, e os vídeos tiveram 43 e 31 reproduções até 16/11. Um clique do quente aconteceu fora deste ramo, por isso 24 aqui e 25 no total.</p>'
    + tab(['Retenção (VTurb, até 16/11)', 'Saem nos 10 primeiros segundos', 'Continuam aos 30 segundos', 'Normal de mercado aos 30 s'],
          [['Vídeo 1', '40%', '41%', '65% a 80%'], ['Vídeo 2', '63%', '10%', '65% a 80%']]))
mp += sec('O que precisamos mexer', acoes([
    ('1. Comercial chama quem não terminou', '45 qualificados deixaram contato e não clicaram em agendar: 4 pararam na tela 2, 19 no vídeo 1, 9 no vídeo 2, 5 na tela de escolha e 8 no fim. Perguntar o motivo e trazer os argumentos para a equipe.'),
    ('2. Corrigir os vídeos (VSL)', 'Refazer o começo dos vídeos 1 e 2, onde a maior parte sai nos primeiros segundos.'),
    ('3. Vídeo específico para o público frio', 'Um vídeo só para quem ainda não conhece a Ana, usando os motivos que o comercial levantar.')]), soft=True)

# ---------- Distribuição ----------
P = lambda n, u: f'<a href="https://www.instagram.com/reel/{u}/" target="_blank" rel="noopener">{n}</a>'
di = sec('Dados principais', tab(
    ['', '22 a 28/10', '30/10 a 05/11', '09 a 15/11', '16 a 22/11'],
    [['Custo por seguidor', 'R$ 0,72', 'R$ 1,47', 'R$ 0,71', '<b>R$ 0,42</b>'],
     ['Seguidores por dia', '367', '179', '361', '319'],
     ['Investimento por dia', 'R$ 264', 'R$ 263', 'R$ 255', 'R$ 133'],
     ['Custo por seguidor no Stories', 'R$ 0,59', 'R$ 1,31', 'R$ 0,60', 'R$ 0,59']]),
    'Campanha C1. A verba passou para R$ 100 por dia em 17/11.')
di += sec('Resultado: menos verba e o custo não subiu', '<div class="duas">'
    '<div class="cx"><h3>Depois do corte</h3><p>De 18 a 22/11 foram R$ 101 por dia e 246 seguidores por dia, a R$ 0,41 cada. Contra 09 a 15/11, a verba caiu 60% e os seguidores caíram 32%.</p></div>'
    '<div class="cx"><h3>Ponto de atenção</h3><p>Desde 14/11 o Meta conta mais seguidores do que visitas no Feed e no Reels. Antes de tratar R$ 0,42 como referência, conferir com o crescimento real do perfil. O Stories, que não mudou, está em R$ 0,59.</p></div></div>', soft=True)
di += sec('O que está dando certo', tab(
    ['Tema', 'Custo por seguidor'],
    [['Novidade ou gadget de IA', '<b>R$ 0,67</b>'], ['Truques e comandos de ChatGPT', '<b>R$ 0,68</b>'],
     ['Renda e produto com o que você sabe', 'R$ 3,57'], ['IA na rotina do negócio', 'R$ 6,53'], ['Reflexão e posicionamento', 'R$ 6,93']])
    + '<br>' + tab(['Melhores vídeos', 'Conteúdo', 'Custo por seguidor'],
    [[P('POST157', 'Ddz8ctWs3gU'), 'Coisas que o ChatGPT faz e você não sabia: crie imagens estratégicas', 'R$ 0,62'],
     [P('POST156', 'DdwIG_MxPBA'), 'Comandos secretos para transformar suas imagens', 'R$ 0,64'],
     [P('POST127', 'DcKMnfUOo8a'), 'O óculos que traduz conversas e mostra legendas', 'R$ 0,67'],
     [P('POST144', 'Ddkn7yVMg3k'), 'O ChatGPT pode criar áudios', 'R$ 0,81'],
     [P('POST150', 'Ddrxu5cB5vY'), 'Coisas que você não sabia que o ChatGPT já faz', 'R$ 0,81']])
    + '<p class="nota">Leitura do time: funciona quando a Ana mostra o passo a passo ("faz isso, depois isso, aí monta isso"), e não só a dica. Os dados separam por tema, não por passo a passo. A exceção é o POST127, que é novidade de IA. Custos por tema e por vídeo: 01/10 a 22/11.</p>',
    'Conteúdo prático e novidade de IA custam perto de R$ 0,67 por seguidor. Reflexão e renda custam de 5 a 10 vezes mais.')
di += sec('Próximos passos', acoes([
    ('Mais Reels na linha dos melhores', 'Mostrar o uso na prática, passo a passo. Reel custa R$ 0,69 por seguidor, imagem R$ 1,73 e carrossel R$ 8,22.'),
    ('Conferir os seguidores reais', 'Comparar os 3.503 seguidores que o Meta conta de 14 a 22/11 com o crescimento do perfil.'),
    ('Manter R$ 100 por dia até 30/11', 'Os 24 criativos novos (CONJ15 a 18) entram quando a verba voltar.')]), soft=True)

FR = [
 ('ls', 'Lançamento Semanal (LS)', 'LS022 e LS023 passaram do teto de exposição', R + 'resumo-reuniao-ls022-ls023/',
  [('Investimento c/imp', 'R$ 65.910', 'LS022 + LS023', ''), ('Retorno líquido', 'R$ 39.028', 'ROAS 0,59x', ''), ('Exposição', '−R$ 26.882', 'teto R$ 25.000', 'neg'), ('Ingressos', '452', 'meta 1.000 · CPA R$ 146', '')], corpo_ls),
 ('ss', 'Sala Secreta', 'Melhoria principal: conversão da página, hoje em 44%', R + 'ss-painel-25.11.26/',
  [('Cadastros do pago', '1.534', 'R$ 2,57 cada', ''), ('Entraram no grupo (pago)', '1.022', 'R$ 3,85 cada', ''), ('Entraram no grupo (orgânico)', '689', 'de 1.024 cadastros', ''), ('Conversão da página', '44,3%', 'visualização → lead', 'neg')], ss),
 ('mp', 'Mapeamento (Quiz)', 'Qualificado em bom custo; a perda está no agendamento', R + 'quiz-mapeamento-mapa/',
  [('Qualificados', '69', 'R$ 94,57 cada', ''), ('Clicaram em agendar', '25', 'R$ 261 cada', 'neg'), ('Param no vídeo 1 · frio', '47%', '9 de 19 qualificados', 'neg'), ('Para o comercial chamar', '45', 'qualificados sem agendar', '')], mp),
 ('di', 'Distribuição de conteúdo', 'Menos verba e custo por seguidor baixo', R + 'distribuicao-criativos-c1-09.11.26/',
  [('Custo por seguidor', 'R$ 0,42', '16 a 22/11 · era R$ 0,71', ''), ('Seguidores', '2.234', '16 a 22/11', ''), ('Verba por dia', 'R$ 133', 'era R$ 255', ''), ('Stories', 'R$ 0,59', 'referência mais segura', '')], di),
]
blocos = ''
for k, nome, frase, link, kp, corpo in FR:
    ks = ''.join(mini(*x) for x in kp)
    blocos += f'''<article class="fr" id="{k}"><div class="fr-top"><div class="in"><div class="fr-h"><div><h2>{nome}</h2><p>{frase}</p></div>
<div class="fr-b"><button type="button" class="ab" aria-expanded="false" aria-controls="c-{k}">Abrir resumo</button><a href="{link}" target="_blank" rel="noopener">Relatório completo →</a></div></div>
<div class="grid g4 fr-k">{ks}</div></div></div>
<div class="fr-c" id="c-{k}" hidden><div class="barra"><div class="in"><b>{nome}</b><span><a href="{link}" target="_blank" rel="noopener">Relatório completo →</a><button type="button" class="fe">Fechar ✕</button></span></div></div>{corpo}</div></article>'''
nav = ''.join(f'<a href="#{k}">{n}</a>' for k, n, *_ in FR)
extra = '''
.hero .in{padding-bottom:40px}.atal{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}.atal a,.atal button{border:1px solid rgba(255,255,255,.4);color:#fff;background:transparent;border-radius:100px;padding:9px 16px;font:500 14px Poppins,sans-serif;text-decoration:none;cursor:pointer}.atal a:hover,.atal button:hover{background:rgba(255,255,255,.12)}
.fr{border-bottom:1px solid var(--linha);scroll-margin-top:0}.fr-top{padding:36px 0 30px}.fr-h{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;flex-wrap:wrap;margin-bottom:18px}.fr-h h2{margin:0;font-size:30px}.fr-h p{margin:4px 0 0;color:var(--cinza);font-size:16px}
.fr-b{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.ab,.fe{background:var(--roxo);color:#fff;border:0;border-radius:10px;padding:12px 20px;font:600 15px Poppins,sans-serif;cursor:pointer}.ab:hover,.fe:hover{background:var(--roxo-dark)}.ab:focus-visible,.fe:focus-visible,.atal a:focus-visible,.atal button:focus-visible{outline:3px solid var(--roxo-light);outline-offset:2px}
.fr-b a,.barra a{color:var(--roxo-dark);font-weight:600;font-size:14px;text-decoration:none}.fr-b a:hover{text-decoration:underline}.fr-k .mini{background:var(--bg-soft);border:0}.fr-k .mini b{font-size:30px;display:block;line-height:1.25}.mini .h{font-size:13px;color:var(--cinza)}
.fr-c{border-top:3px solid var(--roxo);background:#fff}.barra{position:sticky;top:0;z-index:20;background:var(--preto);color:#fff}.barra .in{display:flex;justify-content:space-between;align-items:center;gap:14px;padding-top:10px;padding-bottom:10px;flex-wrap:wrap}.barra span{display:flex;align-items:center;gap:16px}.barra a{color:#fff}.barra .fe{padding:8px 16px;font-size:14px}
.fr-c h2{font-size:24px}.cx p{margin:0;font-size:15px}.cx a,.tab a{color:var(--roxo-dark);font-weight:500}.aviso{font-size:15px;margin-bottom:0}.fr-c .tab td{font-size:15px;white-space:normal}.fr-c .tab th{font-size:13px;letter-spacing:.02em;text-transform:none;white-space:normal;line-height:1.35}.fr-c .tab td:not(:first-child){white-space:nowrap}.fr-c .tab td.tx{white-space:normal}.fr-c .tab td:first-child{min-width:84px}.fr-c .g4{grid-template-columns:repeat(auto-fit,minmax(170px,1fr))}.pe{background:var(--preto);color:rgba(255,255,255,.75);padding:26px 0;font-size:13px}
[hidden]{display:none!important}@media(max-width:760px){.fr-h h2{font-size:25px}.barra .in{padding-left:16px;padding-right:16px}}@media print{.fr-c[hidden]{display:block!important}.barra,.atal,.ab{display:none}}
'''
js = '''
function ver(k,abre){var f=document.getElementById(k),c=document.getElementById('c-'+k),b=f.querySelector('.ab');c.hidden=!abre;b.setAttribute('aria-expanded',abre);b.textContent=abre?'Fechar resumo':'Abrir resumo';}
document.querySelectorAll('.fr').forEach(function(f){var k=f.id;
 f.querySelector('.ab').addEventListener('click',function(){ver(k,document.getElementById('c-'+k).hidden);});
 f.querySelector('.fe').addEventListener('click',function(){ver(k,false);f.scrollIntoView();f.querySelector('.ab').focus({preventScroll:true});});});
var t=document.getElementById('todos');t.addEventListener('click',function(){var a=t.dataset.a!=='1';document.querySelectorAll('.fr').forEach(function(f){ver(f.id,a);});t.dataset.a=a?'1':'';t.textContent=a?'Fechar tudo':'Abrir tudo';});
'''
html = f'''<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Reunião geral · 23/11/26</title><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"><style>{css}{extra}</style></head><body>
<header class="hero"><div class="in"><div class="topo">{brand}<span class="pill">Reunião · 23/11/2026</span></div><h1 style="margin-top:34px">Pontos principais da semana</h1><div class="sub">Marketex · LS, Sala Secreta, Mapeamento e Distribuição de conteúdo</div><nav class="atal">{nav}<button type="button" id="todos">Abrir tudo</button></nav></div></header>
{blocos}
<footer class="pe"><div class="in">BM Mídias · Marketex. Números lidos em 23/11/2026 dos relatórios de cada frente; não se atualizam sozinhos. Períodos diferentes em cada bloco.</div></footer>
<script>{js}</script></body></html>'''
open(OUT, 'w', encoding='utf-8').write(html)
print('ok', len(html))
