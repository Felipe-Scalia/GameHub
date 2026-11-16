// Alternar entre modo claro e escuro
const botaoTema = document.getElementById('botaoTema');
botaoTema.addEventListener('click', function () {
  document.body.classList.toggle('claro');
  if (document.body.classList.contains('claro')) {
    botaoTema.textContent = 'Modo escuro';
  } else {
    botaoTema.textContent = 'Modo claro';
  }
});

// Filtrar os jogos pelo nome digitado
const pesquisa = document.getElementById('pesquisa');
const jogos = document.querySelectorAll('.jogo');
const semResultados = document.getElementById('semResultados');
pesquisa.addEventListener('input', function () {
  const texto = pesquisa.value.toLowerCase();
  let encontrados = 0;
  jogos.forEach(function (jogo) {
    const nome = jogo.dataset.nome.toLowerCase();
    const aparece = nome.includes(texto);
    jogo.hidden = !aparece;
    // Bootstrap usa display na classe col-md-4, então ocultamos via estilo.
    jogo.style.display = aparece ? '' : 'none';
    if (aparece) encontrados++;
  });
  semResultados.hidden = encontrados > 0;
});
