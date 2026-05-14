#!/usr/bin/env python3
"""
html_to_pdf.py — Convert a rendered CV HTML to a PDF.

Strategy:
  - Use Playwright + Chromium (only headless engine that handles CSS Grid + @page reliably).
  - Try scale=1.0 first. If the result is >1 page, retry at progressively smaller
    scales (0.95, 0.90, 0.85, 0.80) until it fits or we hit the floor.
  - Floor at 0.80: below that, text is too small for a real CV. If 0.80 still
    doesn't fit, the content is genuinely a 2-page CV — output it as 2 pages.

Usage:
  python3 html_to_pdf.py <input.html> <output.pdf>
  python3 html_to_pdf.py <input.html> <output.pdf> --pages 2   # force 2-page mode
  python3 html_to_pdf.py <input.html> <output.pdf> --scale 0.9 # force a scale

Exit codes:
  0  success
  2  missing dependency (Playwright not installed)
  3  input file not found
  4  conversion failed (Chromium error)
"""
import argparse
import sys
from pathlib import Path

# Auto-scale ladder (high → low). 0.80 is the readability floor.
SCALE_LADDER = [1.0, 0.95, 0.90, 0.85, 0.80]


def import_playwright():
    try:
        from playwright.sync_api import sync_playwright
        return sync_playwright
    except ImportError:
        print("ERROR: playwright is not installed.", file=sys.stderr)
        print("  Install:  pip install playwright && playwright install chromium",
              file=sys.stderr)
        print("  Or use browser fallback: open the HTML and Cmd/Ctrl+P → Save as PDF",
              file=sys.stderr)
        sys.exit(2)


def count_pages(pdf_bytes: bytes) -> int:
    """Count pages in a PDF byte string. Uses /Count in the page tree, fallback to /Type /Page."""
    # Robust enough for our use; pypdf would also work but we want no extra deps.
    # /Count in the root /Pages object is the canonical answer.
    import re
    # Look for /Type /Pages ... /Count N
    m = re.search(rb"/Type\s*/Pages[^/]*/Count\s+(\d+)", pdf_bytes)
    if m:
        return int(m.group(1))
    # Fallback: count "/Type /Page" occurrences (the leaf page objects)
    return len(re.findall(rb"/Type\s*/Page[^s]", pdf_bytes))


def render_pdf(html_path: Path, scale: float, sync_playwright) -> bytes:
    """Render the HTML to PDF bytes at the given scale."""
    url = html_path.resolve().as_uri()
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(url, wait_until="networkidle")
        # Print media to honor any @media print rules in the template.
        page.emulate_media(media="print")
        pdf_bytes = page.pdf(
            format="A4",
            print_background=True,
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
            prefer_css_page_size=True,
            scale=scale,
        )
        browser.close()
    return pdf_bytes


def convert(html_path: Path, output_path: Path, target_pages: int = 1,
            forced_scale: float | None = None) -> tuple[int, float]:
    """Convert HTML → PDF. Returns (pages_produced, scale_used)."""
    sync_playwright = import_playwright()

    if forced_scale is not None:
        pdf_bytes = render_pdf(html_path, forced_scale, sync_playwright)
        output_path.write_bytes(pdf_bytes)
        return count_pages(pdf_bytes), forced_scale

    # Auto-scale: try each scale until we hit target_pages or run out.
    last_pdf = None
    last_pages = None
    last_scale = None
    for scale in SCALE_LADDER:
        pdf_bytes = render_pdf(html_path, scale, sync_playwright)
        pages = count_pages(pdf_bytes)
        last_pdf, last_pages, last_scale = pdf_bytes, pages, scale
        if pages <= target_pages:
            output_path.write_bytes(pdf_bytes)
            return pages, scale

    # We hit the floor. Save the last (smallest) attempt anyway.
    output_path.write_bytes(last_pdf)
    return last_pages, last_scale


def main():
    parser = argparse.ArgumentParser(description="Convert rendered CV HTML to PDF.")
    parser.add_argument("input", type=Path, help="Path to the rendered .html file")
    parser.add_argument("output", type=Path, help="Path to write the .pdf file")
    parser.add_argument("--pages", type=int, default=1,
                        help="Target page count (default: 1). Set to 2 for longer CVs.")
    parser.add_argument("--scale", type=float, default=None,
                        help="Force a specific scale (0.5–1.0). Disables auto-scaling.")
    args = parser.parse_args()

    if not args.input.exists():
        print(f"ERROR: input file not found: {args.input}", file=sys.stderr)
        sys.exit(3)

    args.output.parent.mkdir(parents=True, exist_ok=True)

    try:
        pages, scale = convert(args.input, args.output,
                               target_pages=args.pages,
                               forced_scale=args.scale)
    except Exception as e:
        print(f"ERROR: PDF conversion failed: {type(e).__name__}: {e}",
              file=sys.stderr)
        sys.exit(4)

    size_kb = args.output.stat().st_size / 1024
    print(f"Wrote {args.output} — {pages} page{'s' if pages != 1 else ''} "
          f"at scale {scale:.2f} ({size_kb:.1f} KB)")

    # Only warn about overflow when auto-scaling was active. When the user
    # forced a scale, they accepted whatever page count it produces.
    if args.scale is None and pages > args.pages:
        print(f"  NOTE: could not fit content into {args.pages} page(s) "
              f"even at minimum scale. Output is {pages} pages.",
              file=sys.stderr)


if __name__ == "__main__":
    main()
