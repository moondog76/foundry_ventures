# Ocean Motion Background

Ett färdigt webbpaket av den bifogade havsbilden. Bakgrunden har en lugn,
ljudlös videoloop och reagerar mjukt på både muspekare och scroll.

## Innehåll

- `index.html` – en färdig demo som visar effekten på en lång sida.
- `motion-background.css` – bakgrundens placering, posterbild och rörelse.
- `demo.css` – endast exempelssidans typografi och layout.
- `motion-background.js` – mjuk mus- och scrollparallax.
- `assets/ocean-loop-1440p.webm` – mindre fil för moderna webbläsare.
- `assets/ocean-loop-1440p.mp4` – kompatibel reserv, bland annat för Safari.
- `assets/ocean-loop-mobile.*` – lättare 1280 × 720-versioner för mobil.
- `assets/ocean-poster.jpg` – visas innan videon laddat och vid reducerad rörelse.
- `source/ocean-source.png` – originalbilden, oförändrad.

Videon är 2560 × 1440, 30 bilder per sekund och 8 sekunder lång. Den har
inget ljud och är gjord för att loopa utan ett synligt hopp.

## Prova demon

Öppna `index.html` i en webbläsare. Rör muspekaren över sidan och scrolla
mellan de tre sektionerna.

## Lägg in bakgrunden på en annan webbplats

Kopiera mappen `assets` samt `motion-background.css` och
`motion-background.js` till webbplatsen. `demo.css` behövs inte. Lägg sedan
detta direkt efter `<body>`:

```html
<div class="ambient-background" data-ambient-background aria-hidden="true">
  <video
    class="ambient-background__video"
    autoplay
    muted
    loop
    playsinline
    preload="metadata"
    poster="./assets/ocean-poster.jpg"
  >
    <source
      src="./assets/ocean-loop-mobile.webm"
      type="video/webm"
      media="(max-width: 767px)"
    />
    <source
      src="./assets/ocean-loop-mobile.mp4"
      type="video/mp4"
      media="(max-width: 767px)"
    />
    <source src="./assets/ocean-loop-1440p.webm" type="video/webm" />
    <source src="./assets/ocean-loop-1440p.mp4" type="video/mp4" />
  </video>
  <div class="ambient-background__veil"></div>
</div>
```

Länka filerna i sidans `<head>`:

```html
<link rel="stylesheet" href="./motion-background.css" />
<script src="./motion-background.js" defer></script>
```

Sidans eget innehåll ska ligga ovanpå bakgrunden. Ge dess yttersta element
`position: relative` och `z-index: 1`, precis som `.site-content` i demon.

Om filerna hamnar i andra mappar, justera sökvägarna i HTML och CSS.

## Anpassa rörelsen

Styrkan ligger samlad högst upp i `motion-background.js`:

```js
const settings = {
  pointerX: 0.03,
  pointerY: 0.022,
  scrollTravel: 0.06,
  rotation: 0.16,
  easing: 0.085,
};
```

Minska värdena för en lugnare effekt. Bakgrunden stängs automatiskt av om
besökaren har valt reducerad rörelse eller datasparläge, och videon pausas när
webbläsarfliken inte syns.
