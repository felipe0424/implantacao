# Implantação Grupo Empresarial Pastelandia

Site interativo para planejamento semanal de implantação técnica com **drag-and-drop**.

## Funcionalidades

- Quadro semanal por técnico:
  - **DIAS**
  - **FRANÇA**
  - **RAMOS**
  - **VIDAL**
- Backlog de empresas com cards arrastáveis.
- Arraste para dia/horário/técnico.
- Permite mover de volta para backlog.
- Persistência em `localStorage` (não perde ao atualizar a página).
- Filtros por técnico e dia.
- Layout responsivo e visual moderno.

## Estrutura

- `index.html` → estrutura da página
- `styles.css` → estilo visual
- `script.js` → lógica de calendário e drag-and-drop

## Como usar

1. Abra `index.html` no navegador.
2. Arraste os cards do backlog para os slots da tabela (dia/técnico/horário).
3. Para remover uma alocação, arraste o card de volta para o backlog.
4. Use o botão **Resetar alocações** para limpar tudo.

## Dados iniciais

O projeto já inicia com os cards das empresas:

- `74051 - SORVETES NESTLE VILAREJO - PETROLINA`
- `74041 - SORVETES NETLE SHOPPING - PETROLINA`

Você pode editar os dados no array `companies` dentro de `script.js`.

## Publicar no GitHub Pages (opcional)

1. Faça commit dos arquivos.
2. Em **Settings > Pages** no repositório.
3. Em **Build and deployment**, selecione:
   - Source: `Deploy from a branch`
   - Branch: `main` (ou padrão) / `/root`
4. Salve e aguarde o link de publicação.
