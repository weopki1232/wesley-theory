---
name: thai-pdf
description: Produce beautiful, print-perfect multi-page PDF documents — especially ones containing Thai text — by authoring HTML and rendering it with headless Chrome. Use when the user wants a polished PDF document (portfolio, TCAS/application docs, cover letter, resume/profile, certificate, report, formal Thai letter) rather than slides, or says "make this a PDF", "turn this into an A4 document", or needs correct Thai typography in a PDF. This beats reportlab/weasyprint for Thai shaping. For on-screen slide decks use frontend-slides/study-deck instead; for ingesting a PDF into the vault use vault-pdf-ingest.
---

# Thai PDF (HTML → headless Chrome)

The proven pipeline for crisp, non-overlapping, professionally-typeset **A4 PDF documents**, with correct **Thai** shaping. Used for a real TCAS portfolio. Chrome renders Thai far better than reportlab/weasyprint.

## When to use
- A polished **document** deliverable: portfolio, application/TCAS docs, SOP/cover letter, resume/CV, profile sheet, certificate, formal Thai letter, one-off report.
- Anything where Thai text must shape and wrap correctly in a fixed A4 page.

Not this skill: on-screen presentations → `frontend-slides` (pitch/talk) or `study-deck` (lessons). Adding a PDF to the Obsidian vault → `vault-pdf-ingest`. Real .docx/.xlsx/.pptx office files → the `docx`/`xlsx`/`pptx` skills.

## Pipeline

### 1. Author one HTML file, one div per page
```css
@page{ size:A4; margin:0 }
html{ -webkit-print-color-adjust:exact; print-color-adjust:exact }
.page{ width:210mm; height:297mm; overflow:hidden; page-break-after:always; position:relative }
```
Each `.page` is exactly A4; `overflow:hidden` prevents silent reflow onto phantom pages. Design at real mm measurements.

### 2. Embed fonts — never rely on system fonts
Download the TTFs and `@font-face` them with **relative** `url('fonts/X.ttf')` (keep a `fonts/` folder next to the HTML). Source:
`https://raw.githubusercontent.com/google/fonts/main/ofl/<family>/<File>.ttf`

Proven stack (modern + professional): **Sarabun** (Thai/Latin body, 400/500/600/700) + **Kanit** (Thai headings, 500/600/700) + **Playfair Display** (Latin display). Swap the display face per brief, but keep Sarabun/Kanit for Thai — they shape correctly and read cleanly. (Note: an editorial "anti-slop" brief may want a distinctive Latin serif like Young Serif instead of Playfair.)

### 3. Render with headless Chrome
```
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless --disable-gpu \
  --no-pdf-header-footer --no-margins \
  --print-to-pdf="out.pdf" --virtual-time-budget=10000 \
  "file:///C:/full/path/to/doc.html"
```
`--virtual-time-budget` (ms) gives fonts/images time to load before the snapshot — do not omit it. Chrome and 32-bit msedge are installed on this machine.

### 4. QA every page visually before delivering
Rasterize with PyMuPDF and **Read** the PNGs — catch overlap, cut-off text, or a blown layout before the user sees it:
```python
import fitz
doc = fitz.open("out.pdf")
for i in range(doc.page_count):
    doc[i].get_pixmap(dpi=130).save(f"qa_p{i}.png")   # ASCII filenames only
print("pages", doc.page_count)                          # never print Thai to stdout
```
Then Read each `qa_p*.png`.

### 5. (Optional) split into per-page PDFs
```python
from pypdf import PdfReader, PdfWriter
r = PdfReader("out.pdf")
for i, pg in enumerate(r.pages):
    w = PdfWriter(); w.add_page(pg)
    with open(f"page_{i+1}.pdf","wb") as f: w.write(f)
```

## Pitfalls (each cost real time — heed them)
- **PowerShell has NO heredoc.** `<<'PY' ... PY` is a parse error. Write a real `.py` file (Write tool) and run it — do not pipe multi-line Python into `python -` from PowerShell. The Bash tool *does* support heredocs if you prefer.
- **`cp1252` UnicodeEncodeError when printing Thai to stdout.** Windows console encoding kills any `print()` containing Thai. Print ASCII only (page counts, indices, status). Thai is fine *inside files* and inside the HTML — just never in a `print()`. (If you must, `sys.stdout.reconfigure(encoding='utf-8')` first.)
- **Thai filenames are fine** for the output files themselves — only `print()` chokes.
- **Missing `--virtual-time-budget`** → fonts/images not loaded yet → boxes/tofu or unstyled text in the PDF.
- **Absolute `file:///` path with forward slashes** in the Chrome arg on Windows.

## Related
- Image prep for these docs (background removal, glare fix on scanned certificates): see the `image-prep-rembg-glare` memory — clean cutouts with rembg `u2net_human_seg` + alpha matting, gamma/contrast recipe for over-glowy scans.
- Deliverables archive to `E:\Projects\<project>\` per the user's decluttering habit.
- Requires `pip install pypdf pymupdf` (both already installed in system Python).
