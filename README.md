# Sistema de Viação Universitária — Protótipo

Protótipo de demonstração para a **Viação Nossa Senhora D'Abadia** (Coromandel-MG), feito para
apresentar antes de fechar o projeto. Cobre os 3 perfis do sistema: Administrador, Aluno e Financeiro.

**Sem backend / banco de dados** — os dados em `data/mock.js` ficam só em memória, servem pra
mostrar o fluxo completo pro cliente. Recarregar a página reseta tudo pro estado inicial.

## Como ver

Abra `index.html` num navegador, ou suba qualquer servidor estático na pasta (ex.: `python -m http.server`).

Na tela inicial, escolha um perfil pra entrar:

- **Administrador** — cadastra/edita alunos, ônibus e pontos; acompanha mensalidades e relatórios.
- **Aluno** — escolha qual aluno (mock) quer simular; consulta dados, mensalidades e transporte.
- **Financeiro** — controla mensalidades, registra pagamentos, vê inadimplentes e relatórios.

## Próximos passos (se o cliente fechar)

- Trocar `data/mock.js` por um backend de verdade com banco de dados.
- Login real por perfil (hoje é só seleção, sem senha).
- Emissão de relatórios em PDF/Excel.
