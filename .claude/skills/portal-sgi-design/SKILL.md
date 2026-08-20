---
name: portal-sgi-design
description: 'Sistema de design e padrões de implementação do Portal SGI (Syensqo) — HTML/CSS/JS puro, sem framework, sem build step. Use ao editar index.html, css/style.css, js/main.js ou qualquer arquivo em /data neste projeto, para manter o padrão visual premium, a arquitetura "zero conteúdo hardcoded" e evitar as armadilhas técnicas já mapeadas (Lucide + CSS, timing de conteúdo assíncrono, restrições de iframe).'
user-invocable: false
---

# Sistema de design — Portal SGI

Guia de continuidade para quem (ou qual sessão do Claude) editar este site depois. Não é uma introdução ao projeto — é a lista de decisões, padrões e armadilhas já resolvidas, para não retrabalhar nem reintroduzir bugs já corrigidos.

## Princípio central (não negociável)

Zero texto, link ou caminho de imagem hardcoded em `index.html`, `css/style.css` ou `js/main.js`. Tudo vive em JSONs comentados em `/data`, lidos por `carregarJSON()` e injetados por uma função `renderX(dados, container)` por seção, registradas em `SECOES` (bloco 4 de `main.js`). Antes de adicionar conteúdo novo, pergunte: "isso pertence a um JSON, não ao código?" — quase sempre a resposta é sim.

Cada seção carrega seu próprio JSON de forma isolada (`inicializarSecao`): um erro numa seção nunca derruba as outras. Não quebre esse isolamento.

## Armadilha nº1: seletor CSS `elemento i { }` não funciona em ícones Lucide

`lucide.createIcons()` **substitui** cada `<i data-lucide="...">` por um `<svg class="lucide lucide-nome-do-icone ...">` — a tag deixa de ser `i`. Qualquer regra CSS que dependa do nome da tag (`.wrapper i { width: 20px }`) simplesmente **nunca casa** com o SVG resultante e falha silenciosamente (o ícone renderiza no tamanho padrão do Lucide, 24×24, sem erro nenhum no console). Isso já causou bugs reais nesta sessão (ícones do menu aparecendo no desktop quando deveriam estar ocultos; ícone do eyebrow do Hero saindo em 24px em vez de 14px).

**Regra**: toda vez que estilizar um ícone por um seletor DESCENDENTE de um wrapper, sempre pareie a tag e o SVG:

```css
.meu-wrapper i,
.meu-wrapper svg {
  width: 20px;
  height: 20px;
}
```

**Exceção que já funciona sem essa duplicação**: quando a classe está diretamente no próprio elemento do ícone (`<i class="link-rapido-seta" data-lucide="...">`), o Lucide preserva essa classe no SVG resultante (`class="lucide lucide-arrow-up-right link-rapido-seta"`), então `.link-rapido-seta { width: 16px }` funciona sem duplicar seletor. Prefira esse padrão (classe no próprio ícone) quando possível — só use a forma `wrapper i, wrapper svg` quando o ícone realmente precisa ficar sem classe própria (ex: veio de um campo JSON dinâmico como `regra.icone`).

## Armadilha nº2: trocar o ícone de um elemento dinamicamente

Nunca faça `elemento.querySelector('i').setAttribute('data-lucide', 'novo-nome')` esperando que `lucide.createIcons()` reprocesse — se `createIcons()` já rodou uma vez, aquele `i` já virou `svg` e o `querySelector('i')` não encontra mais nada.

**Padrão correto** (usado no toggle do menu mobile, `menu` ↔ `x`): envolva o ícone num wrapper estável e regenere o HTML dele do zero a cada troca:

```html
<span class="nav-toggle-icone"><i data-lucide="menu" aria-hidden="true"></i></span>
```
```js
function trocarIcone(wrapper, nome) {
  wrapper.innerHTML = `<i data-lucide="${nome}" aria-hidden="true"></i>`;
  if (window.lucide) lucide.createIcons();
}
```

## Armadilha nº3: estado calculado a partir de posição/layout, com conteúdo assíncrono

As 10 seções carregam via `fetch()` em paralelo — cada uma muda de altura num momento diferente enquanto o conteúdo chega. Qualquer lógica que dependa da posição/altura de elementos (como o "scroll spy" que destaca o item ativo do menu) **não pode confiar em eventos cumulativos** (ex: `IntersectionObserver` reagindo só a "entrou/saiu") porque um layout ainda instável pode disparar um evento prematuro que nunca é corrigido depois (bug real: "Cronograma" ficava marcado como ativo no carregamento da página, antes de qualquer scroll).

**Padrão correto** (ver `inicializarScrollSpy` em `main.js`): recalcule do zero a partir das posições REAIS atuais (`getBoundingClientRect()`) toda vez, nunca a partir de histórico de eventos. E só faça o cálculo inicial depois que **todas** as seções terminaram de renderizar — no bloco de inicialização, isso é um `Promise.all([inicializarNavegacao(), ...SECOES.map(inicializarSecao)])` antes de chamar a função de estado inicial. O evento `window.load` dispara cedo demais para servir esse propósito (não espera os `fetch()` de `/data`).

## Restrição de iframe (SharePoint)

- A navegação (`.nav-topo`) é **sempre `position: sticky`, nunca `fixed`** — um iframe com altura automática (comum em embeds do SharePoint) não gera scroll interno, e um elemento `fixed` simplesmente some de vista. Isso já está documentado e testado (ver README.md, seção "Sobre a incorporação no site do SharePoint").
- Elementos temporários tipo backdrop/overlay de modal (ex: `.nav-backdrop`) usam `position: absolute` (relativo ao container `sticky` mais próximo), não `fixed` — mantém o mesmo raciocínio mesmo em UI transitória.
- `window.addEventListener('scroll', ...)` funciona normalmente dentro de um iframe (escuta o scroll do próprio documento do iframe) — já usado para o efeito de vidro da nav e para o scroll-spy.

## Paleta e contraste (WCAG AA)

`--cor-acento` (`#BA4F0A`) foi calibrado especificamente para manter contraste ≥ 4.5:1 como texto E como fundo de botão com texto branco, nos 3 fundos claros do site (`--cor-fundo` `#FFFDFB`, `--cor-fundo-alt` `#F5F5F5`, branco puro). **Se for trocar essa cor, recalcule o contraste antes de aplicar** — não é só "escolher um laranja bonito", o tom original da marca (`#E8630C`) falha AA (3.38:1). Script de referência para recalcular (fórmula WCAG de luminância relativa):

```js
function hexToRgb(h){const n=parseInt(h.replace('#',''),16);return[(n>>16)&255,(n>>8)&255,n&255];}
function luminancia([r,g,b]){const f=c=>{c/=255;return c<=0.03928?c/12.92:((c+0.055)/1.055)**2.4};const[R,G,B]=[r,g,b].map(f);return 0.2126*R+0.7152*G+0.0722*B;}
function contraste(h1,h2){const l1=luminancia(hexToRgb(h1)),l2=luminancia(hexToRgb(h2));const[a,b]=l1>l2?[l1,l2]:[l2,l1];return(a+0.05)/(b+0.05);}
// precisa ser >= 4.5 para texto normal, >= 3 para texto grande (>=18.66px bold ou >=24px regular)
```

Todos os outros tokens (espaçamento, raios, sombras, tipografia) ficam no bloco `:root` no topo de `style.css`, comentados por categoria.

## Linguagem visual já estabelecida (reaproveite, não reinvente)

- **Microinteração "seta desliza no hover"**: usada em Links Rápidos, Políticas, Documentos Padrão — uma `<i class="X-seta" data-lucide="arrow-up-right">` posicionada `absolute` no canto do card, `opacity:0` + `transform: translate(-4px, 4px)`, animando para `opacity:1` + `translate(0,0)` no `:hover` do card pai. Reaproveite esse padrão em qualquer novo card com link externo, em vez de inventar outra microinteração.
- **Ícone misto (`tipoIcone`/`valorIcone`)**: `"lucide"` (nome do ícone) ou `"imagem"` (caminho em `/imagens`), resolvido por `renderizarIcone()`. Usado em Links Rápidos; o mesmo mecanismo (ícone por campo de enum controlado, nunca por texto livre) é o padrão para qualquer lookup JS→ícone (ver `ICONES_POR_TIPO_ARQUIVO`, `ICONES_POR_COR_SWOT` — sempre chaveados por um campo de valores fechados/documentados no `_comentario` do JSON, nunca por texto livre como o título de um item, que um editor não-técnico poderia digitar diferente).
- **Cards**: classe `.card` genérica (fundo branco, sombra sutil, eleva no hover) combinada com uma classe específica da seção para layout interno.
- **Animação de entrada**: classe `.animar-entrada` + `IntersectionObserver` compartilhado (`observarAnimacoes()`, chamado por seção após seu próprio render). Entrada escalonada (SWOT, e qualquer nova seção que precise) via `transition-delay` em CSS por `:nth-child`, nunca via `setTimeout`/delay em JS — mais simples de neutralizar globalmente no bloco `prefers-reduced-motion` (que já zera `transition-delay` para todo mundo).
- **Accordion**: um aberto por vez (ver `alternarAccordionRegra`), altura animada via `grid-template-rows: 0fr → 1fr` (não `max-height` nem JS medindo `scrollHeight`) — mais robusto a conteúdo de tamanho variável.

## Workflow de teste (siga antes de considerar algo pronto)

1. `fetch()` não funciona em `file://` — sempre suba um servidor local antes de testar: `python -m http.server 8123` na raiz do projeto.
2. Valide num browser real, não só lendo o código. O Chromium do Playwright já está em cache local (`C:\Users\muril\AppData\Local\ms-playwright`) — não precisa reinstalar; um script Node simples com `require('playwright')` + `chromium.launch()` é suficiente (ver os testes que já rodaram nesta sessão para o padrão).
3. Depois de qualquer mudança em `main.js`, cheque erros de **console E de rede** (`page.on('console')`, `page.on('pageerror')`, `page.on('requestfailed')`) — alguns bugs (como o locale do FullCalendar que sempre dava 404) não aparecem como erro JS, só como falha de rede silenciosa.
4. Teste `prefers-reduced-motion` via `page.emulateMedia({ reducedMotion: 'reduce' })` sempre que mexer em algo animado.
5. Teste o embed em iframe antes de considerar uma mudança de nav/scroll pronta: um HTML simples com `<iframe style="height:90vh">` apontando pro servidor local, verificando que o scroll fica isolado dentro do iframe e a nav não escapa.
6. Use um perfil de browser limpo (`chromium.launchPersistentContext('./perfil-temp', ...)`) quando precisar descartar cache entre testes (ex: para confirmar que um recurso 404 é real, não mascarado por cache de uma execução anterior).
