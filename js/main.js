/* =========================================================================
   PORTAL DO SGI — Syensqo Brasil
   Este arquivo lê os JSONs de /data e monta o conteúdo da página.
   Para trocar textos, links ou imagens, edite os arquivos em /data —
   nunca este arquivo. Veja o README.md para instruções detalhadas.
   ========================================================================= */

/* -------------------------------------------------------------------------
   BLOCO 1 — Utilitários genéricos, usados por todas as seções abaixo
   ------------------------------------------------------------------------- */

/**
 * Busca e interpreta um arquivo JSON. Lança erro se o arquivo não existir,
 * a resposta não for HTTP 200, ou o conteúdo não for um JSON válido —
 * quem chamar esta função é responsável por capturar o erro (try/catch).
 */
async function carregarJSON(caminho) {
  const resposta = await fetch(caminho, { cache: 'no-cache' });
  if (!resposta.ok) {
    throw new Error(`HTTP ${resposta.status} ao buscar ${caminho}`);
  }
  return await resposta.json();
}

/**
 * Substitui o conteúdo de uma seção por uma mensagem discreta de erro.
 * Usado quando o JSON daquela seção falha ao carregar — as demais seções
 * continuam funcionando normalmente.
 */
function exibirErroSecao(container, mensagem) {
  container.innerHTML = `
    <div class="erro-secao" role="alert">
      <i data-lucide="alert-triangle" aria-hidden="true"></i>
      <p>${mensagem}</p>
    </div>
  `;
  if (window.lucide) {
    lucide.createIcons();
  }
}

/**
 * Monta o HTML de um ícone, que pode ser uma imagem própria (jpeg/png) ou
 * um ícone da biblioteca Lucide — usado em Links Rápidos, Documentos
 * Padrão e 8 Regras da Qualidade.
 * @param {"imagem"|"lucide"} tipo
 * @param {string} valor - caminho da imagem OU nome do ícone Lucide
 * @param {string} altTexto - texto alternativo (só se aplica a imagens)
 */
function renderizarIcone(tipo, valor, altTexto) {
  if (tipo === 'imagem') {
    return `<img src="${valor}" alt="${altTexto || ''}" loading="lazy">`;
  }
  return `<i data-lucide="${valor}" aria-hidden="true"></i>`;
}

/**
 * Monta o cabeçalho padrão de uma seção (título + descrição opcional +
 * botão de link externo opcional). Reaproveitado por várias seções para
 * não duplicar o mesmo HTML de título em cada uma.
 * @param {string} titulo
 * @param {string} [descricao]
 * @param {{texto: string, link: string}} [botao] - botão extra (ex: "Ver planilha completa")
 */
function criarCabecalhoSecao(titulo, descricao, botao) {
  const descricaoHtml = descricao ? `<p>${descricao}</p>` : '';
  const botaoHtml = botao
    ? `<a class="botao" href="${botao.link}" target="_blank" rel="noopener">
         <i data-lucide="external-link" aria-hidden="true"></i>
         ${botao.texto}
       </a>`
    : '';
  return `
    <div class="titulo-secao animar-entrada">
      <h2>${titulo}</h2>
      ${descricaoHtml}
      ${botaoHtml}
    </div>
  `;
}

/* -------------------------------------------------------------------------
   BLOCO 2 — Navegação, título da aba e rodapé (a partir de data/config.json)
   ------------------------------------------------------------------------- */

async function inicializarNavegacao() {
  const menuLista = document.getElementById('menu-nav');
  const textoRodape = document.getElementById('texto-rodape');
  const botaoToggle = document.getElementById('nav-toggle');

  try {
    const config = await carregarJSON('data/config.json');

    document.title = config.site.tituloAba;
    textoRodape.textContent = config.site.textoRodape;

    menuLista.innerHTML = config.menu
      .map((item) => `<li><a href="${item.ancora}">${item.rotulo}</a></li>`)
      .join('');

    // Fecha o menu mobile automaticamente ao clicar em um item
    menuLista.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => fecharMenuMobile());
    });
  } catch (erro) {
    console.error('Erro ao carregar navegação (data/config.json):', erro);
    // Falha na navegação não deve travar a página: menu fica vazio,
    // mas âncoras internas de cada seção continuam funcionando.
  }

  function fecharMenuMobile() {
    menuLista.classList.remove('aberto');
    botaoToggle.setAttribute('aria-expanded', 'false');
  }

  botaoToggle.addEventListener('click', () => {
    const aberto = menuLista.classList.toggle('aberto');
    botaoToggle.setAttribute('aria-expanded', String(aberto));
  });
}

/* -------------------------------------------------------------------------
   BLOCO 3 — Uma função renderX(dados, container) por seção de conteúdo.
   Cada seção nova implementada no projeto ganha sua função aqui.
   ------------------------------------------------------------------------- */

function renderHero(config, container) {
  const hero = config.hero;

  const frasesHtml = hero.frases
    .map((frase, indice) => `<p class="hero-frase${indice === 0 ? ' ativa' : ''}">${frase}</p>`)
    .join('');

  container.innerHTML = `
    <div class="container hero-conteudo">
      <img class="hero-logo animar-entrada" src="${hero.logo}" alt="${hero.logoAlt}" loading="lazy">
      <h1 class="animar-entrada">${hero.titulo}</h1>
      <p class="hero-subtitulo animar-entrada">${hero.subtitulo}</p>
      <div class="hero-frase-caixa animar-entrada" role="text">
        ${frasesHtml}
      </div>
    </div>
  `;

  iniciarRotacaoFrases(container, hero.frases.length, hero.intervaloTrocaFraseMs);
}

/**
 * Faz a troca automática (cross-fade) entre as frases do Hero. Se o
 * usuário preferir menos movimento (prefers-reduced-motion), a rotação
 * automática não é iniciada — a primeira frase fica fixa na tela.
 */
function iniciarRotacaoFrases(container, totalFrases, intervaloMs) {
  if (totalFrases <= 1) return;

  const prefereReduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefereReduzirMovimento) return;

  const frases = container.querySelectorAll('.hero-frase');
  let indiceAtual = 0;

  setInterval(() => {
    frases[indiceAtual].classList.remove('ativa');
    indiceAtual = (indiceAtual + 1) % totalFrases;
    frases[indiceAtual].classList.add('ativa');
  }, intervaloMs || 6000);
}

function renderLinksRapidos(dados, container) {
  const cardsHtml = dados.itens
    .map(
      (item) => `
        <a class="link-rapido-card card animar-entrada" href="${item.link}" target="_blank" rel="noopener">
          <span class="link-rapido-icone">${renderizarIcone(item.tipoIcone, item.valorIcone, item.titulo)}</span>
          <span class="link-rapido-titulo">${item.titulo}</span>
          <i class="link-rapido-seta" data-lucide="arrow-up-right" aria-hidden="true"></i>
        </a>
      `
    )
    .join('');

  container.innerHTML = `
    <div class="container">
      ${criarCabecalhoSecao(dados.tituloSecao)}
      <div class="link-rapido-grid">${cardsHtml}</div>
    </div>
  `;
}

function renderCertificacoes(dados, container) {
  const cardsHtml = dados.normas
    .map((norma) => {
      const pillsHtml = norma.versoes
        .map((versao) => `<a class="pill" href="${versao.link}" target="_blank" rel="noopener">${versao.rotulo}</a>`)
        .join('');

      return `
        <div class="certificacao-card card animar-entrada">
          <div class="certificacao-imagem">
            <img src="${norma.imagem}" alt="Selo da certificação ${norma.norma}" loading="lazy">
          </div>
          <h3>${norma.norma}</h3>
          <div class="certificacao-pills">${pillsHtml}</div>
        </div>
      `;
    })
    .join('');

  container.innerHTML = `
    <div class="container">
      ${criarCabecalhoSecao(dados.tituloSecao)}
      <div class="certificacao-grid">${cardsHtml}</div>
    </div>
  `;
}

function renderPoliticas(dados, container) {
  const itensHtml = dados.itens
    .map((item) => {
      const temSubItens = item.subItens && item.subItens.length > 0;
      const subItensHtml = temSubItens
        ? `<div class="politica-subitens">
             ${item.subItens
               .map((sub) => `<a class="pill" href="${sub.link}" target="_blank" rel="noopener">${sub.rotulo}</a>`)
               .join('')}
           </div>`
        : '';

      return `
        <div class="politica-card card animar-entrada">
          <div class="politica-cabecalho">
            <span class="politica-icone"><i data-lucide="file-text" aria-hidden="true"></i></span>
            <a class="politica-titulo-link" href="${item.link}" target="_blank" rel="noopener">${item.titulo}</a>
            <i class="politica-seta" data-lucide="arrow-up-right" aria-hidden="true"></i>
          </div>
          ${subItensHtml}
        </div>
      `;
    })
    .join('');

  container.innerHTML = `
    <div class="container">
      ${criarCabecalhoSecao(dados.tituloSecao)}
      <div class="politica-grid">${itensHtml}</div>
    </div>
  `;
}

function render5S(dados, container) {
  const sensosHtml = dados.sensos
    .map(
      (senso) => `
        <div class="cinco-s-card card animar-entrada">
          <img class="cinco-s-icone" src="${senso.icone}" alt="Ícone do senso ${senso.nome}" loading="lazy">
          <h3>${senso.nome}</h3>
          <p class="cinco-s-traducao">${senso.traducao}</p>
          <p class="cinco-s-descricao">${senso.descricao}</p>
        </div>
      `
    )
    .join('');

  const linksHtml = dados.links
    .map(
      (item) => `
        <a class="botao" href="${item.link}" target="_blank" rel="noopener">
          <i data-lucide="external-link" aria-hidden="true"></i>
          ${item.rotulo}
        </a>
      `
    )
    .join('');

  container.innerHTML = `
    <div class="container">
      ${criarCabecalhoSecao(dados.tituloSecao)}
      <div class="cinco-s-banner animar-entrada">
        <img src="${dados.imagemPrincipal}" alt="Ilustração do Programa 5S" loading="lazy">
      </div>
      <div class="cinco-s-grid">${sensosHtml}</div>
      <div class="cinco-s-links">${linksHtml}</div>
    </div>
  `;
}

function renderCronograma(dados, container) {
  const mapaCorPorTipo = {};
  const legendaHtml = dados.tiposAuditoria
    .map((tipo) => {
      mapaCorPorTipo[tipo.tipo] = tipo.cor;
      return `
        <span class="cronograma-legenda-item">
          <span class="cronograma-legenda-cor" style="background:${tipo.cor}"></span>
          ${tipo.tipo}
        </span>
      `;
    })
    .join('');

  container.innerHTML = `
    <div class="container">
      ${criarCabecalhoSecao(dados.tituloSecao, null, { texto: 'Ver planilha completa', link: dados.linkPlanilhaCompleta })}
      <div class="cronograma-legenda animar-entrada">${legendaHtml}</div>
      <div class="cronograma-calendario-wrapper card animar-entrada">
        <div class="cronograma-calendario"></div>
      </div>
    </div>
  `;

  // window.FullCalendar pode não existir se o CDN falhar (ex: bloqueio de
  // proxy corporativo) — isso lança um erro capturado por inicializarSecao,
  // que já trata isso como falha isolada desta seção.
  const elCalendario = container.querySelector('.cronograma-calendario');
  const eventosFullCalendar = dados.eventos.map((evento) => ({
    title: evento.titulo,
    start: evento.dataInicio,
    end: evento.dataFim,
    color: mapaCorPorTipo[evento.tipo],
  }));

  const calendario = new FullCalendar.Calendar(elCalendario, {
    locale: 'pt-br',
    initialView: 'dayGridMonth',
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,listMonth' },
    buttonText: { today: 'Hoje', dayGridMonth: 'Mês', listMonth: 'Lista' },
    allDayText: 'Dia inteiro',
    height: 'auto',
    events: eventosFullCalendar,
  });
  calendario.render();
}

const ICONES_POR_TIPO_ARQUIVO = {
  word: 'file-text',
  excel: 'file-spreadsheet',
  pdf: 'file-type',
};

function renderDocumentosPadrao(dados, container) {
  const itensHtml = dados.itens
    .map((item) => {
      const icone = ICONES_POR_TIPO_ARQUIVO[item.tipoArquivo] || 'file';
      return `
        <a class="documento-card card animar-entrada" href="${item.link}" target="_blank" rel="noopener">
          <span class="documento-icone"><i data-lucide="${icone}" aria-hidden="true"></i></span>
          <span class="documento-texto">
            <span class="documento-codigo">${item.codigo}</span>
            <span class="documento-titulo">${item.titulo}</span>
          </span>
          <i class="documento-seta" data-lucide="arrow-up-right" aria-hidden="true"></i>
        </a>
      `;
    })
    .join('');

  container.innerHTML = `
    <div class="container">
      ${criarCabecalhoSecao(dados.tituloSecao)}
      <div class="documento-grid">${itensHtml}</div>
    </div>
  `;
}

const ICONES_POR_COR_SWOT = {
  verde: 'trending-up',
  vermelho: 'trending-down',
  azul: 'lightbulb',
  laranja: 'shield-alert',
};

function renderSwot(dados, container) {
  const quadrantesHtml = dados.quadrantes
    .map((quadrante) => {
      const icone = ICONES_POR_COR_SWOT[quadrante.cor] || 'circle';
      const itensHtml = quadrante.itens.map((item) => `<li>${item}</li>`).join('');
      return `
        <div class="swot-quadrante swot-${quadrante.cor} card animar-entrada">
          <div class="swot-cabecalho">
            <i data-lucide="${icone}" aria-hidden="true"></i>
            <h3>${quadrante.tipo}</h3>
          </div>
          <ul class="swot-lista">${itensHtml}</ul>
        </div>
      `;
    })
    .join('');

  container.innerHTML = `
    <div class="container">
      ${criarCabecalhoSecao(dados.tituloSecao, null, { texto: 'Ver mapeamento completo', link: dados.linkMapeamentoCompleto })}
      <div class="swot-grid">${quadrantesHtml}</div>
    </div>
  `;
}

function renderOitoRegras(dados, container) {
  const regrasHtml = dados.regras
    .map((regra) => {
      const numeroFormatado = String(regra.numero).padStart(2, '0');
      const cabecalhoInterno = `
        <span class="regra-numero">${numeroFormatado}</span>
        <span class="regra-titulo-bloco">
          <span class="regra-titulo-linha">
            <i class="regra-icone" data-lucide="${regra.icone}" aria-hidden="true"></i>
            <span class="regra-titulo">${regra.titulo}</span>
          </span>
          <span class="regra-resumo">${regra.resumo}</span>
        </span>
      `;

      // Card 3 (5S) não expande: leva direto até a seção 5S para não
      // repetir os cinco sensos, que já têm sua própria seção completa.
      if (regra.ancora) {
        return `
          <div class="regra-card regra-ancora card animar-entrada">
            <a class="regra-cabecalho" href="${regra.ancora}">
              ${cabecalhoInterno}
              <i class="regra-seta-ancora" data-lucide="arrow-right" aria-hidden="true"></i>
            </a>
          </div>
        `;
      }

      const idConteudo = `regra-conteudo-${regra.numero}`;
      return `
        <div class="regra-card card animar-entrada">
          <button class="regra-cabecalho" type="button" aria-expanded="false" aria-controls="${idConteudo}">
            ${cabecalhoInterno}
            <i class="regra-chevron" data-lucide="chevron-down" aria-hidden="true"></i>
          </button>
          <div class="regra-conteudo" id="${idConteudo}">
            <div class="regra-conteudo-inner">
              <p class="regra-conteudo-texto">${regra.textoCompleto}</p>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  container.innerHTML = `
    <div class="container">
      ${criarCabecalhoSecao(dados.tituloSecao, null, { texto: 'Baixar PDF oficial', link: dados.linkPdfOficial })}
      <div class="regra-lista">${regrasHtml}</div>
    </div>
  `;

  container.querySelectorAll('.regra-cabecalho[aria-expanded]').forEach((botao) => {
    botao.addEventListener('click', () => alternarAccordionRegra(container, botao));
  });
}

/**
 * Garante que só um card de regra fique expandido por vez: fecha
 * qualquer outro que esteja aberto antes de abrir (ou fechar) o clicado.
 */
function alternarAccordionRegra(container, botaoClicado) {
  const cardClicado = botaoClicado.closest('.regra-card');
  const jaEstavaAberto = cardClicado.classList.contains('aberto');

  container.querySelectorAll('.regra-card.aberto').forEach((card) => {
    card.classList.remove('aberto');
    const botao = card.querySelector('.regra-cabecalho[aria-expanded]');
    if (botao) botao.setAttribute('aria-expanded', 'false');
  });

  if (!jaEstavaAberto) {
    cardClicado.classList.add('aberto');
    botaoClicado.setAttribute('aria-expanded', 'true');
  }
}

function renderIndicadores(dados, container) {
  container.innerHTML = `
    <div class="container">
      <div class="indicadores-placeholder card animar-entrada">
        <span class="indicadores-icone">
          <i data-lucide="bar-chart-3" aria-hidden="true"></i>
        </span>
        <div class="indicadores-titulo-linha">
          <h2>${dados.tituloSecao}</h2>
          <span class="indicadores-badge">Em breve</span>
        </div>
        <p>${dados.mensagem}</p>
        <a class="botao" href="${dados.cta.ancora}">
          <i data-lucide="arrow-right" aria-hidden="true"></i>
          ${dados.cta.texto}
        </a>
      </div>
    </div>
  `;
}

/* -------------------------------------------------------------------------
   BLOCO 4 — Registro central das seções com fetch + inicializador isolado
   ------------------------------------------------------------------------- */

// Cada entrada é uma seção de conteúdo carregada de forma independente:
// se o JSON de uma falhar, só aquela seção mostra erro — as outras
// continuam funcionando normalmente.
const SECOES = [
  { id: 'hero', arquivo: 'data/config.json', render: renderHero },
  { id: 'links-rapidos', arquivo: 'data/links-rapidos.json', render: renderLinksRapidos },
  { id: 'certificacoes', arquivo: 'data/certificacoes.json', render: renderCertificacoes },
  { id: 'politicas', arquivo: 'data/politicas.json', render: renderPoliticas },
  { id: 'secao-5s', arquivo: 'data/5s.json', render: render5S },
  { id: 'cronograma', arquivo: 'data/eventos.json', render: renderCronograma },
  { id: 'documentos-padrao', arquivo: 'data/documentos-padrao.json', render: renderDocumentosPadrao },
  { id: 'swot', arquivo: 'data/swot.json', render: renderSwot },
  { id: 'oito-regras', arquivo: 'data/oito-regras.json', render: renderOitoRegras },
  { id: 'indicadores', arquivo: 'data/indicadores.json', render: renderIndicadores },
];

async function inicializarSecao({ id, arquivo, render }) {
  const container = document.getElementById(id);
  if (!container) return;

  try {
    const dados = await carregarJSON(arquivo);
    render(dados, container);
    if (window.lucide) {
      lucide.createIcons();
    }
    observarAnimacoes(container);
  } catch (erro) {
    console.error(`Erro na seção "${id}" (${arquivo}):`, erro);
    exibirErroSecao(container, 'Não foi possível carregar este conteúdo no momento.');
  }
}

/* -------------------------------------------------------------------------
   BLOCO 5 — Animação de entrada ao rolar a página (IntersectionObserver)
   ------------------------------------------------------------------------- */

// Único observer compartilhado por toda a página. Cada seção chama
// observarAnimacoes(container) assim que termina de renderizar seu
// próprio conteúdo (os JSONs carregam em paralelo, em momentos
// diferentes, então não dá para observar tudo de uma vez só no início).
let observerAnimacao = null;

function inicializarAnimacoesScroll() {
  const prefereReduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefereReduzirMovimento) {
    // Sem observer: os elementos já nascem visíveis (ver CSS,
    // .animar-entrada só fica invisível quando o movimento é permitido).
    return;
  }

  observerAnimacao = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('visivel');
          observerAnimacao.unobserve(entrada.target);
        }
      });
    },
    { threshold: 0.15 }
  );
}

function observarAnimacoes(container) {
  if (!observerAnimacao) return; // prefers-reduced-motion: nada a observar
  container.querySelectorAll('.animar-entrada').forEach((el) => observerAnimacao.observe(el));
}

/* -------------------------------------------------------------------------
   INICIALIZAÇÃO
   ------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  inicializarAnimacoesScroll(); // precisa existir antes das seções chamarem observarAnimacoes()
  inicializarNavegacao();
  SECOES.forEach(inicializarSecao);
});
