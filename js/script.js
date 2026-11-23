const API_URL = "/api/games";
const LIMITE_PAGINA = 12;

const listaJogos = document.getElementById("listaJogos");
const jogosDestaque = document.getElementById("jogosDestaque");
const listaFavoritos = document.getElementById("listaFavoritos");
const mensagemCatalogo = document.getElementById("mensagemCatalogo");
const mensagemBiblioteca = document.getElementById("mensagemBiblioteca");
const contadorJogos = document.getElementById("contadorJogos");
const contadorFavoritos = document.getElementById("contadorFavoritos");
const botaoMais = document.getElementById("botaoMais");

const pesquisa = document.getElementById("pesquisa");
const filtroGenero = document.getElementById("filtroGenero");
const filtroPlataforma = document.getElementById("filtroPlataforma");
const ordenacao = document.getElementById("ordenacao");

const modalJogo = document.getElementById("modalJogo");
const modalCorpo = document.getElementById("modalCorpo");
const aviso = document.getElementById("aviso");

let paginaAtual = 1;
let proximaPagina = null;
let carregando = false;
let controleRequisicao = null;
let numeroBusca = 0;
let jogosConhecidos = new Map();
let destaques = [];
let destaqueAtual = 0;
let timerAviso = null;

function lerFavoritos() {
  try {
    const dados = JSON.parse(localStorage.getItem("gamehub-favoritos"));
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

let favoritos = lerFavoritos();

function escaparHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[caractere]);
}

function imagemSegura(url) {
  try {
    const endereco = new URL(url);
    return ["https:", "http:"].includes(endereco.protocol)
      ? endereco.href
      : "";
  } catch {
    return "";
  }
}

function mostrarAviso(texto) {
  aviso.textContent = texto;
  aviso.classList.add("visivel");
  clearTimeout(timerAviso);

  timerAviso = setTimeout(() => {
    aviso.classList.remove("visivel");
  }, 3000);
}

function configurarMensagem(elemento, texto, mostrar = true) {
  elemento.textContent = texto;
  elemento.hidden = !mostrar;
}

async function consultarAPI(caminho, parametros = {}, signal) {
  const url = new URL(API_URL, window.location.origin);

  const detalhes = caminho.match(/^\/games\/(\d+)$/);

  if (detalhes) {
    url.searchParams.set("id", detalhes[1]);
  }

  Object.entries(parametros).forEach(([chave, valor]) => {
    if (valor !== "" && valor !== null && valor !== undefined) {
      url.searchParams.set(chave, valor);
    }
  });

  const resposta = await fetch(url, { signal });

  if (!resposta.ok) {
    if (resposta.status === 429) {
      throw new Error(
        "Limite de requisições atingido. Tente novamente mais tarde."
      );
    }

    throw new Error(
      `Não foi possível carregar os jogos (${resposta.status}).`
    );
  }

  return resposta.json();
}

function guardarJogos(jogos) {
  jogos.forEach(jogo => {
    if (jogo && jogo.id) {
      jogosConhecidos.set(Number(jogo.id), jogo);
    }
  });
}

function jogoFavorito(id) {
  return favoritos.some(jogo => Number(jogo.id) === Number(id));
}

function criarCartao(jogo) {
  const id = Number(jogo.id);
  const nome = escaparHTML(jogo.name || "Jogo sem nome");
  const imagem = imagemSegura(jogo.background_image);
  const nota = Number(jogo.rating) || 0;

  const generos = (jogo.genres || [])
    .slice(0, 2)
    .map(genero => escaparHTML(genero.name))
    .join(" • ");

  const plataformas = (jogo.parent_platforms || [])
    .slice(0, 3)
    .map(item => escaparHTML(item.platform.name))
    .join(" • ");

  const ano = jogo.released
    ? escaparHTML(jogo.released.slice(0, 4))
    : "Data não informada";

  const favorito = jogoFavorito(id);

  return `
    <div class="col-sm-6 col-lg-4 col-xl-3">
      <article class="cartao-jogo">
        <div class="capa-jogo">
          ${imagem
            ? `<img src="${escaparHTML(imagem)}"
                alt="Capa do jogo ${nome}" loading="lazy">`
            : `<div class="capa-vazia" aria-label="Sem imagem disponível">🎮</div>`
          }

          <span class="nota-capa">
            ★ ${nota ? nota.toFixed(1) + "/5" : "Sem nota"}
          </span>

          <button
            class="favoritar ${favorito ? "ativo" : ""}"
            type="button"
            data-favorito="${id}"
            aria-pressed="${favorito}"
            aria-label="${favorito ? "Remover" : "Adicionar"} ${nome}
              ${favorito ? "dos" : "aos"} favoritos"
            title="${favorito ? "Remover favorito" : "Adicionar favorito"}">
            ${favorito ? "♥" : "♡"}
          </button>
        </div>

        <div class="conteudo-jogo">
          <h3>${nome}</h3>
          <div class="meta-jogo">${ano} ${plataformas ? "• " + plataformas : ""}</div>
          <div class="generos-jogo">${generos || "Gênero não informado"}</div>

          <div class="rodape-cartao">
            <button class="ver-detalhes" type="button"
              data-detalhes="${id}">
              Ver detalhes ↗
            </button>
          </div>
        </div>
      </article>
    </div>
  `;
}

function adicionarCartoes(elemento, jogos, substituir = false) {
  if (substituir) elemento.innerHTML = "";

  elemento.insertAdjacentHTML(
    "beforeend",
    jogos.map(criarCartao).join("")
  );
}

function parametrosCatalogo(pagina) {
  return {
    page: pagina,
    page_size: LIMITE_PAGINA,
    ordering: ordenacao.value,
    search: pesquisa.value.trim(),
    genres: filtroGenero.value,
    platforms: filtroPlataforma.value
  };
}

async function carregarCatalogo(reiniciar = false) {
  if (reiniciar) {
    numeroBusca++;
    controleRequisicao?.abort();
    paginaAtual = 1;
    proximaPagina = null;
    listaJogos.innerHTML = "";
  } else if (carregando || !proximaPagina) {
    return;
  }

  const buscaAtual = numeroBusca;
  const controlador = new AbortController();
  controleRequisicao = controlador;
  carregando = true;
  botaoMais.hidden = true;

  configurarMensagem(
    mensagemCatalogo,
    "Buscando jogos na RAWG..."
  );

  try {
    const dados = await consultarAPI(
      "/games",
      parametrosCatalogo(paginaAtual),
      controlador.signal
    );

    if (buscaAtual !== numeroBusca) return;

    const jogos = dados.results || [];
    guardarJogos(jogos);
    adicionarCartoes(listaJogos, jogos);

    const quantidade = Number(dados.count) || 0;
    contadorJogos.textContent =
      `${quantidade.toLocaleString("pt-BR")} resultados`;

    proximaPagina = dados.next;
    paginaAtual++;

    if (jogos.length === 0 && paginaAtual === 2) {
      configurarMensagem(
        mensagemCatalogo,
        "Nenhum jogo encontrado. Experimente outros filtros."
      );
    } else {
      configurarMensagem(mensagemCatalogo, "", false);
    }

    botaoMais.hidden = !proximaPagina;
  } catch (erro) {
    if (erro.name === "AbortError") return;
    if (buscaAtual !== numeroBusca) return;

    configurarMensagem(mensagemCatalogo, erro.message);
    contadorJogos.textContent = "Catálogo indisponível";
  } finally {
    if (buscaAtual === numeroBusca) {
      carregando = false;
    }
  }
}

document.getElementById("formPesquisa").addEventListener("submit", evento => {
  evento.preventDefault();
  carregarCatalogo(true);
});

[filtroGenero, filtroPlataforma, ordenacao].forEach(campo => {
  campo.addEventListener("change", () => carregarCatalogo(true));
});

document.getElementById("limparFiltros").addEventListener("click", () => {
  pesquisa.value = "";
  filtroGenero.value = "";
  filtroPlataforma.value = "";
  ordenacao.value = "-added";
  carregarCatalogo(true);
});

botaoMais.addEventListener("click", () => carregarCatalogo());

let timerPesquisa;

pesquisa.addEventListener("input", () => {
  clearTimeout(timerPesquisa);
  timerPesquisa = setTimeout(() => carregarCatalogo(true), 500);
});

async function carregarDestaques() {
  try {
    const dados = await consultarAPI("/games", {
      page_size: 4,
      ordering: "-added"
    });

    destaques = dados.results || [];
    guardarJogos(destaques);

    adicionarCartoes(jogosDestaque, destaques, true);

    if (destaques.length > 0) {
      atualizarHero();
    } else {
      jogosDestaque.textContent = "Nenhum destaque disponível.";
    }
  } catch (erro) {
    jogosDestaque.innerHTML = "";
    const mensagem = document.createElement("p");
    mensagem.className = "texto-secundario";
    mensagem.textContent = erro.message;
    jogosDestaque.appendChild(mensagem);
  }
}

function atualizarHero() {
  if (!destaques.length) return;

  const jogo = destaques[destaqueAtual];
  const imagem = imagemSegura(jogo.background_image);

  document.getElementById("heroImagem").style.backgroundImage =
    imagem ? `url("${imagem}")` : "none";

  const indicadores = document.getElementById("heroIndicadores");
  indicadores.innerHTML = "";

  destaques.forEach((item, indice) => {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = indice === destaqueAtual ? "ativo" : "";
    botao.setAttribute("aria-label", `Mostrar destaque ${indice + 1}: ${item.name}`);
    botao.setAttribute("aria-pressed", String(indice === destaqueAtual));
    botao.addEventListener("click", () => {
      destaqueAtual = indice;
      atualizarHero();
    });
    indicadores.appendChild(botao);
  });
}

function mudarDestaque(direcao) {
  if (!destaques.length) return;

  destaqueAtual =
    (destaqueAtual + direcao + destaques.length) % destaques.length;

  atualizarHero();
}

document.getElementById("heroAnterior")
  .addEventListener("click", () => mudarDestaque(-1));

document.getElementById("heroProximo")
  .addEventListener("click", () => mudarDestaque(1));

function salvarFavoritos() {
  try {
    localStorage.setItem(
      "gamehub-favoritos",
      JSON.stringify(favoritos)
    );
    return true;
  } catch {
    mostrarAviso("Não foi possível salvar os favoritos neste navegador.");
    return false;
  }
}

function alternarFavorito(id) {
  const indice = favoritos.findIndex(
    jogo => Number(jogo.id) === Number(id)
  );

  if (indice !== -1) {
    const anterior = [...favoritos];
    favoritos.splice(indice, 1);

    if (!salvarFavoritos()) {
      favoritos = anterior;
      return;
    }

    mostrarAviso("Jogo removido dos favoritos.");
  } else {
    const jogo = jogosConhecidos.get(Number(id));

    if (!jogo) {
      mostrarAviso("Não foi possível encontrar esse jogo.");
      return;
    }

    favoritos.push(jogo);

    if (!salvarFavoritos()) {
      favoritos.pop();
      return;
    }

    mostrarAviso("Jogo adicionado à biblioteca!");
  }

  atualizarBiblioteca();
  atualizarBotoesFavoritos();
}

function atualizarBotoesFavoritos() {
  document.querySelectorAll("[data-favorito]").forEach(botao => {
    const id = Number(botao.dataset.favorito);
    const ativo = jogoFavorito(id);
    const nome = jogosConhecidos.get(id)?.name || "jogo";

    botao.classList.toggle("ativo", ativo);
    botao.textContent = ativo ? "♥" : "♡";
    botao.setAttribute("aria-pressed", String(ativo));
    botao.setAttribute(
      "aria-label",
      `${ativo ? "Remover" : "Adicionar"} ${nome} ${ativo ? "dos" : "aos"} favoritos`
    );
  });
}

function atualizarBiblioteca() {
  listaFavoritos.innerHTML = "";
  guardarJogos(favoritos);

  adicionarCartoes(listaFavoritos, favoritos);

  contadorFavoritos.textContent =
    `${favoritos.length} ${favoritos.length === 1 ? "favorito" : "favoritos"}`;

  configurarMensagem(
    mensagemBiblioteca,
    "Você ainda não adicionou jogos. Explore o catálogo e clique no coração!",
    favoritos.length === 0
  );

  if (favoritos.length === 0) {
    document.getElementById("resultadoSorteio").textContent = "";
  }
}

document.getElementById("botaoSortear").addEventListener("click", () => {
  const resultado = document.getElementById("resultadoSorteio");

  if (favoritos.length === 0) {
    resultado.textContent = "Adicione jogos à biblioteca antes de sortear.";
    return;
  }

  const indice = Math.floor(Math.random() * favoritos.length);
  const sorteado = favoritos[indice];

  resultado.textContent = `Seu próximo jogo é: ${sorteado.name}!`;
});

async function abrirDetalhes(id) {
  const jogo = jogosConhecidos.get(Number(id));

  if (!jogo) return;

  modalCorpo.innerHTML = `
    <div class="modal-texto">
      <h2 id="modalTitulo">${escaparHTML(jogo.name)}</h2>
      <p>Carregando detalhes...</p>
    </div>
  `;

  if (!modalJogo.open) modalJogo.showModal();

  try {
    const detalhes = await consultarAPI(`/games/${id}`);

    if (!modalJogo.open) return;

    const imagem = imagemSegura(
      detalhes.background_image || jogo.background_image
    );

    const generos = (detalhes.genres || [])
      .map(g => g.name).join(", ") || "Não informado";

    const plataformas = (detalhes.platforms || [])
      .map(p => p.platform.name).join(", ") || "Não informadas";

    const desenvolvedores = (detalhes.developers || [])
      .map(d => d.name).join(", ") || "Não informados";

    const descricao = detalhes.description_raw ||
      "Descrição não disponível em texto simples.";

    const notaRAWG = detalhes.rating
      ? `${Number(detalhes.rating).toFixed(1)}/5`
      : "Sem nota";

    const notaMetacritic = detalhes.metacritic != null
      ? `${detalhes.metacritic}/100`
      : "Não disponível";

    modalCorpo.innerHTML = `
      ${imagem
        ? `<img class="modal-capa" src="${escaparHTML(imagem)}"
             alt="Imagem de ${escaparHTML(detalhes.name)}">`
        : ""
      }

      <div class="modal-texto">
        <span class="subtitulo">DETALHES DO JOGO</span>
        <h2 id="modalTitulo">${escaparHTML(detalhes.name)}</h2>

        <div class="modal-dados">
          <span>★ RAWG: ${escaparHTML(notaRAWG)}</span>
          <span>Metacritic: ${escaparHTML(notaMetacritic)}</span>
          <span>Lançamento: ${escaparHTML(detalhes.released || "Não informado")}</span>
        </div>

        <p><strong>Gêneros:</strong> ${escaparHTML(generos)}</p>
        <p><strong>Plataformas:</strong> ${escaparHTML(plataformas)}</p>
        <p><strong>Desenvolvedores:</strong> ${escaparHTML(desenvolvedores)}</p>
        <p>${escaparHTML(descricao)}</p>

        <a class="botao-principal" href="https://rawg.io/games/${encodeURIComponent(detalhes.slug)}"
          target="_blank" rel="noopener noreferrer">
          Ver na RAWG ↗
        </a>
      </div>
    `;
  } catch (erro) {
    if (!modalJogo.open) return;

    modalCorpo.innerHTML = `
      <div class="modal-texto">
        <h2 id="modalTitulo">Erro ao carregar detalhes</h2>
        <p>${escaparHTML(erro.message)}</p>
      </div>
    `;
  }
}

document.getElementById("fecharModal").addEventListener("click", () => {
  modalJogo.close();
});

modalJogo.addEventListener("click", evento => {
  if (evento.target === modalJogo) modalJogo.close();
});

document.addEventListener("click", evento => {
  const botaoFavorito = evento.target.closest("[data-favorito]");
  const botaoDetalhes = evento.target.closest("[data-detalhes]");

  if (botaoFavorito) {
    alternarFavorito(Number(botaoFavorito.dataset.favorito));
  }

  if (botaoDetalhes) {
    abrirDetalhes(Number(botaoDetalhes.dataset.detalhes));
  }
});

const botaoTema = document.getElementById("botaoTema");
const botaoContraste = document.getElementById("altoContraste");

function aplicarTema() {
  const claro = document.body.classList.contains("claro");

  botaoTema.textContent = claro ? "☾" : "☀";
  botaoTema.setAttribute(
    "aria-label",
    claro ? "Ativar modo escuro" : "Ativar modo claro"
  );
}

function recuperarPreferencias() {
  try {
    const tema = localStorage.getItem("gamehub-tema");
    const contraste = localStorage.getItem("gamehub-contraste");
    const fonte = Number(localStorage.getItem("gamehub-fonte")) || 1;

    document.body.classList.toggle("claro", tema === "claro");
    document.body.classList.toggle("contraste", contraste === "sim");

    botaoContraste.setAttribute(
      "aria-pressed",
      String(contraste === "sim")
    );

    document.documentElement.style.setProperty(
      "--escala-fonte",
      String(Math.min(1.4, Math.max(.9, fonte)))
    );
  } catch {
    // O site continua funcionando mesmo sem armazenamento.
  }

  aplicarTema();
}

botaoTema.addEventListener("click", () => {
  document.body.classList.toggle("claro");
  aplicarTema();

  try {
    localStorage.setItem(
      "gamehub-tema",
      document.body.classList.contains("claro") ? "claro" : "escuro"
    );
  } catch {}
});

botaoContraste.addEventListener("click", () => {
  const ativo = document.body.classList.toggle("contraste");
  botaoContraste.setAttribute("aria-pressed", String(ativo));

  try {
    localStorage.setItem("gamehub-contraste", ativo ? "sim" : "nao");
  } catch {}
});

function mudarFonte(diferenca) {
  const atual = parseFloat(
    getComputedStyle(document.documentElement)
      .getPropertyValue("--escala-fonte")
  ) || 1;

  const novo = Math.min(1.4, Math.max(.9, atual + diferenca));
  const arredondado = Math.round(novo * 100) / 100;

  document.documentElement.style.setProperty(
    "--escala-fonte",
    arredondado
  );

  try {
    localStorage.setItem("gamehub-fonte", arredondado);
  } catch {}

  mostrarAviso(`Tamanho da fonte: ${Math.round(arredondado * 100)}%`);
}

document.getElementById("aumentarFonte")
  .addEventListener("click", () => mudarFonte(.1));

document.getElementById("diminuirFonte")
  .addEventListener("click", () => mudarFonte(-.1));

const menuMobile = document.getElementById("menuMobile");
const linksMenu = document.getElementById("linksMenu");

menuMobile.addEventListener("click", () => {
  const aberto = linksMenu.classList.toggle("aberto");
  menuMobile.setAttribute("aria-expanded", String(aberto));
  menuMobile.setAttribute(
    "aria-label",
    aberto ? "Fechar menu" : "Abrir menu"
  );
});

linksMenu.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    linksMenu.classList.remove("aberto");
    menuMobile.setAttribute("aria-expanded", "false");
    menuMobile.setAttribute("aria-label", "Abrir menu");
  });
});

document.getElementById("formContato").addEventListener("submit", evento => {
  evento.preventDefault();

  const formulario = evento.currentTarget;

  if (!formulario.reportValidity()) return;

  document.getElementById("retornoContato").textContent =
    "Mensagem validada! O envio ainda não está disponível nesta versão.";

  formulario.reset();
});

async function iniciarGameHub() {
  document.getElementById("anoAtual").textContent =
    new Date().getFullYear();

  recuperarPreferencias();
  atualizarBiblioteca();

  await Promise.all([
    carregarDestaques(),
    carregarCatalogo(true)
  ]);
}

iniciarGameHub();
