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
 * um ícone da biblioteca Lucide. Hoje os Links Rápidos usam só "lucide"
 * (visual padronizado), mas o suporte a "imagem" continua aqui para o caso
 * de alguma seção futura precisar de um logo próprio.
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
 * O <span> dentro do <h2> recebe o traço laranja animado por baixo.
 * @param {string} titulo
 * @param {string} [descricao]
 * @param {{texto: string, link: string}} [botao] - botão extra (ex: "Ver planilha completa")
 */
function criarCabecalhoSecao(titulo, descricao, botao) {
  const descricaoHtml = descricao ? `<p>${descricao}</p>` : '';
  const botaoHtml = botao
    ? `<a class="botao botao--fantasma" href="${botao.link}" target="_blank" rel="noopener">
         <i data-lucide="external-link" aria-hidden="true"></i>
         ${botao.texto}
       </a>`
    : '';
  return `
    <div class="titulo-secao animar-entrada">
      <h2><span class="titulo-secao-texto">${titulo}</span></h2>
      ${descricaoHtml}
      ${botaoHtml}
    </div>
  `;
}

/**
 * Aplica um atraso crescente na animação de entrada dos filhos diretos de
 * um grid, criando o efeito "cascata" (um card entra depois do outro).
 * O atraso é limitado para que uma lista longa não demore demais a aparecer.
 */
function escalonarEntrada(container, seletor) {
  container.querySelectorAll(seletor).forEach((elemento, indice) => {
    elemento.style.transitionDelay = `${Math.min(indice, 7) * 70}ms`;
  });
}

/* -------------------------------------------------------------------------
   BLOCO 2 — Navegação, título da aba e rodapé (a partir de data/config.json)
   ------------------------------------------------------------------------- */

async function inicializarCabecalho() {
  const textoRodape = document.getElementById('texto-rodape');

  try {
    const config = await carregarJSON('data/config.json');
    document.title = config.site.tituloAba;
    textoRodape.textContent = config.site.textoRodape;
  } catch (erro) {
    console.error('Erro ao carregar config (data/config.json):', erro);
    // Falha aqui não derruba a página: só o título da aba e o rodapé
    // ficam com o valor padrão do index.html.
  }
}
/* -------------------------------------------------------------------------
   BLOCO 3 — Uma função renderX(dados, container) por seção de conteúdo.
   Cada seção nova implementada no projeto ganha sua função aqui.
   ------------------------------------------------------------------------- */

function renderHero(config, container) {
  const hero = config.hero;
  const unidadesTexto = hero.unidades.join(' · ');

  // O título é dividido em duas partes: a normal e a "destaque", que
  // recebe o degradê laranja. Se "tituloDestaque" não existir no JSON,
  // o título simplesmente aparece inteiro em cor sólida.
  const destaqueHtml = hero.tituloDestaque
    ? ` <span class="hero-destaque">${hero.tituloDestaque}</span>`
    : '';

  const acoesHtml = (hero.acoes || [])
    .map(
      (acao) => `
        <a class="botao botao--${acao.estilo === 'fantasma' ? 'fantasma' : 'primario'}" href="${acao.ancora}">
          <i data-lucide="${acao.icone}" aria-hidden="true"></i>
          <span>${acao.texto}</span>
        </a>
      `
    )
    .join('');

  // As orbs de fundo já existem no index.html e não devem ser apagadas —
  // por isso inserimos o conteúdo com insertAdjacentHTML em vez de
  // sobrescrever o innerHTML do container inteiro.
  container.insertAdjacentHTML(
    'beforeend',
    `
    <div class="container hero-conteudo">
      ${
        hero.eyebrow
          ? `<span class="hero-eyebrow-pill animar-entrada">${hero.eyebrow}</span>`
          : ''
      }

      <h1 class="animar-entrada">${hero.titulo}${destaqueHtml}</h1>

      <p class="hero-frase animar-entrada">${hero.frase}</p>

      <div class="hero-unidades animar-entrada">
        <i data-lucide="map-pin" aria-hidden="true"></i>
        <span>${unidadesTexto}</span>
      </div>

      <div class="hero-acoes animar-entrada">${acoesHtml}</div>
    </div>

    <a class="hero-scroll-cue animar-entrada" href="#links-rapidos" aria-label="Rolar até o conteúdo do site">
      <i data-lucide="chevron-down" aria-hidden="true"></i>
    </a>
  `
  );
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

  escalonarEntrada(container, '.link-rapido-card');
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

  escalonarEntrada(container, '.certificacao-card');
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

  escalonarEntrada(container, '.politica-card');
}

function render5S(dados, container) {
  const sensosHtml = dados.sensos
    .map(
      (senso, indice) => `
        <div class="cinco-s-card card animar-entrada">
          <span class="cinco-s-numero">${indice + 1}º S</span>
          <span class="cinco-s-icone-anel">
            <img class="cinco-s-icone" src="${senso.icone}" alt="Ícone do senso ${senso.nome}" loading="lazy">
          </span>
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
        <a class="botao botao--primario" href="${item.link}" target="_blank" rel="noopener">
          <i data-lucide="external-link" aria-hidden="true"></i>
          <span>${item.rotulo}</span>
        </a>
      `
    )
    .join('');

  // A imagem de banner do topo desta seção foi removida do layout —
  // o campo "imagemPrincipal" do JSON não é mais usado.
  container.innerHTML = `
    <div class="container">
      ${criarCabecalhoSecao(dados.tituloSecao, dados.descricaoSecao)}
      <div class="cinco-s-grid">${sensosHtml}</div>
      <div class="cinco-s-links">${linksHtml}</div>
    </div>
  `;

  escalonarEntrada(container, '.cinco-s-card');
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

  escalonarEntrada(container, '.documento-card');
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
      const origemHtml = quadrante.origem
        ? `<span class="swot-origem">${quadrante.origem}</span>`
        : '';
      const descricaoHtml = quadrante.descricao
        ? `<p class="swot-descricao">${quadrante.descricao}</p>`
        : '';
      const itensHtml = (quadrante.itens || []).map((item) => `<li>${item}</li>`).join('');

      return `
        <div class="swot-quadrante swot-${quadrante.cor} card animar-entrada">
          <div class="swot-cabecalho">
            <span class="swot-icone"><i data-lucide="${icone}" aria-hidden="true"></i></span>
            <h3>${quadrante.tipo}</h3>
            ${origemHtml}
          </div>
          ${descricaoHtml}
          ${itensHtml ? `<ul class="swot-lista">${itensHtml}</ul>` : ''}
        </div>
      `;
    })
    .join('');

  container.innerHTML = `
    <div class="container">
      ${criarCabecalhoSecao(dados.tituloSecao, dados.descricaoSecao, { texto: 'Ver mapeamento completo', link: dados.linkMapeamentoCompleto })}
      <div class="swot-grid">${quadrantesHtml}</div>
    </div>
  `;

  escalonarEntrada(container, '.swot-quadrante');
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

  escalonarEntrada(container, '.regra-card');
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

/* -------------------------------------------------------------------------
   BLOCO 4 — Registro central das seções com fetch + inicializador isolado
   ------------------------------------------------------------------------- */

// Cada entrada é uma seção de conteúdo carregada de forma independente:
// se o JSON de uma falhar, só aquela seção mostra erro — as outras
// continuam funcionando normalmente.
// A seção "indicadores" foi removida por enquanto (volta na Fase 2):
// para reativá-la, recrie a <section id="indicadores"> no index.html,
// a função renderIndicadores() acima e a linha correspondente aqui.
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
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
}

function observarAnimacoes(container) {
  if (!observerAnimacao) return; // prefers-reduced-motion: nada a observar
  container.querySelectorAll('.animar-entrada').forEach((el) => observerAnimacao.observe(el));
}

/* -------------------------------------------------------------------------
   INICIALIZAÇÃO
   ------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', async () => {
  inicializarAnimacoesScroll(); // precisa existir antes das seções chamarem observarAnimacoes()

  await Promise.all([inicializarCabecalho(), ...SECOES.map(inicializarSecao)]);
});
