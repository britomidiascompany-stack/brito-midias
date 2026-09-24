# ATV207 — Criar campanha no Meta Ads (VOA Conhecimento) — versão em linguagem para IA

> Manual de execução para Claude ou Codex rodarem, via MCP de Meta Ads, uma campanha nova de
> lançamento no padrão da casa. Base factual: o que foi realmente executado na ATV206
> (lançamento BNCC019 — "Jornada BNCC na Prática", VOA Conhecimento, 18–25/09/2026).
> Escrito pelo Claude do Gabriel · 24/09/2026.
>
> **Regra de leitura deste manual:** o que está escrito aqui foi verificado em produção na ATV206.
> O que **não** foi verificado está na seção 0, marcado. Não complete lacuna com conhecimento geral
> de Meta Ads: uma chave de API errada derruba a chamada, e um valor errado sobe campanha errada.

---

## LEIA ISTO PRIMEIRO

1. **O nome do anúncio entra na UTM no momento da publicação** (`{{ad.name}}`). Renomear depois não
   conserta a URL já gravada. Logo: **não crie nada antes do planejamento de nomes aprovado.**
2. **Nada de IA nos criativos.** Todos os recursos de aprimoramento por IA ficam em `OPT_OUT`, um por
   um — são os 13 da seção 4.4, enviados **no criativo**.
3. **CTA é sempre `LEARN_MORE` ("Saiba mais").** Nunca `SEE_DETAILS`.
4. **Confira a página de destino abrindo o link no navegador antes de montar o criativo.** A página
   certa vem do briefing (na ATV206 era `https://voaconhecimento.com.br/wts` — ver seção 1). O erro
   que o gestor pegou foi justamente mandar pra home.
5. **Tudo nasce `PAUSED`.** Ativar só com ordem explícita, e na ordem campanha → conjunto → anúncio.
6. **Nunca edite campanha ativa por API** — `ads_update_entity` força `status: PAUSED` nela.
7. **Advantage+ Audience desligado** (`advantage_audience: 0`) — exigência do cliente.
8. **A UTM não é colada por API.** É colada na tela do Ads Manager, em massa.
9. **Cliente é "VOA Conhecimento".** Nunca "Voice", nunca "Voa Conhecimentos".
10. Na dúvida sobre orçamento, copy, nome ou nome de campo de API: **PARE E PERGUNTE.** Não preencha
    por conta própria.

---

## 0. 🔴 O QUE AINDA NÃO ESTÁ VERIFICADO

Os valores de API deste manual — nomes de campo, objetos literais, unidades, assinaturas de tool —
foram **verificados em produção na ATV206**: são as chamadas que o Meta aceitou e os `spec` que ele
devolveu. O que muda a cada lançamento está na tabela de placeholders da **seção 1**, e o orçamento
continua vindo do briefing (portão 🔴 P3), nunca da IA.

Sobrou **uma** lacuna. Não a preencha por conta própria:

| Lacuna | Onde isso trava | Como resolver |
|---|---|---|
| **`<NN>` do anúncio no D0** (`E HOJE`), o único dia que não tem número de contagem regressiva | Passo 2 / nomenclatura (seção 3) | perguntar ao Gabriel antes de fechar o planejamento de nomes — o nome vira `utm_content` e não se conserta depois |

Regra geral: **se a chamada for recusada por um nome de campo, não tente variações às cegas.** Registre
o erro exato no ClickUp e pergunte.

---

## 1. Placeholders — preencha antes de executar

| Placeholder | O que é | Onde consegue | Valor na ATV206 (histórico, não default) |
|---|---|---|---|
| `<ACCOUNT_ID>` | conta de anúncios | constante da conta | `528479071959953` (BNCC 03; na tela aparece como `act_528479071959953`) |
| `<PAGE_ID>` | página do Facebook | constante da conta | `107966640678365` |
| `<PIXEL_ID>` | pixel / dataset | constante da conta | `642103307974769` ("Voa Conhecimento 2", evento `Lead`) |
| `<LANCAMENTO>` | código do lançamento | tarefa do ClickUp (ver 🔴 P0) | `BNCC019` |
| `<AUDIENCE_PIXEL_ID>` | público de site (pixel, evento Lead, 45 dias) | `ads_get_ad_account_custom_audiences` | `120252677607720222` |
| `<AUDIENCE_LISTA_ID>` | público de lista de e-mails (180 dias) | idem | `120252677607810222` |
| `<LINK_URL>` | página de destino | **briefing** — e abrir no navegador pra confirmar | `https://voaconhecimento.com.br/wts` |
| `<GENERO_COD>` | código de gênero no `targeting` | briefing | `[2]` (= mulheres) |
| `<IDADE_MIN>` / `<IDADE_MAX>` | faixa etária | briefing | `26` / `60` |
| `<PASTA_DRIVE>` | pasta dos criativos | tarefa do ClickUp | `https://drive.google.com/drive/folders/1oEclfIocdYFrikqieURi-fLWu8DhUkIG` |
| `<PLANILHA_CRIATIVOS>` | planilha de resultado de criativo (onde se registra Video ID / Hash) | tarefa do ClickUp | `106npWr_HhP78piAK1yTHWqSMa-U25pb0FkoB4KqiEEE` |
| `<VIDEO_ID>` / `<IMAGE_HASH>` | mídia na biblioteca da conta | upload (`ads_creative_upload_media`) / `ads_get_ad_videos`, `ads_get_ad_images` | — |
| `<THUMB_URL>` | thumbnail do vídeo (1º frame) | campo `picture` do vídeo | — |
| `<ORCAMENTO_DIA>` | orçamento diário do conjunto | **só o Gabriel/briefing** | R$69 / R$129 / R$193 / R$50 — ver 🔴 P3 |
| `<INICIO>` / `<FIM>` | **datas** da janela do conjunto | calculadas a partir do D0 do briefing | `<INICIO>` = 18/09/2026, `<FIM>` = 19/09/2026 (conjunto `FALTAM 03 DIAS`) |
| `<NOME_CAMPANHA>` / `<NOME_CONJUNTO>` / `<NOME_ANUNCIO>` | nomes completos | **planejamento aprovado** (seção 3) | — |

**Regra do `<ACCOUNT_ID>`:** nas tools do MCP o parâmetro é `ad_account_id` e recebe **só o número, sem
o prefixo `act_`** (`528479071959953`). O `act_` aparece na tela do Ads Manager e na URL — não na
chamada. A conta BNCC 03 é em **BRL** (importa para a unidade do orçamento, seção 4.2).

**Regra de data:** **D0 = o dia do evento / da aula 01** definido no briefing. D-1, D-2, D-3 são os dias
anteriores. Cada conjunto cobre exatamente 24h: começa 00h00 do seu dia e termina 00h00 do dia seguinte.
Na ATV206, D0 = seg 21/09/2026, então `FALTAM 03 DIAS` = sex 18/09 → 19/09.

`<GENERO_COD>`, `<IDADE_MIN>` e `<IDADE_MAX>` são do **briefing do lançamento**, não constantes da casa.
Mulheres 26–60 foi o público da BNCC019 — não repita em outro lançamento sem confirmar.

`<PASTA_DRIVE>` e `<PLANILHA_CRIATIVOS>` acima são as do BNCC019. **Em lançamento novo, os dois vêm da
tarefa do ClickUp** — não reutilize os da ATV206.

Se algum placeholder não tem valor confirmado: **PARE E PERGUNTE.** Não invente ID, orçamento nem nome.

---

## 2. Estrutura-padrão a construir

Duas campanhas, mesmos criativos nas duas, ambas **ABO** (orçamento no conjunto), `buying_type = AUCTION`
e **sem `bid_strategy` em lugar nenhum**: o campo não é enviado, nem na campanha nem no conjunto, e a
API devolve `is_autobid: true` — que é exatamente o "maior volume (autobid)" do brief.

| # | Campanha | `objective` | `optimization_goal` do conjunto | `destination_type` |
|---|---|---|---|---|
| 01 | `[01] [<LANCAMENTO>] [LEMBRETE] [ENGAJAMENTO] [INTERACOES] [QUENTE] [AUTO]` | `OUTCOME_ENGAGEMENT` | `POST_ENGAGEMENT` | `ON_POST` |
| 02 | `[02] [<LANCAMENTO>] [LEMBRETE] [TRAFEGO] [PAGE VIEW] [QUENTE] [AUTO]` | `OUTCOME_TRAFFIC` | `LANDING_PAGE_VIEWS` | `WEBSITE` |

Na tela, a campanha 01 lê-se: Local da conversão = **No anúncio** · Tipo = **Interações** ·
Meta = **Maximizar interações**.

**Conjuntos — fase LEMBRETE** (um por dia de contagem regressiva). Padrão executado na ATV206:

| Sufixo do conjunto | Dia | Orçamento/dia **por campanha** |
|---|---|---|
| `FALTAM 03 DIAS` | D-3 | R$69 |
| `FALTAM 02 DIAS` | D-2 | R$69 |
| `E AMANHA` | D-1 | R$129 |
| `E HOJE` | D0 | R$193 |

**Escala da contagem:** o número de dias vem do briefing — **um conjunto por dia, até o D0**. Regras de
nome fixas: o D-1 é sempre `E AMANHA` (nunca `FALTAM 01 DIA`) e o D0 é sempre `E HOJE`. Os nomes de
D-4 e além **não estão definidos** neste manual: se o briefing pedir contagem maior que 3 dias,
**PARE E PERGUNTE** o nome antes de incluir no planejamento (o nome vira `utm_medium` e não se conserta).

**Conjuntos — fase EVENTO**: `AULA 01` … `AULA 05`, R$50/dia cada, um por dia de aula.
Na ATV206 eles não foram criados do zero: nasceram de **cópia na tela** de um conjunto
`… | E HOJE | MODELO`, trocando só o sufixo (regra do Gabriel). Este manual **não define** como esse
conjunto MODELO é criado, com qual orçamento, nem se ele permanece pausado. Duas saídas:
- criar os conjuntos de EVENTO **um a um pelo Passo 4**, como criação normal (caminho padrão para IA); ou
- se o Gabriel pedir o caminho da duplicação, **PARE E PERGUNTE** as regras do MODELO — e, depois de
  duplicar, **conferir início e término** de cada cópia (o Meta embaralha datas ao duplicar).

**Anúncios**: fase LEMBRETE = 3 por conjunto (1 vídeo + 2 imagens V1/V2), os mesmos nas 2 campanhas.
Fase EVENTO = 1 vídeo por conjunto (o vídeo da aula do dia).

Os orçamentos acima são o **histórico da ATV206**, não um default. Orçamento do lançamento novo vem
do briefing — ver portão 🔴 P3.

---

## 3. Nomenclatura (obrigatória)

### Campanha
```
[<NN>] [<LANCAMENTO>] [<FASE>] [<OBJETIVO>] [<OTIMIZACAO>] [<TEMPERATURA>] [AUTO]
```
`<NN>` sequencial · `<FASE>` = CAPTACAO / LEMBRETE / EVENTO · `<TEMPERATURA>` = QUENTE / FRIO ·
`AUTO` = posicionamentos automáticos.
Se a conta já tiver campanhas de fases anteriores **do mesmo lançamento**, o `<NN>` continua a
sequência (não reinicia em 01).

### Conjunto
```
<II> | CADASTRADOS <LANCAMENTO> | <IDADE_MIN>-<IDADE_MAX> | <GENERO> | ABO | PAGINA OBRIGADO | <VARIACAO>
```
`<II>` = índice do público, **dois dígitos** (`00` = público principal / Cadastrados; `01` = segundo
público, ex.: "VIU ADS E PAGE VIEW").
`<GENERO>` usa o token curto: **`M` = mulheres** (usado na ATV206). Token para homens ou público misto
não foi usado ainda — **PARE E PERGUNTE** antes de inventar.
`<VARIACAO>` = `FALTAM 03 DIAS`, `E AMANHA`, `E HOJE`, `AULA 01`… — é o que vira `utm_medium`.

### Anúncio
```
<ADV|ADI><NN>_<LANCAMENTO>_<LEM|EVEN|CAP>_<VARIACAO>_<DURACAO|VERSAO>
```
`ADV` = vídeo, `ADI` = imagem.

**`<NN>` = número do criativo, e a regra muda por fase:**
- **LEMBRETE — o número acompanha a contagem regressiva:** `ADV03` = faltam 3 dias, `ADV02` = faltam 2
  dias, `ADV01` = é amanhã.
- **EVENTO — o número é o da aula, não é contagem regressiva:**
  `ADV01_<LANCAMENTO>_EVEN_AULA 01_0.37` … `ADV05_<LANCAMENTO>_EVEN_AULA 05_1.00`.
- **D0 (`E HOJE`)** é o único dia sem número de contagem — o `<NN>` desse dia **não está definido aqui**:
  fechar com o Gabriel no planejamento de nomes (é a lacuna da seção 0).

`<DURACAO>` = duração do vídeo no formato **`m.ss`**: `0.53` = 53 segundos, `1.00` = 1 minuto exato.
`_V1` / `_V2` = versão da arte na imagem.

### Exemplo real e completo (ATV206, dia D-2)
```
Campanha: [01] [BNCC019] [LEMBRETE] [ENGAJAMENTO] [INTERACOES] [QUENTE] [AUTO]
Conjunto: 00 | CADASTRADOS BNCC019 | 26-60 | M | ABO | PAGINA OBRIGADO | FALTAM 02 DIAS
Anúncios: ADV02_BNCC019_LEM_FALTAM 02 DIAS_0.53
          ADI02_BNCC019_LEM_FALTAM 02 DIAS_V1
          ADI02_BNCC019_LEM_FALTAM 02 DIAS_V2
```

**O nome do anúncio deve ser idêntico ao nome do arquivo na biblioteca de mídia (sem extensão).**

### Por que cada bloco existe (use ao explicar o planejamento)

| Bloco | Por que |
|---|---|
| `[NN]` | ordena a lista no Ads Manager e dá apelido curto ("a 01") em conversa/relatório |
| `[<LANCAMENTO>]` | chave que amarra campanha ↔ criativo ↔ UTM ↔ planilha; sem ela não se separa lançamento na mesma conta |
| `[FASE]` | o mesmo público recebe mensagem diferente por fase; separar permite ligar/desligar a fase inteira |
| `[OBJETIVO]` | lê-se o objetivo sem abrir a campanha |
| `[OTIMIZACAO]` | o mesmo objetivo tem otimizações diferentes, e isso muda entrega e custo |
| `[TEMPERATURA]` | quente (já cadastrado) x frio (prospecção) decide orçamento e expectativa de CPA |
| `[AUTO]` | distingue de posicionamento manual |
| `<II>` | deixa óbvio qual é o público-base e ordena |
| `CADASTRADOS <LANCAMENTO>` | o público aparece no relatório sem abrir o conjunto |
| idade / gênero | segmentação é a variável mais testada; no nome dá pra comparar conjuntos |
| `ABO` | quem lê o relatório sabe onde o orçamento é controlado |
| `PAGINA OBRIGADO` | evita o erro clássico de mandar pra página errada |
| `<VARIACAO>` | diferencia os conjuntos irmãos e vira `utm_medium` |

---

## 4. Blocos verificados

### 4.1 Segmentação (idêntica em todos os conjuntos do lançamento)
```json
{
  "geo_locations": { "countries": ["BR"], "location_types": ["home", "recent"] },
  "genders": "<GENERO_COD>",
  "age_min": "<IDADE_MIN>",
  "age_max": "<IDADE_MAX>",
  "custom_audiences": [
    { "id": "<AUDIENCE_PIXEL_ID>" },
    { "id": "<AUDIENCE_LISTA_ID>" }
  ],
  "targeting_automation": { "advantage_audience": 0 }
}
```
- `advantage_audience: 0` = Advantage+ Audience **desligado**. Constante da casa — exigência do cliente.
- `location_types` com `["home","recent"]` é **obrigatório**: sem ele o conjunto nasce só com `["home"]`
  (opção aposentada) e trava a publicação com o erro #1870194.
- `genders`, `age_min` e `age_max` são **do briefing**. Na ATV206 foram `[2]`, `26` e `60` — histórico,
  não default. `genders` e as idades entram como número/array, não como string: substitua o placeholder
  pelo valor cru (`"genders": [2]`).

### 4.2 Agenda e orçamento do conjunto (janela de 24h cravada)

**Agenda — campos verificados: `start_time` e `end_time`**, em **ISO 8601 com o offset escrito na
string**:
```json
"start_time": "2026-09-19T00:00:00-03:00",
"end_time":   "2026-09-20T00:00:00-03:00"
```
O Meta devolve no formato `"2026-09-19T00:00:00-0300"`. **Com o offset explícito na string, o fuso
configurado na conta não interfere** — não é preciso conferir o fuso antes de montar a data.

Cada conjunto vai de **00h00 do seu dia até 00h00 do dia seguinte**. Conjunto com orçamento diário exige
**≥ 24h** de agenda — **23h59 é recusado** ("Campaign Schedule Is Too Short"). `<FIM>` é sempre o dia
seguinte a `<INICIO>`.

**Orçamento — `daily_budget` vai em CENTAVOS** (unidade menor da moeda da conta; a BNCC 03 é em **BRL**).
Multiplique o valor do briefing por 100 e envie inteiro, sem ponto nem vírgula:

| Valor no briefing | `daily_budget` |
|---|---|
| R$50,00 | `5000` |
| R$69,00 | `6900` |
| R$129,00 | `12900` |
| R$193,00 | `19300` |

**Demais campos do conjunto, verificados na ATV206:**
- `billing_event: "IMPRESSIONS"` — foi o valor usado em todos os conjuntos.
- `bid_strategy`: **não é enviado**. A resposta volta com `is_autobid: true` (= maior volume).
- `promoted_object` e `pacing_type`: **não são enviados** — não são necessários nesta configuração
  (Engajamento/`ON_POST` e Tráfego/`WEBSITE`). Se ainda assim uma chamada for recusada por falta de um
  deles, **PARE E PERGUNTE** com o erro exato; não chute valor.

### 4.3 Rastreamento do anúncio (site + offline)
```json
"tracking_specs": [
  { "action.type": ["offsite_conversion"], "fb_pixel": ["<PIXEL_ID>"] },
  { "action.type": ["offline_conversion"], "dataset": ["<PIXEL_ID>"] }
]
```
Array literal aceito pela API na ATV206 — o **mesmo** `<PIXEL_ID>` (`642103307974769`) entra nos dois
lugares, em `fb_pixel` e em `dataset`. Sem isso o anúncio nasce com rastreamento desligado. Enviar já na
criação do anúncio (`ads_create_ad`, Passo 6).

### 4.4 Desligar os recursos de IA

O **criativo** leva `degrees_of_freedom_spec` com os **13 recursos de IA em `OPT_OUT`, um por um**. Ele é
enviado em `ads_create_creative` (Passo 5), não na criação do anúncio. Objeto literal aceito na ATV206 —
envie exatamente assim:

```json
{
  "creative_features_spec": {
    "image_touchups": { "enroll_status": "OPT_OUT" },
    "image_brightness_and_contrast": { "enroll_status": "OPT_OUT" },
    "text_optimizations": { "enroll_status": "OPT_OUT" },
    "enhance_cta": { "enroll_status": "OPT_OUT" },
    "video_auto_crop": { "enroll_status": "OPT_OUT" },
    "add_text_overlay": { "enroll_status": "OPT_OUT" },
    "image_animation": { "enroll_status": "OPT_OUT" },
    "adapt_to_placement": { "enroll_status": "OPT_OUT" },
    "media_type_automation": { "enroll_status": "OPT_OUT" },
    "inline_comment": { "enroll_status": "OPT_OUT" },
    "image_templates": { "enroll_status": "OPT_OUT" },
    "image_uncrop": { "enroll_status": "OPT_OUT" },
    "site_extensions": { "enroll_status": "OPT_OUT" }
  }
}
```

**Nunca inclua `standard_enhancements` (depreciado) nem `music` (inválido)** — qualquer um dos dois
derruba a chamada. **Não acrescente recurso fora dessa lista de 13** e não improvise nome: nome errado
derruba a chamada do mesmo jeito.

`ads_get_ad_entities` **não lê** esse campo — a conferência é na tela (ver P4).

Se a chamada recusar um dos 13 nomes, **remova só o recusado**, siga, e registre o nome e o erro exato
no comentário do ClickUp — a lista muda com o tempo.

### 4.5 Parâmetros de URL (UTM) — para colar NA TELA, não por API
```
src=MTADS-<LANCAMENTO>_{{campaign.name}}_{{adset.name}}_{{ad.name}}_{{campaign.id}}_{{adset.id}}_{{ad.id}}&utm_source=MTADS-<LANCAMENTO>&utm_medium={{adset.name}}&utm_content={{ad.name}}&utm_campaign={{campaign.name}}&utm_term={{campaign.id}}_{{adset.id}}_{{ad.id}}
```
`utm_medium` = conjunto · `utm_content` = anúncio · `utm_campaign` = campanha. Os IDs no fim do `src`
e no `utm_term` resolvem nomes repetidos ou renomeados.

### 4.6 Pegadinha de nomenclatura: `ad_set` × `adset`

Os dois nomes existem, em tools diferentes, e **não são intercambiáveis** — trocar um pelo outro dá erro
de validação:

| Tool | Parâmetro | Valor do conjunto |
|---|---|---|
| `ads_update_entity` / `ads_activate_entity` | `entity_type` | **`"ad_set"`** (com underscore) |
| `ads_get_ad_entities` | `level` | **`"adset"`** (sem underscore) |

Em `ads_get_ad_entities`, `level` aceita `"campaign"`, `"adset"` ou `"ad"`.

---

## 5. Ordem de execução

### 🔴 P-1 — Pré-requisitos do lançamento
Este processo cobre **apenas as fases LEMBRETE e EVENTO, para público quente já cadastrado**.
Antes de começar, confirme que **já existem os públicos de cadastrados do lançamento** (Passo 2).
Se não existirem, **PARE**: captação e criação de públicos são outros processos, fora deste manual.
Não há caminho local resolvido para o processo de criação de públicos — **pergunte ao Gabriel** o
número da atividade / Doc no ClickUp antes de seguir por conta própria.

### 🔴 P0 — Ler a tarefa do ClickUp antes de qualquer coisa
Workspace `9011482982`. Leia a tarefa **inteira + todos os comentários, em ordem** com
`clickup_get_task` e `clickup_get_task_comments` — o gestor corrige por lá, e o Claude do Rafael pode
ter avançado desde a última leitura. A tarefa da ATV206 (referência deste manual) é `868m6fqxk`.

Se o Gabriel não mandar o link nem o número: procure com `clickup_search` por `[ATV` + nome do
cliente/lançamento. **Mais de uma candidata → pergunte, não escolha.**
É **dessa leitura** que sai o `<LANCAMENTO>`, a `<PASTA_DRIVE>` e a `<PLANILHA_CRIATIVOS>`, além de
estrutura, orçamento, público e prazo. Se faltar qualquer um deles, pergunte antes de tocar na conta.

### Passo 1 — Mídia
1. Baixe os criativos da `<PASTA_DRIVE>` do lançamento (vem da tarefa do ClickUp; na ATV206/BNCC019 foi
   `https://drive.google.com/drive/folders/1oEclfIocdYFrikqieURi-fLWu8DhUkIG`).
2. Renomeie no padrão da seção 3 (`ADV`/`ADI` + lançamento + fase + variação).
3. Suba na biblioteca de mídia da conta com `ads_creative_upload_media`.
4. Puxe `<VIDEO_ID>` / `<IMAGE_HASH>` (`ads_get_ad_videos`, `ads_get_ad_images`).
5. Pegue o `<THUMB_URL>` no campo `picture` do vídeo. **Vídeo recém-enviado pode ainda estar
   processando** — se o `picture` não vier, aguarde e consulte de novo; não siga sem ele, porque o
   criativo de vídeo é recusado sem thumbnail.
6. Registre o Video ID / Image Hash de cada peça na `<PLANILHA_CRIATIVOS>` do lançamento (na
   ATV206/BNCC019: `106npWr_HhP78piAK1yTHWqSMa-U25pb0FkoB4KqiEEE`).

**Como saber que deu certo:** cada arquivo tem `video_id` ou `image_hash` anotado, vídeo com `picture`
disponível, e o nome do arquivo (sem extensão) é exatamente o nome que o anúncio vai ter.

### 🔴 P1 — Copy aprovada pelo cliente
Escreva legenda (primary text), título (headline) e descrição (link description). Se o lançamento é
reedição, recupere o texto real dos anúncios antigos e troque só datas/temas — estrutura aprovada não
se reinventa. **Envie pro cliente aprovar. Não monte criativo com copy não aprovada.**

Regras de campo:
- **Legenda:** uma por dia/variação.
- **Título:** curto, muda por dia ("Faltam 2 dias!", "É amanhã!", "É hoje!") ou fixo por arte nas
  imagens ("Evento 100% Online e Gratuito").
- **Descrição:** **uma só, fixa**, até ~125 caracteres (o Meta corta). A usada na ATV206, com 122
  caracteres: "Participe da Jornada BNCC na Prática: uma semana de aulas gratuitas para entender de
  fato a BNCC e colocá-la em prática."

### Passo 2 — Público
Liste com `ads_get_ad_account_custom_audiences` e localize os dois públicos do lançamento:
- **pixel**, evento `Lead`, `retention_seconds` 3888000 (45 dias). Padrão de nome na ATV206:
  `[SITE] Lead | <LANCAMENTO> - 45D`
- **lista de e-mails**, 180 dias. Padrão de nome na ATV206: `[LISTA] [dd.mm] LEADS <LANCAMENTO>`

Confira tamanho e status de cada um.
**Se não achar os dois, ou se aparecer mais de um candidato para qualquer um deles: PARE E PERGUNTE.**
Não escolha por semelhança de nome — público errado entrega pro público errado e só se descobre depois.
Qual valor de status conta como "pronto para uso" e qual tamanho mínimo reprova **não estão definidos
aqui**: leve os candidatos encontrados (nome, ID, tamanho, status) pro Gabriel decidir.

**Como saber que deu certo:** os dois IDs estão confirmados pelo Gabriel ou batem exatamente com o
padrão de nome do lançamento.

### 🔴 P2 — Planejamento de nomes aprovado
Monte a tabela campanha → conjuntos → anúncios com os nomes **completos** (as três linhas, como no
exemplo da seção 3), apresente e **espere o OK explícito**. **Nada é criado antes disso** — o nome
entra na UTM na publicação e renomear não conserta.

### 🔴 P3 — Orçamento definido
Quanto gastar por dia **nunca é decisão da IA**. Se `<ORCAMENTO_DIA>` de algum conjunto não estiver
definido no briefing, **PARE E PERGUNTE**. Os valores da ATV206 (R$69 / R$69 / R$129 / R$193 no lembrete
e R$50 por aula no evento) são **histórico, não default**.

Ao apresentar orçamento pro Gabriel/cliente, deixe explícito: **o valor da tabela é por conjunto E por
campanha**. Como são duas campanhas com os mesmos conjuntos, o valor do dia é **gasto duas vezes** —
D-3 a R$69 = **R$138/dia** no total. Apresente sempre os dois números (por campanha e total do dia).
Na hora de converter para `daily_budget`, lembre que o campo é **em centavos** (R$69 → `6900`, seção 4.2).

### Passo 3 — Campanhas (as duas)
Crie **as duas campanhas primeiro**, 01 e 02, antes de partir para os conjuntos.
`ads_create_campaign` com o nome aprovado, `objective` da linha correspondente da tabela da seção 2,
`buying_type: "AUCTION"`, **sem orçamento na campanha** (ABO), **sem `bid_strategy`**, `status: "PAUSED"`.

**Ordem de construção do lançamento inteiro:**
duas campanhas → conjuntos de cada campanha → criativos (**uma vez só**, compartilhados) →
anúncios nas duas campanhas usando o mesmo `creative_id`.

**Como saber que deu certo:** a tool devolve `campaign_id` para cada uma. Confira o `status` com
`ads_get_ad_entities`, que recebe: `ad_account_id`, `level` (`"campaign"` aqui), `object_ids` (array de
IDs), `fields` (array de campos) e `object_state` — que aceita `"live"` ou `"draft"`, **nunca `"all"`**.
`date_preset` (ex.: `"today"`, `"maximum"`) é opcional e serve para trazer métricas.

### Passo 4 — Conjuntos
Para cada conjunto, `ads_create_ad_set` com os parâmetros verificados na ATV206:

| Parâmetro | Valor |
|---|---|
| `ad_account_id` | `<ACCOUNT_ID>` (só o número, sem `act_`) |
| `campaign_id` | o da campanha criada no Passo 3 |
| `ad_set_name` | nome aprovado (seção 3) |
| `billing_event` | `"IMPRESSIONS"` |
| `optimization_goal` | da tabela da seção 2 (`POST_ENGAGEMENT` ou `LANDING_PAGE_VIEWS`) |
| `destination_type` | da tabela da seção 2 (`ON_POST` ou `WEBSITE`) |
| `daily_budget` | `<ORCAMENTO_DIA>` **em centavos** (4.2) |
| `targeting` | bloco 4.1 |
| `start_time` / `end_time` | ISO 8601 com offset, janela de 24h (4.2) |

⚠️ `status` **não fez parte dessa chamada** na ATV206. Logo depois de criar, confira o `status` do
conjunto com `ads_get_ad_entities` (`level: "adset"`) e, se ele não estiver `PAUSED`, pause com
`ads_update_entity` (`entity_type: "ad_set"`, `fields: {"status":"PAUSED"}`) **antes** de seguir — a
regra da casa é tudo nascer pausado.

**Fallback do erro "Parent campaign uses CBO… do not pass daily_budget" numa campanha ABO:**
esse erro aparece quando a campanha-mãe tem `bid_strategy` no nível da campanha — o que acontece em
campanha criada **na tela**; é isso que faz a ferramenta tratá-la como CBO e recusar `daily_budget` no
conjunto. O contorno cria conjunto **e anúncio juntos**, então ele **depende de um criativo já existir**.
Se o erro aparecer:
1. **Pule para o Passo 5** e crie o criativo do primeiro anúncio desse conjunto.
2. Volte e chame `ads_create_ad` com `ad_set_id: "0"`, `creative: {"creative_id": "<ID>"}` recém-criado
   e o `adset_spec` carregando os campos do conjunto. **Chaves aceitas dentro do `adset_spec`**
   (verificadas): `campaign_id`, `name`, `billing_event`, `optimization_goal`, `destination_type`,
   `daily_budget`, `targeting`, `start_time`, `end_time`, `status`.
   Repare que aqui o nome do conjunto vai em **`name`** (não `ad_set_name`) e que `status` **é** aceito —
   mande `"PAUSED"`.
3. Os **outros 2 anúncios** do conjunto entram normalmente no Passo 6, usando o `ad_set_id` devolvido
   por essa chamada.

**Como saber que deu certo:** `ads_get_ad_entities` com `level="adset"` devolve o `targeting` inteiro —
confira localização (`home` + `recent`), públicos, idade, gênero e `advantage_audience: 0`, além de
início e término.

### Passo 5 — Criativos
`ads_create_creative`, com os parâmetros verificados na ATV206:

| Parâmetro | O que entra |
|---|---|
| `ad_account_id` | `<ACCOUNT_ID>` (sem `act_`) |
| `name` | nome do criativo |
| `page_id` | `<PAGE_ID>` |
| `image_hash` **ou** `video_id` + `image_url` | `<IMAGE_HASH>` para imagem; para vídeo, `<VIDEO_ID>` + `image_url: "<THUMB_URL>"` |
| `link_url` | `<LINK_URL>` |
| `call_to_action_type` | `"LEARN_MORE"` |
| `degrees_of_freedom_spec` | objeto dos 13 `OPT_OUT` (4.4) |

E os três textos aprovados:

| Texto | Rótulo na tela do Ads Manager | Nome do parâmetro na tool |
|---|---|---|
| legenda (primary text) | "Texto principal" | `message` |
| título | "Título" | `headline` |
| descrição | "Descrição do link" | `description` |

**Vídeo exige thumbnail** — use o 1º frame (campo `picture` do vídeo) em `image_url`. Sem ela o criativo
de vídeo é recusado.

Confira o texto antes de mandar: **criativo não é editável** — se saiu errado, tem que recriar.

**Quantos criativos criar:** um criativo **por combinação variação (dia) × peça**, porque a copy muda
por dia. O mesmo criativo é reutilizado **nas duas campanhas**, pelo `creative_id` — **nunca entre dias
diferentes** (senão sobe "É hoje!" no D-3).
Conta da ATV206, fase LEMBRETE, para conferir o próprio trabalho:
**4 dias × 3 peças = 12 criativos → usados em 2 campanhas = 24 anúncios.**

### Passo 6 — Anúncios
`ads_create_ad` com os parâmetros verificados na ATV206:

| Parâmetro | O que entra |
|---|---|
| `ad_account_id` | `<ACCOUNT_ID>` (sem `act_`) |
| `ad_set_id` | ID do conjunto (ou `"0"` no fallback do Passo 4) |
| `ad_name` | nome aprovado (seção 3) |
| `creative` | **objeto**: `{"creative_id": "<ID>"}` |
| `tracking_specs` | bloco 4.3 |
| `adset_spec` | **opcional** — só no fallback do Passo 4 |

⚠️ **Parâmetros recusados com erro imediato:** `adset_id` (o certo é `ad_set_id`), `name` (o certo é
`ad_name`), `creative_id` solto (tem que ir dentro do objeto `creative`) e `status` — a criação do
anúncio **não** aceita `status`. Se o anúncio precisar ficar pausado, faça isso depois com
`ads_update_entity` (`fields: {"status":"PAUSED"}`).

O `degrees_of_freedom_spec` **não vai aqui** — ele foi enviado no criativo (Passo 5).
**Teto de 50 anúncios por conjunto**, contando os pausados.

**Como saber que deu certo:** `ads_get_ad_entities` (`level: "ad"`) devolve o anúncio apontando para o
`creative_id` certo, com o nome exato aprovado.
⚠️ `ads_get_ad_entities` **não lê** `tracking_specs` nem `degrees_of_freedom_spec` — esses dois só se
conferem na tela (ver P4).

### Passo 7 — UTM (na tela)
**Quem executa:** a IA monta e entrega o bloco 4.5 já preenchido com o `<LANCAMENTO>`. Colar na tela é
tarefa operacional — a IA pode abrir o Ads Manager e colar, mas **nunca clica em "Publicar" sem ordem
explícita do Gabriel**. Se não houver ordem, entregue o bloco pronto e pare aqui.

Caminho: Ads Manager → **filtrar pela campanha do lançamento** → selecionar os anúncios → Editar →
"Parâmetros de URL" → colar o bloco 4.5 → Publicar.

🔴 **Portão antes do "Publicar":** esta é a única ação do manual que publica **alteração em massa**.
Confira que a seleção contém **só** os anúncios deste lançamento — nenhum anúncio de outro lançamento,
nenhum de campanha ativa. Conte os anúncios selecionados e compare com o número planejado.
**Na dúvida, PARE E PERGUNTE.**

**Como saber que deu certo:**
1. abrir um anúncio e ver os parâmetros gravados com as macros `{{…}}` intactas (não URL-encodadas); e
2. **reconferir, nos anúncios editados, o que a tela costuma mexer:** CTA = "Saiba mais" (não "Ver
   detalhes"), aprimoramentos de IA todos desligados e rastreamento (site + offline) marcados —
   a regra da seção 6 vale para **qualquer** edição feita na tela, inclusive esta.

### 🔴 P4 — Checklist antes de ativar
Rode a seção 7 inteira. Ela está dividida em **"confere por API"** e **"só confere na tela"**.
A IA roda a primeira lista e **entrega a segunda pronta** (item por item, com o nome do anúncio/conjunto)
para quem vai olhar a tela — Gabriel ou a própria IA pelo navegador, em tarefa operacional.
**Qualquer item não conferido = não ativa.**

### 🔴 P5 — Ativação só com ordem explícita
Ative na ordem **campanha → conjunto → anúncio** com `ads_activate_entity`, que recebe `ad_account_id`,
`entity_id` e `entity_type` — e o conjunto aqui é **`"ad_set"`**, com underscore (ver 4.6).
Ativar o pai não ativa os filhos; filho ativo com pai pausado não entrega. Conjunto com data futura fica
"agendado". **Nunca ative por iniciativa própria.**

Para pausar ou renomear, o caminho é `ads_update_entity`: `ad_account_id`, `entity_id`, `entity_type` e
`fields` (objeto com os campos da API — ex.: `{"status":"PAUSED"}` ou `{"name":"ZZZ_…"}`).
**Só `ads_activate_entity` reativa** — `ads_update_entity` não.

### Passo 8 — Registro
Comentário assinado no ClickUp (IDs criados, decisões, pendências, erros de API que apareceram) + base
de conhecimento + aviso pro gestor.

---

## 6. Erros conhecidos e a receita

| Sintoma | O que fazer |
|---|---|
| Erro **#1870194** "opção de direcionamento por localização removida" trava a publicação | conjunto criado por API sem `location_types` nasce com `["home"]`, opção aposentada. Sempre enviar `"location_types": ["home","recent"]`. Se o aviso voltar numa publicação: na tela, Editar → Locais → remover e re-adicionar Brasil, publicando junto com a edição |
| Objetivo Engajamento + anúncio com link é recusado | usar `destination_type: "ON_POST"`. **`ON_AD` não existe**; sem destino → "promoted object required"; `WEBSITE` → "performance goal isn't available" |
| "Campaign Schedule Is Too Short" | conjunto com orçamento diário exige ≥ 24h de agenda: 00h00 → 00h00 do dia seguinte. 23h59 é recusado. Também impede encurtar conjunto que já está rodando |
| A chamada do **criativo** quebra ao desligar IA | `standard_enhancements` está **depreciado** e `music` é **inválido** — remover os dois do `degrees_of_freedom_spec`; manter exatamente os 13 recursos válidos em `OPT_OUT` (objeto literal em 4.4), sem acrescentar nenhum outro |
| Orçamento saiu 100× maior ou menor | `daily_budget` é em **centavos** (4.2): R$69 → `6900`, não `69` nem `6.900` |
| UTM não grava | `url_tags` é recusado pela tool e `ads_creative_update` não edita URL; UTM embutida no `link_url` é gravada URL-encodada (`%7B%7Bad.id%7D%7D`) e as macros não resolvem. Colar na tela (Passo 7) |
| Recursos de IA voltam ligados | `degrees_of_freedom_spec` com os 13 em `OPT_OUT`, um por um, no criativo; conferir na tela depois |
| Rastreamento nasce desligado | enviar o bloco 4.3 já na criação do anúncio |
| 🔴 Campanha ativa **pausa sozinha** ao ser editada | `ads_update_entity` em campanha viva força `status: PAUSED`, e a própria tool recusa reativar (só `ads_activate_entity` reativa). **Nunca editar campanha ativa por API.** Em ABO a data da campanha é derivada dos conjuntos — não precisa editar |
| Vídeo recusado na criação do criativo | thumbnail é obrigatória: usar o 1º frame (`picture` do vídeo) como `image_url` |
| "Parent campaign uses CBO… do not pass daily_budget" numa campanha ABO | campanha criada **na tela** costuma trazer `bid_strategy` no nível da campanha, e é isso que faz a ferramenta achar que é CBO. Contorno: criar conjunto + anúncio juntos — `ads_create_ad` com `ad_set_id: "0"` + `adset_spec` — **ver o fallback completo no Passo 4**, que depende de criativo pronto |
| `ads_create_ad` recusa o parâmetro na hora | é nome errado, não campo faltando: `ad_set_id` (não `adset_id`), `ad_name` (não `name`), `creative: {"creative_id":"…"}` (não `creative_id` solto). `status` **não** é aceito nessa chamada — pausar depois com `ads_update_entity` |
| Erro de validação em `entity_type` / `level` | `"ad_set"` em `ads_update_entity` e `ads_activate_entity`; `"adset"` em `ads_get_ad_entities` (ver 4.6). Em `ads_get_ad_entities`, `object_state` aceita `"live"` ou `"draft"` — **não** `"all"` |
| Não dá pra conferir o que foi gravado | `ads_get_ad_entities` (`level="adset"`) lê o `targeting` inteiro, mas **não lê** `tracking_specs` nem `degrees_of_freedom_spec` — conferir esses dois na tela |
| Criativo errado | criativo não é editável: recriar |
| Anúncios param de entrar no conjunto | teto silencioso de **50 anúncios por conjunto** (inclui pausados): novo conjunto, ou limpar pausados |
| Precisa apagar | `ads_update_entity` com `fields: {"status":"DELETED"}` apaga **anúncio**; `entity_type` do conjunto é `"ad_set"` (não `"adset"`); **não existe apagar campanha/conjunto pela API** — renomear com prefixo `ZZZ_` (`fields: {"name":"ZZZ_…"}`) + pausar, e apagar na tela, **com ordem do Gabriel** |
| Datas embaralhadas depois de duplicar | ao duplicar um conjunto, o Meta pode alterar/remover a data de término: conferir início e término de cada conjunto duplicado |
| Anúncio recriado na tela volta com "Ver detalhes" | trocar para "Saiba mais" e reconferir CTA, IA e rastreamento depois de **qualquer** edição feita na tela |

---

## 7. Checklist de conferência (antes de ativar qualquer anúncio)

### 7.1 Confere por API (a IA roda)
- [ ] Nome da campanha, do conjunto e de **cada anúncio** exatamente como foi aprovado
- [ ] Objetivo e otimização certos (Engajamento → `POST_ENGAGEMENT` / `ON_POST`; Tráfego → `LANDING_PAGE_VIEWS` / `WEBSITE`)
- [ ] Público correto nos conjuntos, **`advantage_audience: 0`**, idade e gênero certos
- [ ] Localização gravada com `["home","recent"]` (sem aviso #1870194)
- [ ] Orçamento **em centavos** (valor do briefing × 100) e **datas de início/término** de cada conjunto (janela de 24h, um dia por conjunto)
- [ ] Nenhum conjunto de dias diferentes rodando ao mesmo tempo (sem sobreposição)
- [ ] Cada anúncio aponta para o `creative_id` certo (o do seu dia)
- [ ] Tudo em `PAUSED` — inclusive os anúncios, que não aceitam `status` na criação

### 7.2 Só confere na tela (entregar esta lista pronta a quem vai olhar)
- [ ] **Abrir a página de destino no navegador** e confirmar que é a certa
- [ ] CTA = "Saiba mais" em todos
- [ ] Aprimoramentos de IA **todos desligados** (a API não lê `degrees_of_freedom_spec`)
- [ ] Rastreamento: Eventos do site + Eventos offline no pixel certo (a API não lê `tracking_specs`)
- [ ] Legenda / título / descrição = os textos aprovados
- [ ] UTM colada e publicada, com as macros `{{…}}` intactas

A IA entrega 7.2 item por item, nomeando o anúncio/conjunto a olhar, e **espera o retorno**.
Item não conferido = **não ativa**.

### As 5 correções do gestor que originaram metade deste checklist
1. Página de destino errada (mandava pra home em vez de `/wts`) → abrir a página, sempre.
2. CTA "Ver detalhes" → na VOA é sempre "Saiba mais".
3. Aprimoramentos de criativo por IA ligados → "elas não querem nada de IA", todos desligados.
4. Rastreamento desligado no anúncio → Eventos do site + Eventos offline sempre marcados.
5. Datas embaralhadas ao duplicar → conferir início e término depois de duplicar.

---

## 8. O que a IA NÃO faz sozinha

- **Tocar em campanha, conjunto ou anúncio que não seja deste lançamento** — nem para editar, nem para
  pausar, nem para renomear, nem incluir na seleção de uma edição em massa.
- **Clicar em "Publicar" numa edição em massa** (Passo 7) sem ordem explícita.
- **Gerar token ou credencial** (Meta, Facebook App, OAuth) — só o dono da conta.
- **Aprovar copy** — legenda, título e descrição passam pelo cliente antes de virar criativo.
- **Ativar campanha, conjunto ou anúncio** sem ordem explícita.
- **Apagar campanha ou conjunto** — a API nem permite; na tela, só com ordem do Gabriel.
- **Definir orçamento** — vem do briefing, nunca da IA.
- **Editar campanha ativa por API** — pausa a campanha.
- **Chutar nome de campo, valor ou recurso de IA** — o que está verificado está neste manual; o que não
  está (seção 0) se pergunta. Campo recusado pela API vira registro no ClickUp e pergunta, não tentativa
  às cegas.

---

## 9. O que este processo não cobre

- Campanha de **captação** (público frio, interesses, criativos de topo) — outro processo.
- **Criação de públicos** — outro processo. Não há caminho local resolvido: pergunte ao Gabriel o
  número da atividade / Doc no ClickUp.
- **Aprovação de copy pelo cliente** — fluxo do time de conteúdo.
