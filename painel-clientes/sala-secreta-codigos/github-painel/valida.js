const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
scripts.forEach((s,i)=>{ try{ new vm.Script(s); }catch(e){ console.log('SYNTAX script',i,e.message); process.exit(1);} });
const shim=scripts.find(s=>s.includes('var DATA ='));
const ctx={console,setTimeout}; vm.createContext(ctx); vm.runInContext(shim,ctx);
const M=require('../code_dash.js'), D=require('../dash_data.json');
function resumo(o){
  const cad={}; o.cadastros.forEach(x=>{const k=x.camp+'|'+x.origem; cad[k]=cad[k]||[0,0,0]; cad[k][0]+=x.cadastros; cad[k][1]+=x.grupo; cad[k][2]+=x.clint;});
  return JSON.stringify({t:o.trafego, cri:o.criativos.map(c=>[c.nome,c.leads,c.investimento.toFixed(2),!!c.link]), salas:o.salas, v:o.vendas, au:o.audiencia,
    camps:o.campanhas, cad, det:o.detalhe.length, serie:o.serie.length});
}
let falhas=0;
[['2026-10-17','2026-11-15'],['2026-11-01','2026-11-16'],['2026-01-01','2026-12-31'],['2026-08-27','2026-09-30']].forEach(([a,b])=>{
  const o1=M.computeDashboard_(D,M.toDate_(a),M.toDate_(b));
  const o2=vm.runInContext(`computeDashboard_(DATA,parseIso_(${JSON.stringify(a)}),parseIso_(${JSON.stringify(b)}))`,ctx);
  const r1=JSON.parse(resumo(o1)), r2=JSON.parse(resumo(o2));
  // links: a cópia tem os links extras da planilha de criativos
  r1.cri.forEach(c=>c[3]=null); r2.cri.forEach(c=>c[3]=null);
  const round=x=>JSON.stringify(x,(k,v)=>typeof v==='number'?Math.round(v*100)/100:v);
  const ok=round(r1)===round(r2);
  if(!ok){falhas++; for(const k of Object.keys(r1)) if(round(r1[k])!==round(r2[k])) console.log('DIFERE',a,b,k, round(r1[k]).slice(0,300),'\n   vs',round(r2[k]).slice(0,300));}
  const c=o2.cadastros.reduce((s,x)=>s+x.cadastros,0), g=o2.cadastros.reduce((s,x)=>s+x.grupo,0);
  console.log(a,b, ok?'IGUAL':'DIFERENTE', 'inv',o2.trafego.investimento.toFixed(0),'leads',o2.trafego.leads,'cad',c,'grupo',g,'sem link',o2.criativos.filter(x=>!x.link).map(x=>x.nome.slice(0,5)).join(','));
});
// sem dados pessoais
const sample=html.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/g)||[];
console.log('emails no html:', sample.length, sample.slice(0,5));
console.log('telefones (10+ dígitos seguidos, fora IDs Meta):', (html.match(/\b\d{10,11}\b/g)||[]).length);
process.exit(falhas?1:0);
