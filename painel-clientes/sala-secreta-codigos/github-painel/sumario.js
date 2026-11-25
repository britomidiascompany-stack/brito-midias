<script>
// sumário lateral: rolagem suave e item ativo conforme a rolagem
(function(){
  var links=[].slice.call(document.querySelectorAll('#sumario a'));
  var reduz=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ativa(id){links.forEach(function(a){var on=a.getAttribute('data-alvo')===id;a.classList.toggle('ativo',on);
    if(on&&window.innerWidth<1180&&a.scrollIntoView){try{a.scrollIntoView({block:'nearest',inline:'center'});}catch(e){}}});}
  links.forEach(function(a){a.addEventListener('click',function(e){var alvo=document.getElementById(a.getAttribute('data-alvo'));
    if(!alvo)return;e.preventDefault();alvo.scrollIntoView({behavior:reduz?'auto':'smooth',block:'start'});ativa(alvo.id);});});
  if('IntersectionObserver' in window){
    var obs=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting)ativa(en.target.id);});},{rootMargin:'-35% 0px -60% 0px'});
    links.forEach(function(a){var el=document.getElementById(a.getAttribute('data-alvo'));if(el)obs.observe(el);});
  }
  ativa('topo');
})();
</script>
