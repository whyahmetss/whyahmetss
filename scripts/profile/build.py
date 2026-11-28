"""ARAMETRIC — GitHub profile artwork (concept B, Cinematic Identity).
Every file in assets/profile/ is built here as a self-contained SVG: type is outlined from the Arametric
site fonts (fonts/), raster media is inlined as data URIs, motion is SMIL that always rests on a finished
frame. No JS, no external requests, deterministic output.
Run from the repo root:  python3 scripts/profile/build.py
"""
import base64, math, os
import typo
from typo import DISPLAY, WORDMARK, MONO, MONO_M

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "profile")
os.makedirs(OUT, exist_ok=True)
HERE = os.path.dirname(os.path.abspath(__file__))
MEDIA = os.path.join(HERE, "media")

INK, INK2, PAPER, MUTE, DIM, ACID = "#050505", "#0C0C0C", "#F2F2F2", "#9A9A9A", "#3A3A3A", "#4ADE80"
EASE = 'calcMode="spline" keySplines="0.16 1 0.3 1"'  # --ease-brand

def b64(path, mime):
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()

PORTRAIT_S = b64(os.path.join(MEDIA, "portrait.jpg"), "image/jpeg")
NOISE = b64(os.path.join(MEDIA, "noise.png"), "image/png")

CONTENT = dict(
    brand="ARAMETRIC", studio="Creative & Technology Studio", owner="Ahmet Çavdar",
    role="Founder / Builder", slogan="Build systems that outlast you.",
    sub="Building digital products, creative systems and intelligent production tools.",
    site="arametric.studio",
)
ALT = (f"{CONTENT['brand']} — {CONTENT['studio']}. {CONTENT['owner']} — {CONTENT['role']}. "
       f"{CONTENT['slogan']} {CONTENT['sub']} {CONTENT['site']}")

# ---------------------------------------------------------------- helpers
def T(t, fam, size, x, y, fill=PAPER, loc=None, ls=0.0, anchor="start", extra=""):
    return typo.text(t, fam, size, x, y, fill, loc, ls, anchor, extra)

def mono(t, x, y, size=10.5, fill=MUTE, ls=0.14, anchor="start", w=MONO, extra=""):
    return T(t.upper(), "mono", size, x, y, fill, w, ls, anchor, extra)

def logo_mark(x, y, s, stroke=PAPER, square=ACID, sq_extra=""):
    k = s / 32
    return (f'<g transform="translate({x} {y}) scale({k:.4f})">'
            f'<path d="M5 28 16 4l11 24" fill="none" stroke="{stroke}" stroke-width="3.2" stroke-linecap="square"/>'
            f'<rect x="13.2" y="17.2" width="5.6" height="5.6" fill="{square}">{sq_extra}</rect></g>')

def wordmark(x, y, size, fill=PAPER):
    """Site Wordmark: LogoMark (1.1em) + gap 0.5rem + Archivo bold, tracking -0.02em."""
    m = size * 1.1
    p, w = T(CONTENT["brand"], "display", size, x + m + size * 0.5, y, fill, WORDMARK, -0.02)
    return logo_mark(x, y - size * 0.86, m) + p, m + size * 0.5 + w

def arrow_ne(x, y, s, color):
    return (f'<path d="M{x} {y+s}L{x+s} {y}M{x+s*0.3} {y}H{x+s}V{y+s*0.7}" fill="none" stroke="{color}" '
            f'stroke-width="1.3" stroke-linecap="square"/>')

def para(t, x, y, size, lh, maxw, fill=MUTE, fam="sans", loc=None):
    loc = loc or {"wght": 400}
    words, lines, cur = t.split(), [], ""
    for w in words:
        nxt = (cur + " " + w).strip()
        if typo.measure(nxt, fam, size, loc) > maxw and cur:
            lines.append(cur); cur = w
        else:
            cur = nxt
    lines.append(cur)
    return "".join(T(l, fam, size, x, y + i * lh, fill, loc)[0] for i, l in enumerate(lines)), len(lines)

def reveal(y_from, begin, dur=1.4):
    """Line-mask rise (site hero: yPercent 110 → 0). Static frame = final position."""
    return (f'<animateTransform attributeName="transform" type="translate" values="0 {y_from};0 0" keyTimes="0;1" '
            f'{EASE} dur="{dur}s" begin="{begin}s" fill="freeze"/>')

def fade(begin, dur=1.2):
    return f'<animate attributeName="opacity" values="0;1" keyTimes="0;1" {EASE} dur="{dur}s" begin="{begin}s" fill="freeze"/>'

def svg(w, h, body, defs="", title="ARAMETRIC", rx=16):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-labelledby="t d">
<title id="t">{title}</title>
<desc id="d">{ALT.replace("&", "&amp;")}</desc>
<style>@media (prefers-color-scheme: light){{.edge{{stroke:#D0D7DE;stroke-opacity:1}}}}@media (prefers-reduced-motion: reduce){{*{{animation:none!important}}}}</style>
<defs>
<clipPath id="frame"><rect width="{w}" height="{h}" rx="{rx}"/></clipPath>
<pattern id="grain" width="192" height="192" patternUnits="userSpaceOnUse"><image width="192" height="192" href="{NOISE}" xlink:href="{NOISE}"/></pattern>
{defs}
</defs>
<g clip-path="url(#frame)">
{body}
<rect width="{w}" height="{h}" fill="url(#grain)" opacity="0.07" style="mix-blend-mode:screen"/>
</g>
<rect class="edge" x=".5" y=".5" width="{w-1}" height="{h-1}" rx="{rx-.5}" fill="none" stroke="#F2F2F2" stroke-opacity=".09"/>
</svg>
'''

def save(name, s):
    p = os.path.join(OUT, name)
    open(p, "w").write(s)
    print(f"{name:28s} {len(s)/1024:7.1f} KB")

def img(href, x, y, w, h, extra=""):
    return f'<image x="{x}" y="{y}" width="{w}" height="{h}" href="{href}" xlink:href="{href}" preserveAspectRatio="xMidYMid slice"{extra}/>'

# ---------------------------------------------------------------- QR (port of site QrPattern.tsx)
def qr_path(seed, n=21):
    M = 0xFFFFFFFF
    h = 2166136261
    for c in seed:
        h = ((h ^ ord(c)) * 16777619) & M
    state = [h]
    def r():
        v = state[0]
        v ^= (v << 13) & M; v &= M
        v ^= v >> 17
        v ^= (v << 5) & M; v &= M
        state[0] = v
        return (v % 1000) / 1000
    inf = lambda x, y: (x < 8 and y < 8) or (x > n - 9 and y < 8) or (x < 8 and y > n - 9)
    cells = "".join(f"M{x} {y}h1v1h-1z" for y in range(n) for x in range(n) if not inf(x, y) and r() > 0.52)
    f = lambda x, y: f"M{x} {y}h7v7h-7zM{x+1} {y+1}v5h5v-5zM{x+2} {y+2}h3v3h-3z"
    return cells, f(0, 0) + f(n - 7, 0) + f(0, n - 7)

QR_CELLS, QR_FIND = qr_path("ARAMETRİC" + "Ahmet Çavdar")

def qr(x, y, s, color):
    k = s / 21
    return (f'<g transform="translate({x} {y}) scale({k:.4f})" fill="{color}" shape-rendering="crispEdges">'
            f'<path d="{QR_CELLS}"/><path d="{QR_FIND}" fill-rule="evenodd"/></g>')

# =============================================================== A — EDITORIAL FOUNDER

# =============================================================== HERO — CINEMATIC IDENTITY
def id_card(cx, top, w, anim_rot=True, rope_top=0, base_rot=-3.2):
    """The site's hanging ID card (HangingCard.tsx), drawn as a static object with a slow sway."""
    h = w * 1.52
    x = cx - w / 2
    pad = w * 0.08
    ph = w - 2 * pad
    py = top + pad + 6 + w * 0.07 + 16
    rope = f'<path d="M{cx} {rope_top}V{top-4}" stroke="url(#bRope)" stroke-width="1"/>'
    anchor = f'<circle cx="{cx}" cy="{rope_top+3}" r="3" fill="{PAPER}" fill-opacity=".6"/>'
    name_size = w * 0.165
    ny = py + ph + w * 0.08 + name_size * 0.84
    g = [
        # contact shadow on the haze behind
        f'<ellipse cx="{cx+18}" cy="{top+h*0.62}" rx="{w*0.62}" ry="{h*0.56}" fill="#000" opacity=".7" filter="url(#bBlur)"/>',
        rope,
        f'<rect x="{cx-17}" y="{top-11}" width="34" height="19" rx="3" fill="{INK2}" stroke="{PAPER}" stroke-opacity=".4"/>',
        f'<rect x="{x}" y="{top}" width="{w}" height="{h}" rx="13" fill="#0B0B0B"/>',
        f'<rect x="{x}" y="{top}" width="{w}" height="{h}" rx="13" fill="url(#bCardGlow)"/>',
        f'<rect x="{x+.5}" y="{top+.5}" width="{w-1}" height="{h-1}" rx="12.5" fill="none" stroke="{PAPER}" stroke-opacity=".15"/>',
        # green rim light on the right edge
        f'<path d="M{x+w-.6} {top+18}V{top+h-18}" stroke="url(#bRim)" stroke-width="1.4"/>',
        f'<rect x="{cx-w*0.11}" y="{top+pad}" width="{w*0.22}" height="5" rx="2.5" fill="{INK}" stroke="{PAPER}" stroke-opacity=".1"/>',
        logo_mark(x + pad, top + pad + 18, 13),
        T("ARAMETRIC", "display", 9.5, x + pad + 18, top + pad + 28.5, PAPER, WORDMARK, 0.02)[0],
        mono("ID · 001", x + w - pad, top + pad + 28.5, 7.5, MUTE, 0.06, "end")[0],
        # portrait + glow on its right edge (IdPhoto.tsx)
        f'<ellipse cx="{x+w-pad}" cy="{py+ph*0.5}" rx="{ph*0.24}" ry="{ph*0.42}" fill="url(#bPhotoGlow)"/>',
        f'<clipPath id="bPhoto"><rect x="{x+pad}" y="{py}" width="{ph}" height="{ph}" rx="7"/></clipPath>',
        f'<g clip-path="url(#bPhoto)">{img(PORTRAIT_S, x+pad, py, ph, ph)}</g>',
        f'<rect x="{x+pad+.5}" y="{py+.5}" width="{ph-1}" height="{ph-1}" rx="6.5" fill="none" stroke="{PAPER}" stroke-opacity=".1"/>',
        T("AHMET", "display", name_size, x + pad, ny, PAPER, DISPLAY)[0],
        T("ÇAVDAR", "display", name_size, x + pad, ny + name_size * 0.88, PAPER, DISPLAY)[0],
        mono("Founder / Builder", x + pad, ny + name_size * 0.88 + 14, 7.6, ACID, 0.12)[0],
        qr(x + w - pad - w * 0.2, ny + name_size * 0.88 + 16 - w * 0.2, w * 0.2, "#CFCFCF"),
    ]
    sway = (f'<animateTransform attributeName="transform" type="rotate" values="{base_rot} {cx} {rope_top};{base_rot+2.2} {cx} {rope_top};{base_rot} {cx} {rope_top}" '
            f'keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur="7s" repeatCount="indefinite"/>') if anim_rot else ""
    return f'<g transform="rotate({base_rot} {cx} {rope_top})">{"".join(g[:1])}</g>' \
           f'<g transform="rotate({base_rot} {cx} {rope_top})">{"".join(g[1:])}{sway}</g>', anchor, h

def b_defs(w, h, lx, ly):
    return f'''
<radialGradient id="bScene" cx="{lx/w:.3f}" cy="{ly/h:.3f}" r=".75"><stop offset="0" stop-color="#151815"/><stop offset=".45" stop-color="#0A0B0A"/><stop offset="1" stop-color="#020202"/></radialGradient>
<radialGradient id="bGreen" cx="{(lx+90)/w:.3f}" cy="{ly/h:.3f}" r=".42"><stop offset="0" stop-color="{ACID}" stop-opacity=".17"/><stop offset="1" stop-color="{ACID}" stop-opacity="0"/></radialGradient>
<radialGradient id="bCardGlow" cx="0" cy="0" r="1.1"><stop offset="0" stop-color="{ACID}" stop-opacity=".14"/><stop offset=".45" stop-color="{ACID}" stop-opacity="0"/></radialGradient>
<radialGradient id="bPhotoGlow"><stop offset="0" stop-color="{ACID}" stop-opacity=".5"/><stop offset="1" stop-color="{ACID}" stop-opacity="0"/></radialGradient>
<linearGradient id="bRim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{ACID}" stop-opacity="0"/><stop offset=".35" stop-color="{ACID}" stop-opacity=".75"/><stop offset="1" stop-color="{ACID}" stop-opacity="0"/></linearGradient>
<linearGradient id="bRope" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{PAPER}" stop-opacity=".15"/><stop offset="1" stop-color="{PAPER}" stop-opacity=".7"/></linearGradient>
<linearGradient id="bBeam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".07"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>
<radialGradient id="bVig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>
<filter id="bBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
<filter id="bDof" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="2.4"/></filter>'''

def rec_dot(x, y):
    return (f'<circle cx="{x}" cy="{y}" r="3" fill="#FF4D4D"><animate attributeName="opacity" values="1;1;.25;1" '
            f'keyTimes="0;.55;.75;1" dur="2s" repeatCount="indefinite"/></circle>')

def hero_desktop():
    W, H, BAR = 838, 470, 36
    L, R = 40, 798
    cx = 650
    b = [f'<rect width="{W}" height="{H}" fill="url(#bScene)"/>',
         f'<rect width="{W}" height="{H}" fill="url(#bGreen)"/>']
    # depth: out-of-focus wordmark far behind the card
    far, _ = T("ARAMETRIC", "display", 250, W - 10, 360, "#FFFFFF", DISPLAY, -0.01, "end")
    b.append(f'<g opacity=".045" filter="url(#bDof)">{far}</g>')
    # light beam from the top right
    b.append(f'<path d="M520 {BAR}L780 {BAR}L560 {H-BAR}L250 {H-BAR}Z" fill="url(#bBeam)">'
             f'<animate attributeName="opacity" values="1;.55;1" dur="9s" repeatCount="indefinite"/></path>')
    b.append(f'<rect width="{W}" height="{H}" fill="url(#bVig)"/>')
    card, anchor, ch = id_card(cx, 92, 178, True, BAR)
    b.append(card)
    # title card, left
    b.append(mono("An Arametric production", L, 132, 10, ACID, 0.2)[0])
    b.append(f'<g>{T("Build systems", "serif", 72, L - 2, 205, PAPER, None, -0.025)[0]}{fade(0.3, 1.6)}</g>')
    b.append(f'<g>{T("THAT OUTLAST YOU.", "display", 64, L, 262, PAPER, DISPLAY, 0.0)[0]}{fade(0.55, 1.6)}</g>')
    p, _ = para(CONTENT["sub"], L, 300, 13.5, 20, 360, "#A9A9A9")
    b.append(f'<g>{p}{fade(0.8)}</g>')
    b.append(f'<path d="M{L} 358.5H{L+24}" stroke="{ACID}"/>')
    b.append(mono(CONTENT["studio"], L + 34, 362, 10, PAPER, 0.16)[0])
    # letterbox bars + slate
    b.append(f'<rect width="{W}" height="{BAR}" fill="#000"/><rect y="{H-BAR}" width="{W}" height="{BAR}" fill="#000"/>')
    b.append(anchor)
    b.append(rec_dot(L + 3, 18))
    b.append(mono("Reel 01 — 00:12", L + 14, 21.5, 10, PAPER)[0])
    b.append(mono("ARAMETRIC", W / 2, 21.5, 10, MUTE, 0.32, "middle")[0])
    b.append(mono("SC. 01 · TK. 03", R, 21.5, 10, MUTE, anchor="end")[0])
    b.append(mono(f'{CONTENT["owner"]} — {CONTENT["role"]}', L, H - 14.5, 10, PAPER)[0])
    sw = typo.measure(CONTENT["site"].upper(), "mono", 10, MONO, 0.14)
    b.append(mono(CONTENT["site"], R - 14, H - 14.5, 10, ACID, anchor="end")[0])
    b.append(arrow_ne(R - 8, H - 22, 7, ACID))
    return svg(W, H, "\n".join(b), b_defs(W, H, cx, 230), "ARAMETRIC — Cinematic Identity")

def hero_mobile():
    W, H, BAR = 420, 660, 32
    L, R = 22, 398
    cx = 210
    b = [f'<rect width="{W}" height="{H}" fill="url(#bScene)"/>', f'<rect width="{W}" height="{H}" fill="url(#bGreen)"/>']
    far, _ = T("ARAMETRIC", "display", 150, W / 2, 300, "#FFFFFF", DISPLAY, -0.01, "middle")
    b.append(f'<g opacity=".035" filter="url(#bDof)">{far}</g>')
    b.append(f'<path d="M250 {BAR}L420 {BAR}L300 420L80 420Z" fill="url(#bBeam)"/>')
    b.append(f'<rect width="{W}" height="{H}" fill="url(#bVig)"/>')
    card, anchor, ch = id_card(cx, 82, 166, True, BAR)
    b.append(card)
    b.append(mono("An Arametric production", L, 386, 10, ACID, 0.2)[0])
    b.append(T("Build systems", "serif", 62, L - 2, 446, PAPER, None, -0.025)[0])
    b.append(T("THAT OUTLAST YOU.", "display", 50, L, 494, PAPER, DISPLAY)[0])
    p, _ = para(CONTENT["sub"], L, 530, 13, 19, 360, "#A9A9A9")
    b.append(p)
    b.append(f'<path d="M{L} 585.5H{L+20}" stroke="{ACID}"/>')
    b.append(mono(CONTENT["studio"], L + 30, 589, 10, PAPER, 0.14)[0])
    b.append(f'<rect width="{W}" height="{BAR}" fill="#000"/><rect y="{H-BAR}" width="{W}" height="{BAR}" fill="#000"/>')
    b.append(anchor)
    b.append(rec_dot(L + 3, 16))
    b.append(mono("Reel 01 — 00:12", L + 13, 19.5, 10, PAPER)[0])
    b.append(mono("SC. 01 · TK. 03", R, 19.5, 10, MUTE, anchor="end")[0])
    b.append(mono(CONTENT["owner"], L, H - 12.5, 10, PAPER)[0])
    b.append(mono(CONTENT["site"], R - 13, H - 12.5, 10, ACID, anchor="end")[0])
    b.append(arrow_ne(R - 7, H - 19.5, 6.5, ACID))
    return svg(W, H, "\n".join(b), b_defs(W, H, cx, 200), "ARAMETRIC — Cinematic Identity", rx=14)


# =============================================================== SECTIONS (Phase 2)
WORK_IMG = {k: b64(os.path.join(MEDIA, f"work-{k}.jpg"), "image/jpeg") for k in ("sirago", "engine", "site")}

def scene_defs(w, h, gx=0.85, gy=0.2, strength=0.10):
    return f'''
<radialGradient id="sScene" cx="{gx}" cy="{gy}" r="1"><stop offset="0" stop-color="#121512"/><stop offset=".5" stop-color="#090A09"/><stop offset="1" stop-color="#030303"/></radialGradient>
<radialGradient id="sGreen" cx="{gx}" cy="{gy}" r=".6"><stop offset="0" stop-color="{ACID}" stop-opacity="{strength}"/><stop offset="1" stop-color="{ACID}" stop-opacity="0"/></radialGradient>'''

def scene(w, h):
    return [f'<rect width="{w}" height="{h}" fill="url(#sScene)"/>', f'<rect width="{w}" height="{h}" fill="url(#sGreen)"/>']

def slate(w, left, right, L, R, y=30, size=10):
    """Film slate row shared by every panel: scene number left, section right, hairline under."""
    return (mono(left, L, y, size, PAPER)[0] + mono(right, R, y, size, MUTE, anchor="end")[0]
            + f'<path d="M{L} {y+12.5}H{R}" stroke="{PAPER}" stroke-opacity=".12"/>')

def pic(src, alt, href=None):
    return src, alt, href

# ---------------------------------------------------------------- about
ABOUT_LEAD = ("ONE STUDIO.", "Story and system, built together.")
ABOUT_BODY = ("Arametric is Ahmet Çavdar's studio in İstanbul. We make short-form video for brands, build AI assistants "
              "that run real businesses, and write the software that ties it all together. Every project ships with "
              "the system that keeps it running.")

def about_desktop():
    W, H, L, R = 838, 268, 40, 798
    b = scene(W, H)
    b.append(slate(W, "SC. 02 — About", "The studio", L, R))
    b.append(T(ABOUT_LEAD[0], "display", 76, L - 2, 136, PAPER, DISPLAY)[0])
    b.append(T("Story and system,", "serif", 40, L, 186, ACID, None, -0.02)[0])
    b.append(T("built together.", "serif", 40, L, 224, ACID, None, -0.02)[0])
    p, _ = para(ABOUT_BODY, 452, 102, 14, 22, 346, "#BDBDBD")
    b.append(p)
    b.append(f'<path d="M452 216.5H476" stroke="{ACID}"/>')
    b.append(mono("İstanbul · Creative & Technology", 486, 220, 10, MUTE)[0])
    return svg(W, H, "\n".join(b), scene_defs(W, H, .15, .3, .07), "ARAMETRIC — About")

def about_mobile():
    W, L, R = 420, 22, 398
    H = 252 + para(ABOUT_BODY, L, 0, 14, 21, 372)[1] * 21 + 14
    b = scene(W, H)
    b.append(slate(W, "SC. 02 — About", "The studio", L, R))
    b.append(T(ABOUT_LEAD[0], "display", 72, L - 2, 128, PAPER, DISPLAY)[0])
    b.append(T("Story and system,", "serif", 38, L, 174, ACID, None, -0.02)[0])
    b.append(T("built together.", "serif", 38, L, 210, ACID, None, -0.02)[0])
    p, n = para(ABOUT_BODY, L, 252, 14, 21, 372, "#BDBDBD")
    b.append(p)
    return svg(W, H, "\n".join(b), scene_defs(W, H, .1, .2, .07), "ARAMETRIC — About", rx=14)

# ---------------------------------------------------------------- services (end-credits roll)
SERVICES = [
    ("Video", "REELS & BRAND FILMS", "Short-form video, Meta ads, AI voice and audio cleanup"),
    ("AI bots", "WHATSAPP ASSISTANTS", "Booking and support bots that answer around the clock"),
    ("Web", "SITES & LANDING PAGES", "Fast, cinematic websites built with Next.js"),
    ("Software", "TOOLS & AUTOMATION", "Production pipelines and custom internal tools"),
]

def services_desktop():
    W, L, R = 838, 40, 798
    top, row = 84, 62
    H = top + row * len(SERVICES) + 30
    b = scene(W, H)
    b.append(slate(W, "SC. 03 — Services", "What we make", L, R))
    cx = 300
    for i, (role, name, sub) in enumerate(SERVICES):
        y = top + i * row
        b.append(mono(role, cx - 22, y + 24, 10.5, ACID, 0.18, "end")[0])
        b.append(T(name, "display", 36, cx, y + 32, PAPER, DISPLAY, 0.005)[0])
        b.append(T(sub, "serif", 19, cx, y + 54, MUTE, None, -0.01)[0])
        if i:
            b.append(f'<path d="M{cx} {y-2.5}H{R}" stroke="{PAPER}" stroke-opacity=".08"/>')
    # credit-roll guide: a hairline down the gutter
    b.append(f'<path d="M{cx-11.5} {top+8}V{H-34}" stroke="{PAPER}" stroke-opacity=".14"/>')
    return svg(W, H, "\n".join(b), scene_defs(W, H, .9, .9, .06), "ARAMETRIC — Services")

def services_mobile():
    W, L, R = 420, 22, 398
    top, row = 76, 92
    H = top + row * len(SERVICES) + 10
    b = scene(W, H)
    b.append(slate(W, "SC. 03 — Services", "What we make", L, R))
    for i, (role, name, sub) in enumerate(SERVICES):
        y = top + i * row
        if i:
            b.append(f'<path d="M{L} {y-2.5}H{R}" stroke="{PAPER}" stroke-opacity=".08"/>')
        b.append(mono(role, L, y + 18, 10, ACID, 0.18)[0])
        b.append(T(name, "display", 34, L, y + 52, PAPER, DISPLAY, 0.005)[0])
        b.append(T(sub, "serif", 17.5, L, y + 74, MUTE, None, -0.01)[0])
    return svg(W, H, "\n".join(b), scene_defs(W, H, .9, .9, .06), "ARAMETRIC — Services", rx=14)

# ---------------------------------------------------------------- featured work strips
WORKS = {
    "sirago": dict(n="04", title="SIRAGO", status=("Live", ACID), kind="AI booking on WhatsApp",
                   desc="Barbers, salons and clinics get an assistant that books, moves and reminds appointments around the clock, in Turkish, English and Arabic.",
                   tech="Node.js · PostgreSQL · Claude API · WhatsApp", link="sırago.com"),
    "engine": dict(n="05", title="CREATIVE ENGINE", status=("In development", "#F5B54A"), kind="Brief-to-video production engine",
                   desc="Turns a brief into a finished Reel: AI storyboard, HyperFrames scenes, cuts on the beat, cleaned audio and kinetic subtitles.",
                   tech="HyperFrames · FFmpeg · Claude · Whisper", link="arametric.studio"),
    "site": dict(n="06", title="ARAMETRIC.STUDIO", status=("Live", ACID), kind="The studio's own site",
                 desc="A cinematic, scroll-driven site with a draggable hanging ID card, self-hosted type and video served on demand.",
                 tech="Next.js · GSAP · Lenis", link="arametric.studio"),
}

def frame(href, x, y, w, h, n, tc):
    """Image as a projected frame: rounded screen, hairline, corner timecode."""
    return (f'<clipPath id="wf"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8"/></clipPath>'
            f'<g clip-path="url(#wf)">{img(href, x, y, w, h)}'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#wShade)"/></g>'
            f'<rect x="{x+.5}" y="{y+.5}" width="{w-1}" height="{h-1}" rx="7.5" fill="none" stroke="{PAPER}" stroke-opacity=".16"/>'
            + mono(f"Frame {n} · {tc}", x + 12, y + h - 12, 9, PAPER, 0.14)[0])

WORK_DEFS = f'''
<linearGradient id="wShade" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></linearGradient>'''

def status_chip(x, y, label, color, anchor="start"):
    w = typo.measure(label.upper(), "mono", 9.5, MONO, 0.14) + 26
    x0 = x if anchor == "start" else x - w
    return (f'<rect x="{x0}" y="{y-13}" width="{w:.1f}" height="20" rx="10" fill="none" stroke="{color}" stroke-opacity=".45"/>'
            f'<circle cx="{x0+11}" cy="{y-3}" r="3" fill="{color}"/>' + mono(label, x0 + 19, y + 0.5, 9.5, color, 0.14)[0])

def work_desktop(key, flip=False):
    d = WORKS[key]
    W, H, L, R = 838, 300, 40, 798
    b = scene(W, H)
    b.append(slate(W, f"SC. {d['n']} — Featured work", d["kind"], L, R))
    fw, fh = 400, 225
    fx = R - fw if flip else L
    tx = L if flip else L + fw + 36
    tw = (R - fw - 36 - L)
    b.append(frame(WORK_IMG[key], fx, 58, fw, fh, d["n"], "00:0" + str(int(d["n"]) - 3)))
    b.append(status_chip(tx, 84, d["status"][0], d["status"][1]))
    size = 46 if len(d["title"]) < 12 else 40
    t, tw_ = T(d["title"], "display", size, tx - 1, 138, PAPER, DISPLAY, 0.0)
    if tw_ > tw:
        size = size * tw / tw_
        t, _ = T(d["title"], "display", size, tx - 1, 138, PAPER, DISPLAY, 0.0)
    b.append(t)
    p, n = para(d["desc"], tx, 168, 13.5, 20, tw, "#BDBDBD")
    b.append(p)
    ty = 168 + n * 20 + 12
    b.append(mono(d["tech"], tx, ty, 9.5, MUTE, 0.1)[0])
    b.append(f'<path d="M{tx} {ty+16.5}H{tx+tw}" stroke="{PAPER}" stroke-opacity=".1"/>')
    b.append(mono(d["link"], tx, ty + 38, 10.5, ACID, 0.14)[0])
    lw = typo.measure(d["link"].upper(), "mono", 10.5, MONO, 0.14)
    b.append(arrow_ne(tx + lw + 8, ty + 30, 7, ACID))
    return svg(W, H, "\n".join(b), scene_defs(W, H, .8 if not flip else .2, .5, .06) + WORK_DEFS, f"ARAMETRIC — {d['title']}")

def work_mobile(key):
    d = WORKS[key]
    W, L, R = 420, 22, 398
    fw = R - L; fh = fw * 9 / 16
    b = []
    body = [slate(W, f"SC. {d['n']} — Featured work", "", L, R)]
    body.append(frame(WORK_IMG[key], L, 56, fw, fh, d["n"], "00:0" + str(int(d["n"]) - 3)))
    y = 56 + fh + 40
    body.append(status_chip(L, y, d["status"][0], d["status"][1]))
    t, w_ = T(d["title"], "display", 46, L - 1, y + 50, PAPER, DISPLAY)
    if w_ > fw:
        t, _ = T(d["title"], "display", 46 * fw / w_, L - 1, y + 50, PAPER, DISPLAY)
    body.append(t)
    body.append(T(d["kind"], "serif", 19, L, y + 76, MUTE, None, -0.01)[0])
    p, n = para(d["desc"], L, y + 106, 13.5, 20, fw, "#BDBDBD")
    body.append(p)
    ty = y + 106 + n * 20 + 10
    body.append(mono(d["tech"], L, ty, 9.5, MUTE, 0.08)[0])
    body.append(f'<path d="M{L} {ty+16.5}H{R}" stroke="{PAPER}" stroke-opacity=".1"/>')
    body.append(mono(d["link"], L, ty + 38, 10.5, ACID, 0.14)[0])
    lw = typo.measure(d["link"].upper(), "mono", 10.5, MONO, 0.14)
    body.append(arrow_ne(L + lw + 8, ty + 30, 7, ACID))
    H = int(ty + 62)
    return svg(W, H, "\n".join(scene(W, H) + body), scene_defs(W, H, .8, .3, .06) + WORK_DEFS, f"ARAMETRIC — {d['title']}", rx=14)

# ---------------------------------------------------------------- contact / end card
CONTACT = [("Web", "arametric.studio"), ("Product", "sırago.com"), ("Instagram", "@4hmeets"), ("Based", "İstanbul, TR")]

def contact_desktop():
    W, H, L, R, BAR = 838, 300, 40, 798, 34
    b = scene(W, H)
    b.append(T("LET'S BUILD", "display", 84, L - 2, 140, PAPER, DISPLAY)[0])
    b.append(T("something that lasts.", "serif", 46, L, 192, ACID, None, -0.02)[0])
    p, _ = para("New projects, collaborations and pilot programs. Start a conversation through the website.", L, 226, 13.5, 20, 360, "#A9A9A9")
    b.append(p)
    x = 520
    for i, (k, v) in enumerate(CONTACT):
        y = 92 + i * 38
        b.append(mono(k, x, y, 9.5, MUTE, 0.16)[0])
        b.append(mono(v, R, y, 11, PAPER if i else ACID, 0.08, "end", MONO_M)[0])
        b.append(f'<path d="M{x} {y+13.5}H{R}" stroke="{PAPER}" stroke-opacity=".1"/>')
    b.append(f'<rect width="{W}" height="{BAR}" fill="#000"/><rect y="{H-BAR}" width="{W}" height="{BAR}" fill="#000"/>')
    b.append(mono("SC. 07 — Contact", L, 21, 10, PAPER)[0])
    b.append(mono("ARAMETRIC", W / 2, 21, 10, MUTE, 0.32, "middle")[0])
    b.append(f'<rect x="{R-6}" y="14" width="6" height="6" fill="{ACID}"/>')
    b.append(mono("Rec", R - 14, 21, 10, MUTE, anchor="end")[0])
    b.append(logo_mark(L, H - 25, 15))
    b.append(mono("Build systems that outlast you.", L + 24, H - 13, 10, PAPER)[0])
    b.append(mono("End of reel 01", R, H - 13, 10, MUTE, anchor="end")[0])
    return svg(W, H, "\n".join(b), scene_defs(W, H, .15, .5, .08), "ARAMETRIC — Contact")

def contact_mobile():
    W, L, R, BAR = 420, 22, 398, 32
    H = 470
    b = scene(W, H)
    b.append(T("LET'S BUILD", "display", 80, L - 2, 126, PAPER, DISPLAY)[0])
    b.append(T("something that lasts.", "serif", 42, L, 174, ACID, None, -0.02)[0])
    p, _ = para("New projects, collaborations and pilot programs. Start a conversation through the website.", L, 208, 13.5, 20, 372, "#A9A9A9")
    b.append(p)
    for i, (k, v) in enumerate(CONTACT):
        y = 280 + i * 36
        b.append(mono(k, L, y, 9.5, MUTE, 0.16)[0])
        b.append(mono(v, R, y, 11, PAPER if i else ACID, 0.08, "end", MONO_M)[0])
        b.append(f'<path d="M{L} {y+13.5}H{R}" stroke="{PAPER}" stroke-opacity=".1"/>')
    b.append(f'<rect width="{W}" height="{BAR}" fill="#000"/><rect y="{H-BAR}" width="{W}" height="{BAR}" fill="#000"/>')
    b.append(mono("SC. 07 — Contact", L, 20, 10, PAPER)[0])
    b.append(f'<rect x="{R-6}" y="13" width="6" height="6" fill="{ACID}"/>')
    b.append(mono("Rec", R - 14, 20, 10, MUTE, anchor="end")[0])
    b.append(logo_mark(L, H - 23, 14))
    b.append(mono("End of reel 01", R, H - 12, 10, MUTE, anchor="end")[0])
    b.append(mono("arametric.studio", L + 22, H - 12, 10, PAPER)[0])
    return svg(W, H, "\n".join(b), scene_defs(W, H, .1, .4, .08), "ARAMETRIC — Contact", rx=14)

# =============================================================== write
FILES = {
    "hero.svg": hero_desktop, "hero-mobile.svg": hero_mobile,
    "about.svg": about_desktop, "about-mobile.svg": about_mobile,
    "services.svg": services_desktop, "services-mobile.svg": services_mobile,
    "work-sirago.svg": lambda: work_desktop("sirago"), "work-sirago-mobile.svg": lambda: work_mobile("sirago"),
    "work-engine.svg": lambda: work_desktop("engine", flip=True), "work-engine-mobile.svg": lambda: work_mobile("engine"),
    "work-site.svg": lambda: work_desktop("site"), "work-site-mobile.svg": lambda: work_mobile("site"),
    "contact.svg": contact_desktop, "contact-mobile.svg": contact_mobile,
}

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for name, fn in FILES.items():
        save(name, fn())
