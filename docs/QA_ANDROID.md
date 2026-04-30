# QA Android - ENEM Redações

Use este roteiro no Expo Go em pelo menos 3 tamanhos de tela: pequeno, médio e grande.

## Preparação

1. Inicie o backend:

```bash
cd backend
npm run dev
```

2. Inicie o app:

```bash
npx expo start --clear
```

3. Abra no Expo Go e teste com a barra de navegação Android ativa.

## Checklist Visual

- Nenhum botão fica atrás da barra inferior do Android.
- A barra inferior professor/aluno tem área de toque confortável.
- Textos longos quebram linha sem sair do card.
- Inputs não ficam cobertos pelo teclado.
- Cards não ficam colados no rodapé.
- Preview da foto aparece inteiro e com respiro.
- Tela de resultado rola até o fim sem cortar ações.

## Fluxo Professor

- Entrar como professor.
- Abrir dashboard.
- Criar aluno.
- Criar tema.
- Criar nova redação com Tema Livre.
- Anexar foto.
- Revisar envio.
- Salvar e corrigir.
- Abrir detalhe da redação.
- Abrir resultado.
- Voltar ao aluno.
- Gerar relatório do aluno.

## Fluxo Aluno

- Entrar como aluno com código.
- Abrir home.
- Ver redações.
- Ver evolução.
- Ver ranking.
- Enviar nova redação se disponível.

## O Que Fotografar Se Houver Problema

- Tela inteira, incluindo a barra de navegação do Android.
- Modelo/tamanho do aparelho.
- Nome da tela.
- Ação feita imediatamente antes do problema.
