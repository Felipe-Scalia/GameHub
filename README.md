# GameHub 🎮

O GameHub é uma plataforma web voltada à descoberta e organização de jogos eletrônicos, desenvolvida como projeto acadêmico para a disciplina de Desenvolvimento de Interfaces do curso de Ciência da Computação.

O projeto busca oferecer uma interface moderna, responsiva, intuitiva e acessível, permitindo que os usuários explorem diferentes jogos e organizem sua própria biblioteca de favoritos.

## Acesse o projeto

🌐 https://gamehub-eta-six.vercel.app/

## Funcionalidades

- Catálogo de jogos integrado à API RAWG.
- Carrossel de jogos em destaque.
- Pesquisa de jogos por nome.
- Filtros por gênero e plataforma.
- Ordenação dos resultados.
- Visualização de informações e avaliações dos jogos.
- Biblioteca pessoal de favoritos.
- Sorteador de jogos favoritos.
- Alternância entre tema claro e escuro.
- Ajuste do tamanho das fontes.
- Modo de alto contraste.
- Formulário de contato com validação.
- Interface responsiva para computadores, tablets e celulares.

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript
- Bootstrap 5
- RAWG API
- Node.js
- Vercel Functions
- LocalStorage
- Git e GitHub

## Integração com a API

O GameHub utiliza a API RAWG para obter informações sobre jogos, incluindo imagens, avaliações, gêneros, plataformas e datas de lançamento.

As requisições são intermediadas por uma função serverless hospedada na Vercel, permitindo que a chave da API seja armazenada em uma variável de ambiente, sem exposição direta no código do navegador.

## Estrutura do projeto

- `index.html` — Estrutura e conteúdo da interface.
- `css/style.css` — Estilização, responsividade e recursos visuais.
- `js/script.js` — Interatividade, gerenciamento de dados e funcionalidades.
- `api/games.js` — Comunicação com a API RAWG.
- `.gitignore` — Configuração dos arquivos ignorados pelo Git.
- `README.md` — Documentação do projeto.

## Acessibilidade

O projeto incorpora práticas de acessibilidade inspiradas nas diretrizes WCAG, buscando proporcionar uma experiência mais inclusiva.

Entre os recursos implementados estão a navegação por teclado, indicadores de foco, ajustes de tamanho de fonte, alto contraste e suporte à preferência por movimento reduzido.

## Identidade visual

A identidade visual do GameHub utiliza tons de roxo e azul, combinados com elementos modernos e uma interface inspirada no universo dos jogos eletrônicos.

| Cor | Código |
|---|---|
| Fundo escuro | `#0B1020` |
| Fundo dos cards | `#171D32` |
| Roxo principal | `#7C3AED` |
| Roxo secundário | `#A78BFA` |
| Azul de destaque | `#22D3EE` |
| Texto claro | `#F8FAFC` |

## Objetivos acadêmicos

- Aplicar conhecimentos de desenvolvimento web.
- Desenvolver interfaces responsivas e intuitivas.
- Trabalhar com APIs externas.
- Aplic
