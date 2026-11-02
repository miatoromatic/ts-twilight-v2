#!/usr/bin/env python3
"""Build preview/index.html from the XenForo templates.

The CSS and JS are lifted verbatim from terrasphere_character_banner.html
(XF conditionals stripped), the event slides come from ts_banner_slides.html
with image paths pointed at ../images, and the character slide is a static
stand-in for what XenForo renders for a logged-in member.
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
TPL = ROOT / "xenforo" / "templates"

main = (TPL / "terrasphere_character_banner.html").read_text()
slides = (TPL / "ts_banner_slides.html").read_text()

css = re.search(r"<xf:css>(.*?)</xf:css>", main, re.S).group(1)
css = re.sub(r"<xf:if.*?</xf:if>", "", css, flags=re.S)  # group rules need XF
css += "\n.tsCB-buttons > .tsCB-btn:nth-child(n+5){display:none}\n"  # mimic a regular member
js = re.search(r"<xf:js>(.*?)</xf:js>", main, re.S).group(1)

pager = re.search(r'(<div class="tsCB-pager".*?</div>\s*</section>)', main, re.S).group(1)
pager = pager.replace("</section>", "")
pager = re.sub(r"<!--.*?-->", "", pager, flags=re.S)

art = ["../images/campaign.webp", "../images/season-5a.webp",
       "../images/astorea-banner.webp", "../images/falderen-banner.webp"]
i = iter(art)
slides = re.sub(r'(<img class="tsCB-bg" src=")[^"]+', lambda m: m.group(1) + next(i), slides)
slides = re.sub(r"<!--.*?-->", "", slides, flags=re.S)

ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="{}"/></svg>'
buttons = [("Shop", "M6 6h15l-1.5 9h-12zM6 6L5 3H2M9 20h.01M18 20h.01"),
           ("Customize", "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"),
           ("Inventory", "M4 7h16v12H4zM9 7V5h6v2"),
           ("Gems", "M6 3h12l3 6-9 12L3 9zM3 9h18"),
           ("Hidden", "M0 0"), ("Hidden", "M0 0"), ("Hidden", "M0 0")]
btn_html = "".join(
    f'<div class="tsCB-btn"><a href="#" class="tsCB-tile">{ICON.format(p)}<span>{l}</span></a></div>'
    for l, p in buttons)


def chip(color, rank, name):
    return (f'<a class="tsCB-chip" href="#" title="{name}"><span class="tsCB-chipIcon" style="background-color:{color}">'
            f'<img src="../images/logo.webp" alt=""></span><b>{rank}</b></a>')


loadout = "".join(chip("transparent", r, n) for n, r in [("Weapon", "B"), ("Armor", "B"), ("Accessory", "C")])
masteries = "".join(chip(c, r, "Mastery") for c, r in
                    [("#3a6ea5", "B"), ("#7a4fb5", "C"), ("#a5503a", "D"), ("#3aa57a", "C"), ("#a59a3a", "D"), ("#5a5a7a", "D")])
expertises = "".join(chip(c, r, "Expertise") for c, r in
                     [("#2f4f6f", "C"), ("#4f2f6f", "C"), ("#6f4f2f", "C"), ("#2f6f4f", "C"), ("#6f2f4f", "D")])

char_tpl = re.search(r"(<article class=\"tsCB-slide tsCB-slide--char.*?</article>)", main, re.S).group(1)
char = f'''
<article class="tsCB-slide tsCB-slide--char is-active" data-duration="20000" data-label="Faker">
  <div class="tsCB-bg" style="background-image:url('../images/user-banner.jpg');background-position:center 30%"></div>
  <div class="tsCB-shade"></div>
  <div class="tsCB-top">
    <header class="tsCB-head">
      <a class="tsCB-name" href="#">Faker</a>
      <p class="tsCB-sub"><span class="userTitle">Administrator</span>
        <span class="cbg" style="background:#1d2a44;color:#fff">H</span>
        <span class="cbg" style="background:#1d2a44;color:#fff">NG+</span>
        <span class="cbg" style="background:#1d2a44;color:#fff">C+</span></p>
    </header>
    <div class="tsCB-wallet">
      <dl class="pairs pairs--rows"><dt title="GP">Gold</dt><dd><a href="#">15,440</a></dd></dl>
      <dl class="pairs pairs--rows"><dt title="MP">Mastery</dt><dd><a href="#">6,384</a></dd></dl>
      <dl class="pairs pairs--rows"><dt title="VP">Valor</dt><dd><a href="#">36</a></dd></dl>
    </div>
  </div>
  <div class="tsCB-bottom">
    <nav class="tsCB-dock">
      {re.search(r'(<button type="button" class="tsCB-tile[^"]*" data-cb="drawer-open".*?</button>)', char_tpl, re.S).group(1)}
      <div class="tsCB-buttons">{btn_html}</div>
    </nav>
  </div>
  <aside class="tsCB-drawer">
    {re.search(r'(<div class="tsCB-drawerHead">.*?</button>\s*</div>)', char_tpl, re.S).group(1).replace('<xf:if is="$canSheet">', '').replace('</xf:if>', '').replace('{$sheetLink}', '#')}
    <div class="tsCB-group"><p class="tsCB-groupLabel">Loadout</p><div class="tsCB-chips">{loadout}</div></div>
    <div class="tsCB-group"><p class="tsCB-groupLabel">Masteries</p><div class="tsCB-chips">{masteries}</div></div>
    <div class="tsCB-group"><p class="tsCB-groupLabel">Expertises</p><div class="tsCB-chips">{expertises}</div></div>
  </aside>
</article>'''

html = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Character Banner Preview</title>
<style>
body{{margin:0;padding:24px 16px;background:#0e1424;font-family:"Segoe UI",system-ui,sans-serif}}
.prefix{{display:inline-block;background:#24324f;color:#fff}} .prefix.light-orange{{background:#c76a2b}} .prefix.open{{background:#2c8a5a}}
{css}
</style></head><body>
<div class="tsCB" data-interval="7000"><section class="tsCB-stage" aria-roledescription="carousel" aria-label="Character and featured">
{char}
{slides}
{pager}
</section></div>
<script>{js}</script>
</body></html>'''

(ROOT / "preview" / "index.html").write_text(html)
print("wrote preview/index.html")
