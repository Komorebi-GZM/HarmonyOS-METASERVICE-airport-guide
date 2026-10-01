"""Reproducibly draw the Xinghai Airport Guide HarmonyOS PNG brand assets."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUTS = [
    ROOT / 'harmony_app/AppScope/resources/base/media/app_icon.png',
    ROOT / 'harmony_app/entry/src/main/resources/base/media/icon.png',
    ROOT / 'harmony_app/entry/src/main/resources/base/media/startIcon.png',
]
S = 1024
BG = '#F4F7F9'
INK = '#063F4B'
ACCENT = '#087E8B'
PALE = '#D7EEF0'
WHITE = '#FFFFFF'

def draw_icon() -> Image.Image:
    im = Image.new('RGBA', (S, S), BG)
    d = ImageDraw.Draw(im)
    # Soft inset tile gives the system icon a clear edge on both light and dark surfaces.
    d.rounded_rectangle((74, 74, 950, 950), radius=210, fill=WHITE)
    d.rounded_rectangle((112, 112, 912, 912), radius=178, fill=BG)
    # Navigation beacon and concentric airport wayfinding rings.
    d.ellipse((236, 222, 788, 774), fill=PALE)
    d.ellipse((292, 278, 732, 718), outline=ACCENT, width=22)
    d.ellipse((354, 340, 670, 656), outline=INK, width=15)
    # Runway: a vertical rounded strip with centerline dashes.
    d.rounded_rectangle((452, 246, 572, 750), radius=58, fill=INK)
    d.rounded_rectangle((503, 288, 521, 378), radius=9, fill=WHITE)
    d.rounded_rectangle((503, 425, 521, 515), radius=9, fill=WHITE)
    d.rounded_rectangle((503, 562, 521, 652), radius=9, fill=WHITE)
    # Simplified aircraft silhouette overlays the runway, pointing toward the destination.
    plane = [(512, 338), (537, 407), (680, 466), (680, 499), (543, 478),
             (548, 554), (598, 588), (598, 615), (519, 596), (505, 596),
             (426, 615), (426, 588), (476, 554), (481, 478), (344, 499),
             (344, 466), (487, 407)]
    d.polygon(plane, fill=WHITE)
    # Destination pin at the north end, with a crisp contrasting center.
    d.ellipse((462, 152, 562, 252), fill=ACCENT)
    d.ellipse((493, 183, 531, 221), fill=WHITE)
    # Small direction ticks make the circular guide read as a map marker.
    d.rounded_rectangle((228, 486, 290, 510), radius=12, fill=ACCENT)
    d.rounded_rectangle((734, 486, 796, 510), radius=12, fill=ACCENT)
    return im.resize((512, 512), Image.Resampling.LANCZOS)

def main() -> None:
    image = draw_icon()
    for out in OUTS:
        out.parent.mkdir(parents=True, exist_ok=True)
        image.save(out, format='PNG', optimize=True)
        with Image.open(out) as check:
            if check.size != (512, 512) or check.format != 'PNG':
                raise RuntimeError(f'Unexpected generated image: {out}')
        print(f'{out.relative_to(ROOT)} 512x512 PNG')

if __name__ == '__main__':
    main()
