# Portal do SGI — Guia de Manutenção

Este site mostra as informações do Sistema de Gestão Integrado (SGI) das
unidades Itatiba, Taboão da Serra e Paulínia. Ele é feito de páginas
simples (HTML, CSS e JavaScript) e **não precisa de nenhum programa
especial para ser editado** — todo o conteúdo (textos, links e imagens)
fica em arquivos de dados separados, dentro da pasta `data`.

**Regra de ouro: para trocar um texto, um link ou uma imagem, você só
precisa editar um arquivo dentro da pasta `data`. Nunca é preciso mexer
nos arquivos `index.html`, `css/style.css` ou `js/main.js`.**

---

## Como editar o conteúdo

Cada seção do site tem o seu próprio arquivo dentro da pasta `data`.
Abra o arquivo com o Bloco de Notas, VS Code, ou qualquer editor de
texto simples (não use o Word — ele pode estragar o formato do
arquivo).

Todo arquivo `.json` segue o mesmo tipo de estrutura: chaves entre
aspas, dois pontos, e o valor. Listas de itens ficam entre colchetes
`[ ]`, e cada item entre chaves `{ }`, separado por vírgula. **A
vírgula do último item de uma lista deve ser removida** — esse é o
erro mais comum ao editar um JSON manualmente.

> Dica: depois de editar, cole o conteúdo do arquivo em
> [jsonlint.com](https://jsonlint.com) para checar se não ficou nada
> errado, antes de salvar.

Cada arquivo começa com uma chave `"_comentario"` explicando o que
aquele arquivo controla e dando um exemplo de como adicionar um item
novo — leia esse comentário antes de editar. Abaixo está um resumo de
cada arquivo:

| Arquivo | O que controla |
|---|---|
| `data/config.json` | Título e unidades exibidas na capa (Hero), frases que giram automaticamente, itens do menu de navegação (com ícone) e o texto do rodapé. |
| `data/links-rapidos.json` | Os 5 cards de acesso rápido no topo (PDQ/NC, NC Fornecedor, etc). |
| `data/certificacoes.json` | Os selos de certificação (ISO, HALAL, RSPO...) e os links de cada certificado. |
| `data/politicas.json` | As políticas (Qualidade, HSE, Halal, Atuação Responsável). |
| `data/5s.json` | A seção do Programa 5S: os cinco sensos e os links de Itatiba/Taboão. |
| `data/eventos.json` | O calendário de auditorias. **Veja o aviso importante abaixo.** |
| `data/documentos-padrao.json` | Os documentos RHSco-002 e RHSco-003. |
| `data/swot.json` | Os 4 quadrantes da Matriz SWOT. |
| `data/oito-regras.json` | As 8 Regras da Qualidade (resumo e texto completo de cada uma). |
| `data/indicadores.json` | O texto da seção "Indicadores" (ainda em construção). |

### Exemplo prático: a capa do site (`data/config.json`)

```json
"hero": {
  "titulo": "Sistema de Gestão Integrado – SGI",
  "unidades": ["Itatiba", "Taboão da Serra", "Paulínia"],
  "frases": ["Frase 1", "Frase 2", "Frase 3"],
  "intervaloTrocaFraseMs": 6000
}
```

- `"unidades"` é a lista de unidades mostrada no selo pequeno acima do
  título — para adicionar uma unidade nova, basta acrescentar um nome
  na lista.
- `"frases"` pode ter quantos itens quiser; eles alternam automaticamente
  na tela a cada `"intervaloTrocaFraseMs"` milissegundos (6000 = 6 segundos).
- Cada item de `"menu"` também tem um campo `"icone"` (nome de um ícone
  de [lucide.dev/icons](https://lucide.dev/icons)), usado no menu do
  celular — no computador o menu fica só com texto, sem ícones.

### Exemplo prático: adicionar um novo item de Link Rápido

Abra `data/links-rapidos.json` e adicione um bloco dentro da lista
`"itens"`, com vírgula separando do item anterior:

```json
{
  "titulo": "Meu Novo Link",
  "link": "https://exemplo.sharepoint.com/meu-documento",
  "tipoIcone": "lucide",
  "valorIcone": "link"
}
```

- `tipoIcone` pode ser `"lucide"` (um ícone pronto — veja nomes em
  [lucide.dev/icons](https://lucide.dev/icons)) ou `"imagem"` (uma
  foto/logo salva na pasta `imagens`).
- Se usar `"imagem"`, `valorIcone` deve ser o caminho do arquivo, por
  exemplo `"imagens/meu-icone.jpeg"`.

O mesmo mecanismo de ícone (`tipoIcone`/`valorIcone`) é usado também em
`documentos-padrao.json` — só que ali o ícone já é escolhido
automaticamente pelo campo `tipoArquivo` (`"word"`, `"excel"` ou
`"pdf"`).

### Aviso importante: o calendário (`data/eventos.json`)

O campo `dataFim` de cada evento é **exclusivo** — ele deve ser sempre
o dia **seguinte** ao último dia do evento, senão o calendário mostra
um dia a menos.

Exemplo: uma auditoria que acontece nos dias **15 e 16** de setembro:

```json
{
  "titulo": "Auditoria Interna - Itatiba",
  "dataInicio": "2026-09-15",
  "dataFim": "2026-09-17",
  "tipo": "Interna",
  "unidade": "Itatiba"
}
```

Repare que `dataFim` é "17", não "16" — isso é assim mesmo, é como o
calendário funciona. Para um evento de um único dia (por exemplo, só
o dia 5 de outubro), `dataFim` deve ser o dia 6.

O campo `"tipo"` de cada evento precisa ser exatamente um dos nomes
que aparecem em `"tiposAuditoria"` no topo do mesmo arquivo (por
exemplo `"Interna"`, `"Externa"` ou `"Certificação"`) — se você digitar
diferente, o evento aparece no calendário sem cor.

### Trocando imagens

As imagens ficam na pasta `imagens`. Para trocar uma imagem (por
exemplo, um selo de certificação), salve a nova imagem nessa pasta e
atualize o caminho no arquivo `.json` correspondente (campo `"imagem"`,
`"icone"` ou `"logo"`, dependendo da seção).

---

## Como testar suas alterações antes de publicar

Os arquivos `.json` são carregados pelo navegador através de uma
requisição de rede — por isso, **abrir o `index.html` direto do seu
computador (clicando duas vezes) não funciona**, o navegador bloqueia
esse tipo de carregamento por segurança.

Para testar localmente, é preciso um "servidor" simples. Se você tiver
Python instalado, abra o terminal na pasta do projeto e rode:

```
python -m http.server 8000
```

Depois acesse `http://localhost:8000` no navegador. Se uma seção não
carregar, ela mostra uma mensagem discreta de erro (o resto do site
continua funcionando normalmente) — abra o Console do navegador (tecla
F12) para ver qual arquivo `.json` tem o problema.

---

## Como publicar as alterações

O site é hospedado no GitHub Pages. Depois de editar e testar os
arquivos, é preciso enviar (`commit` + `push`) as mudanças para o
repositório no GitHub — a publicação acontece automaticamente alguns
minutos depois do envio. Se você não tem familiaridade com Git, peça
para alguém da equipe de Transformação Digital fazer esse envio para
você.

---

## Sobre a incorporação no site do SharePoint

O portal é embutido no SharePoint através de um "web part" de
incorporação (iframe). Para o menu do site funcionar corretamente
"grudado" no topo durante a rolagem, **configure o iframe com uma
altura fixa** (por exemplo, 90% da altura da tela), em vez de deixar
que ele cresça automaticamente para caber todo o conteúdo. Isso é uma
opção do próprio web part de incorporação do SharePoint.

---

## Se algo der errado

- **Uma seção não aparece / mostra uma mensagem de erro discreta:**
  o arquivo `.json` daquela seção provavelmente tem um erro de
  formatação (esqueceu uma vírgula, uma aspas, etc). Cole o conteúdo
  do arquivo em [jsonlint.com](https://jsonlint.com) para descobrir
  onde está o problema.
- **O site inteiro não carrega:** provavelmente um problema no
  `index.html`, `style.css` ou `main.js` — esses arquivos não deveriam
  ser editados; se algo mudou neles por engano, peça ajuda técnica.
- **Uma imagem não aparece:** confira se o nome do arquivo no `.json`
  é exatamente igual ao nome do arquivo dentro da pasta `imagens`
  (maiúsculas/minúsculas importam).
