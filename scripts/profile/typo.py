"""Text -> SVG path outlines from the Arametric site fonts (fonts/, SIL OFL). HarfBuzz shapes, fontTools draws."""
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import io, os

FD = os.environ.get("FONT_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts"))
FAMILIES = {
    "display": ("archivo-latin-wdth-normal", "archivo-latin-ext-wdth-normal"),
    "serif": ("instrument-serif-latin-400-italic", "instrument-serif-latin-ext-400-italic"),
    "mono": ("jetbrains-mono-latin-wght-normal", "jetbrains-mono-latin-ext-wght-normal"),
    "sans": ("inter-latin-wght-normal", "inter-latin-ext-wght-normal"),
}
_cache = {}

class Face:
    def __init__(self, path):
        data = open(path, "rb").read()
        self.tt = TTFont(io.BytesIO(data))
        self.tt.flavor = None
        buf = io.BytesIO(); self.tt.save(buf); raw = buf.getvalue()
        self.tt = TTFont(io.BytesIO(raw))
        self.hbface = hb.Face(raw)
        self.upem = self.tt["head"].unitsPerEm
        self.cmap = self.tt.getBestCmap()
        self.order = self.tt.getGlyphOrder()
        self.gs = {}

    def glyphset(self, loc):
        key = tuple(sorted(loc.items()))
        if key not in self.gs:
            self.gs[key] = self.tt.getGlyphSet(location=loc or None, normalized=False) if "fvar" in self.tt else self.tt.getGlyphSet()
        return self.gs[key]

def face(name):
    if name not in _cache:
        _cache[name] = Face(os.path.join(FD, name + ".woff2"))
    return _cache[name]

def runs(text, fam):
    a, b = (face(n) for n in FAMILIES[fam])
    out = []
    for ch in text:
        f = a if ord(ch) in a.cmap or ch == " " else (b if ord(ch) in b.cmap else a)
        if out and out[-1][0] is f: out[-1][1] += ch
        else: out.append([f, ch])
    return out

def _shape(f, s, loc):
    font = hb.Font(f.hbface)
    if loc: font.set_variations(loc)
    buf = hb.Buffer(); buf.add_str(s); buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True, "liga": True})
    return buf.glyph_infos, buf.glyph_positions

def measure(text, fam, size, loc=None, ls=0.0):
    return layout(text, fam, size, 0, 0, loc, ls)[1]

def layout(text, fam, size, x, y, loc=None, ls=0.0, anchor="start"):
    """Returns (path_d, advance_width). ls = letter-spacing in em."""
    loc = loc or {}
    parts, pen_x = [], 0.0
    items = []
    for f, s in runs(text, fam):
        infos, poss = _shape(f, s, loc)
        sc = size / f.upem
        gs = f.glyphset(loc)
        for i, p in zip(infos, poss):
            items.append((f, gs, f.order[i.codepoint], pen_x + p.x_offset * sc, p.y_offset * sc, sc))
            pen_x += p.x_advance * sc + ls * size
    width = pen_x - ls * size if items else 0
    dx = {"start": 0, "middle": -width / 2, "end": -width}[anchor]
    for f, gs, gname, gx, gy, sc in items:
        sp = SVGPathPen(gs, ntos=lambda v: ("%.1f" % v).rstrip("0").rstrip("."))
        tp = TransformPen(sp, (sc, 0, 0, -sc, x + dx + gx, y - gy))
        gs[gname].draw(tp)
        d = sp.getCommands()
        if d: parts.append(d)
    return "".join(parts), width

def text(t, fam, size, x, y, fill="#F2F2F2", loc=None, ls=0.0, anchor="start", extra=""):
    d, w = layout(t, fam, size, x, y, loc, ls, anchor)
    return f'<path d="{d}" fill="{fill}"{extra}/>', w

DISPLAY = {"wdth": 62, "wght": 900}       # .display on the site
WORDMARK = {"wdth": 100, "wght": 700}     # Wordmark: font-display bold
MONO = {"wght": 400}
MONO_M = {"wght": 500}
