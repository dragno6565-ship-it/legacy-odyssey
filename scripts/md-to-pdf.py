#!/usr/bin/env python
"""Lightweight Markdown -> styled PDF (reportlab, no external deps).
Handles: # / ## / ### headings, --- rules, - bullets, > blockquotes,
pipe tables, **bold**, `code`, and paragraphs. Brand-styled (cream/gold).
Usage: python scripts/md-to-pdf.py <in.md> <out.pdf>
"""
import sys, re, html
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, HRFlowable, ListFlowable, ListItem)

GOLD = colors.HexColor("#b7924e")
DARK = colors.HexColor("#2c2416")
CREAM = colors.HexColor("#faf7f2")
LIGHT = colors.HexColor("#efe7d8")

def inline(t):
    t = html.escape(t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"`(.+?)`", r'<font face="Courier">\1</font>', t)
    return t

def build(md_path, pdf_path):
    ss = getSampleStyleSheet()
    styles = {
        "h1": ParagraphStyle("h1", parent=ss["Title"], textColor=DARK, fontSize=22, leading=26, spaceAfter=6),
        "h2": ParagraphStyle("h2", parent=ss["Heading2"], textColor=GOLD, fontSize=15, leading=19, spaceBefore=14, spaceAfter=4),
        "h3": ParagraphStyle("h3", parent=ss["Heading3"], textColor=DARK, fontSize=12, leading=15, spaceBefore=8, spaceAfter=2),
        "body": ParagraphStyle("body", parent=ss["BodyText"], textColor=DARK, fontSize=10.5, leading=15, spaceAfter=6),
        "quote": ParagraphStyle("quote", parent=ss["BodyText"], textColor=DARK, fontSize=11.5, leading=16,
                                 leftIndent=14, borderPadding=(6,6,6,10), backColor=CREAM, spaceAfter=8, fontName="Helvetica-Oblique"),
        "bullet": ParagraphStyle("bullet", parent=ss["BodyText"], textColor=DARK, fontSize=10.5, leading=15),
    }
    lines = open(md_path, encoding="utf-8").read().splitlines()
    flow, i = [], 0
    while i < len(lines):
        ln = lines[i].rstrip()
        if not ln.strip():
            i += 1; continue
        if ln.startswith("# "):
            flow.append(Paragraph(inline(ln[2:]), styles["h1"]))
        elif ln.startswith("## "):
            flow.append(Paragraph(inline(ln[3:]), styles["h2"]))
        elif ln.startswith("### "):
            flow.append(Paragraph(inline(ln[4:]), styles["h3"]))
        elif ln.strip() == "---":
            flow.append(Spacer(1, 4)); flow.append(HRFlowable(width="100%", color=LIGHT, thickness=1)); flow.append(Spacer(1, 4))
        elif ln.startswith(">"):
            flow.append(Paragraph(inline(ln.lstrip("> ").strip()), styles["quote"]))
        elif ln.lstrip().startswith("- "):
            items = []
            while i < len(lines) and lines[i].lstrip().startswith("- "):
                items.append(ListItem(Paragraph(inline(lines[i].lstrip()[2:]), styles["bullet"]), leftIndent=12))
                i += 1
            flow.append(ListFlowable(items, bulletType="bullet", bulletColor=GOLD, start="•", spaceAfter=6))
            continue
        elif ln.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                if not re.match(r"^[\s:\-]+$", "".join(cells)):
                    rows.append([Paragraph(inline(c), styles["bullet"]) for c in cells])
                i += 1
            if rows:
                tbl = Table(rows, repeatRows=1, hAlign="LEFT", colWidths=None)
                tbl.setStyle(TableStyle([
                    ("BACKGROUND", (0,0), (-1,0), GOLD),
                    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
                    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
                    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, CREAM]),
                    ("GRID", (0,0), (-1,-1), 0.5, LIGHT),
                    ("VALIGN", (0,0), (-1,-1), "TOP"),
                    ("LEFTPADDING", (0,0), (-1,-1), 6), ("RIGHTPADDING", (0,0), (-1,-1), 6),
                    ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
                ]))
                flow.append(tbl); flow.append(Spacer(1, 8))
            continue
        else:
            flow.append(Paragraph(inline(ln), styles["body"]))
        i += 1
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, topMargin=0.7*inch,
                            bottomMargin=0.7*inch, leftMargin=0.8*inch, rightMargin=0.8*inch)
    doc.build(flow)
    print("wrote", pdf_path)

if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2])
