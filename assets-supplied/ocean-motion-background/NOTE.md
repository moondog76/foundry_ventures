# Ocean motion background — reference copy

The supplied package as delivered on 2026-08-11, kept so the port in
`src/components/home/AmbientOcean.tsx` can be compared against its original.

The media files are **not** duplicated here — they would be ~4MB of identical
bytes in git. They live at their served location:

    public/media/ocean/ocean-poster.jpg
    public/media/ocean/ocean-loop-1440p.{webm,mp4}
    public/media/ocean/ocean-loop-mobile.{webm,mp4}

`source/ocean-source.png` was the same image as `assets-supplied/hero-ocean.png`
and was dropped for the same reason.

`index.html` and `demo.css` are the package's own demo page. They are reference
only — nothing in the site loads them, and `motion-background.js` is not shipped
either: its logic was ported into the React component so the listeners have real
teardown and the effect is scoped to the hero rather than the whole document.
