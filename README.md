# ABC do Tom

Web app (PWA, offline) para ensinar o alfabeto ao Tom (3 anos) num iPad com iOS 16.7.
HTML, CSS e JS puros, sem etapa de build: basta servir a pasta como site estático.

## Rodar localmente

```bash
python3 -m http.server 3002
```

A gravação de voz e o modo offline exigem HTTPS (ou `localhost`).

## Estrutura

- `js/data.js`: letras, figuras (a primeira é a âncora), ordem de introdução, estado inicial e frases faladas.
- `js/store.js`: progresso (localStorage) e motor de repetição espaçada.
- `js/audio.js`: gravações do papai (IndexedDB), voz sintética pt-BR de reserva e efeitos em Web Audio.
- `js/art.js`: ilustrações SVG próprias (escavadeira-mascote, betoneira, pulverizador, retroescavadeira, submarino).
- `js/app.js`: telas (início, jogo, jogo com o papai, letras, garagem, área do papai).
- `sw.js`: cache offline. **Suba a versão `V` a cada deploy.**

## Mecânica didática

- Níveis por letra: nova → aprendendo → praticando → conhecida → dominada.
- Cada sessão tem cerca de 10 rodadas e no máximo 1 letra nova, que só entra se houver menos de 3 letras "aprendendo".
  O limite diário é configurável.
- O número de opções cresce com o nível (2, depois 3, depois 4), e pares parecidos (M/N, E/F, P/R…) não aparecem juntos
  enquanto a letra ainda é frágil.
- Acertar de primeira dá XP. Errar 2 vezes seguidas desce um nível. Para chegar a "dominada", é preciso acertar em outro dia.
- Quando a letra fica "conhecida", o veículo ou figura-âncora dela entra na garagem, e ele nunca sai de lá.
- As opções de cada rodada têm a mesma cor, para o Tom distinguir as letras pela forma, não pela cor.
