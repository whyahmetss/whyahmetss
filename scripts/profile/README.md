# Profile artwork

Every SVG in `assets/profile/` comes from `build.py`. Edit copy, colours and layout there, then rebuild:

```
pip install -r scripts/profile/requirements.txt
python3 scripts/profile/build.py
```

- Type is outlined from the Arametric site fonts in `fonts/` (Archivo, Instrument Serif, JetBrains Mono, Inter — SIL Open Font License), so GitHub renders it exactly without loading any font.
- `media/` holds the inlined images: portrait, film grain, and the three work frames.
- Motion is SMIL. Every animation rests on a finished frame, so the artwork reads the same where motion does not run.
- Each section has a desktop file (838 px wide) and a `-mobile` file (420 px) that README switches with `<picture>` at 600 px.
