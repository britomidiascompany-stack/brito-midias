// Uso: node calcula.js <scratchpad> <saida.json>
// Lê dash_data.json (xlsx2json.py), code_dash.js (cópia do Code.gs) e periodos.json. Só sai número agregado, sem dado pessoal.
const S=process.argv[2], fs=require('fs');
const M=require(S+'/code_dash.js'), D=require(S+'/dash_data.json'), CFG=JSON.parse(fs.readFileSync(__dirname+'/periodos.json','utf8'));
const AUD=CFG.publico||{}, IG=CFG.instagram||[], RUINS=new Set(CFG.diasGrupoComFalha||[]);
const pag=n=>{const m=/\[PAGINA ([ABC])\]/.exec(n||'');return m?m[1]:''};
const addDia=(s,n)=>{const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
function met(a,b){
  const o=M.computeDashboard_(D,M.toDate_(a),M.toDate_(b)),t=o.trafego,nomes={};
  o.campanhas.forEach(c=>nomes[c.cod]=c.nome);
  const camp={},pags={},cri={},org={},Z=()=>({inv:0,impr:0,clk:0,lpv:0,leads:0,cad:0,grp:0});
  o.detalhe.forEach(x=>{const c=camp[x.camp]=camp[x.camp]||Z(),p=pags[pag(nomes[x.camp])||'?']=pags[pag(nomes[x.camp])||'?']||Z();
    [c,p].forEach(k=>{k.inv+=x.investimento;k.impr+=x.impressoes;k.clk+=x.cliques;k.lpv+=x.lpv;k.leads+=x.leads});
    const r=cri[x.criativo]=cri[x.criativo]||{inv:0,impr:0,clk:0,leads:0};r.inv+=x.investimento;r.impr+=x.impressoes;r.clk+=x.cliques;r.leads+=x.leads});
  const g={cadP:0,grpP:0,cadO:0,grpO:0,cadS:0,grpS:0},v={dias:0,inv:0,cadP:0,grpP:0,cadO:0,grpO:0,cadS:0,grpS:0};
  o.cadastros.forEach(x=>{const tp=x.origem==='pago'?'P':(x.origem==='sem_utm'||x.origem==='outro_funil'?'S':'O');
    g['cad'+tp]+=x.cadastros;g['grp'+tp]+=x.grupo;
    if(!RUINS.has(x.data)){v['cad'+tp]+=x.cadastros;v['grp'+tp]+=x.grupo}
    if(tp==='P'){const c=camp[x.camp]=camp[x.camp]||Z();c.cad+=x.cadastros;c.grp+=x.grupo;const k=pag(nomes[x.camp])||'?';const p=pags[k]=pags[k]||Z();p.cad+=x.cadastros;p.grp+=x.grupo}
    else if(tp==='O'){const r=org[x.origem]=org[x.origem]||[0,0];r[0]+=x.cadastros;r[1]+=x.grupo}});
  let dias=0;for(let d=a;d<=b;d=addDia(d,1)){dias++;if(!RUINS.has(d))v.dias++}
  o.serie.forEach(x=>{if(!RUINS.has(x.data))v.inv+=x.investimento});
  const cs=Object.keys(cri).filter(k=>cri[k].inv>=5).map(k=>({n:k,...cri[k]})).sort((x,y)=>y.inv-x.inv).slice(0,7);
  const salas=[];for(const c of D.consolidado.slice(11)){let d=String(c[0]);const m=/^(\d\d)\/(\d\d)\/(\d{4})/.exec(d);if(m)d=`${m[3]}-${m[2]}-${m[1]}`;d=d.slice(0,10);if(/^\d{4}-/.test(d))salas.push({d,tema:c[2],com:+c[12]||0,pico:+c[13]||0,lanc:[15,16,17,18,20,21,22].some(i=>c[i]!==''&&c[i]!=null),ws:+c[15]||0,gr:+c[16]||0,pl:+c[17]||0,ft:+c[18]||0,apl:+c[20]||0,m3:+c[21]||0,m6:+c[22]||0,rec:+c[29]||0})}
  return {a,b,dias,inv:t.investimento,impr:t.impressoes,clk:t.cliques,lpv:t.lpv,leads:t.leads,...g,v,camp,pags,cri:cs,org,nomes:Object.fromEntries(Object.keys(camp).map(c=>[c,nomes[c]||''])),aud:AUD[a+'_'+b]||null,
    ig:IG.length&&a>=CFG.igDesde?IG.filter(p=>p.d>=a&&p.d<=b):null,_s:salas};
}
const out={atualizado:CFG.atualizado,corte:CFG.corte,teto:CFG.teto,imposto:CFG.imposto,igLido:CFG.igLido,periodos:[]};
CFG.periodos.forEach(p=>{
  const cur=met(...p.cur),prev=met(...p.prev),tr=(p.trend||[]).map(([l,a,b])=>({l,m:(a===p.cur[0]&&b===p.cur[1])?cur:(a===p.prev[0]&&b===p.prev[1])?prev:met(a,b)}));
  const S2=cur._s;const pega=ds=>ds.map(d=>S2.find(s=>s.d===d)).filter(Boolean);
  const salaTrend=S2.filter(s=>s.pico>0&&s.d<=p.salas[p.salas.length-1]).sort((x,y)=>x.d<y.d?-1:1).slice(-5);
  const limpa=m=>{const c={...m};delete c._s;return c};
  out.periodos.push({id:p.id,rot:p.rot,sub:p.sub,curL:p.curL,prevL:p.prevL,porDia:!!p.porDia,aviso:p.aviso||'',cur:limpa(cur),prev:limpa(prev),trend:tr.map(x=>({l:x.l,m:limpa(x.m)})),salas:pega(p.salas),salasPrev:pega(p.salasPrev),salaTrend});
});
const mes=met(...CFG.mes);out.mes={inv:mes.inv,diasRest:CFG.mesDiasRestantes,ate:CFG.mes[1]};
fs.writeFileSync(process.argv[3],JSON.stringify(out));
out.periodos.forEach(p=>console.log(p.id,p.cur.inv.toFixed(2),p.cur.cadP,p.cur.grpP,p.cur.cadO,p.cur.grpO,'|',p.prev.inv.toFixed(2),p.prev.cadP,p.prev.grpP,p.prev.cadO,p.prev.grpO,'v',JSON.stringify(p.prev.v),'salas',p.salas.map(s=>s.pico),p.salasPrev.map(s=>s.pico)));
