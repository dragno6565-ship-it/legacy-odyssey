#!/usr/bin/env python3
"""
md-to-html.py — convert a Markdown file into a clean, readable, self-contained HTML
page that Dan can double-click open in a browser. No external libraries required.

Usage:  python scripts/md-to-html.py <input.md> [output.html]

This is the standard tool for producing DAN-FACING deliverables (reports, plans,
analyses). Internal coordination files (STATUS.md, sessions/, docs/, TODO.md) stay
as .md — only things Dan is meant to READ get converted.
"""
import sys, os, re, html

def inline(t):
    t = html.escape(t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'<em>\1</em>', t)
    t = re.sub(r'`(.+?)`', r'<code>\1</code>', t)
    t = re.sub(r'\[(.+?)\]\((.+?)\)', r'<a href="\2">\1</a>', t)
    return t

def convert(md):
    out, i, lines = [], 0, md.split('\n')
    while i < len(lines):
        ln = lines[i]
        # table block
        if '|' in ln and i+1 < len(lines) and re.match(r'^\s*\|?[\s:|-]+\|?\s*$', lines[i+1]):
            header = [c.strip() for c in ln.strip().strip('|').split('|')]
            out.append('<table><thead><tr>' + ''.join(f'<th>{inline(c)}</th>' for c in header) + '</tr></thead><tbody>')
            i += 2
            while i < len(lines) and '|' in lines[i]:
                cells = [c.strip() for c in lines[i].strip().strip('|').split('|')]
                out.append('<tr>' + ''.join(f'<td>{inline(c)}</td>' for c in cells) + '</tr>')
                i += 1
            out.append('</tbody></table>')
            continue
        m = re.match(r'^(#{1,6})\s+(.*)', ln)
        if m:
            lvl = len(m.group(1)); out.append(f'<h{lvl}>{inline(m.group(2))}</h{lvl}>'); i += 1; continue
        if re.match(r'^\s*([-*])\s+', ln):
            out.append('<ul>')
            while i < len(lines) and re.match(r'^\s*([-*])\s+', lines[i]):
                out.append('<li>' + inline(re.sub(r'^\s*([-*])\s+', '', lines[i])) + '</li>'); i += 1
            out.append('</ul>'); continue
        if re.match(r'^\s*\d+\.\s+', ln):
            out.append('<ol>')
            while i < len(lines) and re.match(r'^\s*\d+\.\s+', lines[i]):
                out.append('<li>' + inline(re.sub(r'^\s*\d+\.\s+', '', lines[i])) + '</li>'); i += 1
            out.append('</ol>'); continue
        if re.match(r'^\s*([-*_]){3,}\s*$', ln):
            out.append('<hr>'); i += 1; continue
        if ln.strip() == '':
            i += 1; continue
        out.append('<p>' + inline(ln) + '</p>'); i += 1
    return '\n'.join(out)

def main():
    if len(sys.argv) < 2:
        print('usage: python scripts/md-to-html.py <input.md> [output.html]'); sys.exit(1)
    src = sys.argv[1]
    dst = sys.argv[2] if len(sys.argv) > 2 else os.path.splitext(src)[0] + '.html'
    with open(src, encoding='utf-8') as f:
        md = f.read()
    title = os.path.splitext(os.path.basename(src))[0].replace('-', ' ').replace('_', ' ').title()
    body = convert(md)
    page = f"""<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)}</title>
<style>
 body{{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:820px;
   margin:40px auto;padding:0 24px;color:#2c2416;background:#faf7f2;line-height:1.65;font-size:17px}}
 h1,h2,h3,h4{{color:#1a1510;line-height:1.25;margin-top:1.6em}}
 h1{{border-bottom:3px solid #c8a96e;padding-bottom:.3em}}
 h2{{border-bottom:1px solid #e0d5c4;padding-bottom:.2em}}
 a{{color:#b08e4a}} code{{background:#f0e8dc;padding:2px 6px;border-radius:4px;font-size:.9em}}
 table{{border-collapse:collapse;width:100%;margin:1.2em 0;font-size:.95em}}
 th,td{{border:1px solid #e0d5c4;padding:8px 12px;text-align:left;vertical-align:top}}
 th{{background:#f0e8dc}} tr:nth-child(even) td{{background:#fbf8f3}}
 hr{{border:none;border-top:1px solid #e0d5c4;margin:2em 0}}
 strong{{color:#1a1510}} li{{margin:.3em 0}}
 .meta{{color:#8a7e6b;font-size:.85em;margin-bottom:2em}}
</style></head><body>
<div class="meta">Legacy Odyssey · generated from {html.escape(os.path.basename(src))}</div>
{body}
</body></html>"""
    with open(dst, 'w', encoding='utf-8') as f:
        f.write(page)
    print(f'wrote {dst}')

if __name__ == '__main__':
    main()
