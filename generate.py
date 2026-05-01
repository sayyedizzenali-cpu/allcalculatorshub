#!/usr/bin/env python3
"""
CalcHub - Bulk Calculator Page Generator
=========================================
Ye script JSON data file se automatically hazaron calculator pages generate karta hai.
Ek baar template aur data ready karo, phir ye script saari pages bana dega.

Usage:
  python generate.py                  # Saare calculators generate karo
  python generate.py --limit 100      # Sirf 100 calculators generate karo
  python generate.py --category Finance  # Ek category ke calculators
"""

import json
import os
import sys
import argparse
import time
from pathlib import Path

# ============================================================
# CONFIG
# ============================================================
DATA_FILE     = "data/calculators.json"
TEMPLATE_FILE = "templates/calculator.html"
OUTPUT_DIR    = "output"
INDEX_FILE    = "output/index.html"

# ============================================================
# LOAD FILES
# ============================================================
def load_data():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def load_template():
    with open(TEMPLATE_FILE, "r", encoding="utf-8") as f:
        return f.read()

# ============================================================
# BUILD INPUTS HTML
# ============================================================
def build_inputs(inputs):
    html = ""
    for inp in inputs:
        html += f"""
      <div class="field">
        <label for="{inp['id']}">{inp['label']}</label>
        <input 
          type="number" 
          id="{inp['id']}" 
          placeholder="{inp['placeholder']}"
          min="{inp.get('min', 0)}"
          max="{inp.get('max', 9999999)}"
        >
      </div>"""
    return html

# ============================================================
# BUILD JS VARIABLE DECLARATIONS
# ============================================================
def build_calc_vars(inputs):
    vars_js = ""
    for inp in inputs:
        vars_js += f"""
    var {inp['id']} = parseFloat(document.getElementById("{inp['id']}").value) || 0;"""
    return vars_js

# ============================================================
# BUILD RELATED TOOLS HTML
# ============================================================
def build_related(all_data, current_id, category, max_items=6):
    related = [c for c in all_data if c["id"] != current_id and c["category"] == category]
    if len(related) < 3:
        related += [c for c in all_data if c["id"] != current_id and c["category"] != category]
    related = related[:max_items]
    html = ""
    for r in related:
        html += f"""
      <a href="{r['id']}.html" class="tool-card">
        <span class="tool-icon">{r['icon']}</span>
        <span class="tool-name">{r['name']}</span>
      </a>"""
    return html

# ============================================================
# GENERATE ONE PAGE
# ============================================================
def generate_page(calc, template, all_data):
    inputs_html   = build_inputs(calc["inputs"])
    calc_vars     = build_calc_vars(calc["inputs"])
    related_html  = build_related(all_data, calc["id"], calc["category"])
    category_slug = calc["category"].lower().replace(" & ", "-").replace(" ", "-")

    page = template
    page = page.replace("{{ID}}",            calc["id"])
    page = page.replace("{{NAME}}",          calc["name"])
    page = page.replace("{{DESCRIPTION}}",   calc["description"])
    page = page.replace("{{ICON}}",          calc["icon"])
    page = page.replace("{{COLOR}}",         calc["color"])
    page = page.replace("{{CATEGORY}}",      calc["category"])
    page = page.replace("{{CATEGORY_SLUG}}", category_slug)
    page = page.replace("{{META_TITLE}}",    calc["meta_title"])
    page = page.replace("{{META_DESC}}",     calc["meta_desc"])
    page = page.replace("{{RESULT_LABEL}}",  calc["result_label"])
    page = page.replace("{{RESULT_UNIT}}",   calc["result_unit"])
    page = page.replace("{{RESULT_INFO}}",   calc["result_info"])
    page = page.replace("{{FORMULA}}",       calc["formula"])
    page = page.replace("{{INPUTS_HTML}}",   inputs_html)
    page = page.replace("{{CALC_VARS}}",     calc_vars)
    page = page.replace("{{RELATED_HTML}}",  related_html)

    return page

# ============================================================
# GENERATE INDEX / HOME PAGE
# ============================================================
def generate_index(all_data):
    # Group by category
    categories = {}
    for calc in all_data:
        cat = calc["category"]
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(calc)

    category_html = ""
    for cat, calcs in categories.items():
        cards = ""
        for c in calcs:
            cards += f"""
          <a href="{c['id']}.html" class="tool-card" style="--accent:{c['color']}">
            <div class="tool-icon">{c['icon']}</div>
            <div class="tool-name">{c['name']}</div>
          </a>"""
        category_html += f"""
      <section class="category">
        <h2 class="cat-title">{cat}</h2>
        <div class="tools-grid">{cards}
        </div>
      </section>"""

    total = len(all_data)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CalcHub - {total}+ Free Online Calculators</title>
<meta name="description" content="Free online calculators for finance, health, math, and everyday life. {total}+ tools available.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after {{ box-sizing:border-box; margin:0; padding:0; }}
  body {{ font-family:'Plus Jakarta Sans',sans-serif; background:#0f0f13; color:#f0f0f5; min-height:100vh; }}
  header {{ border-bottom:1px solid rgba(255,255,255,0.08); padding:16px 24px; display:flex; align-items:center; }}
  .logo {{ font-size:20px; font-weight:700; color:var(--accent,#3b82f6); text-decoration:none; }}
  .logo span {{ color:#f0f0f5; }}
  .hero {{ text-align:center; padding:80px 24px 60px; }}
  .hero h1 {{ font-size:clamp(32px,5vw,56px); font-weight:700; margin-bottom:16px; }}
  .hero h1 span {{ color:#3b82f6; }}
  .hero p {{ color:#9090a0; font-size:18px; max-width:500px; margin:0 auto 32px; line-height:1.6; }}
  .count-badge {{ display:inline-block; background:rgba(59,130,246,0.15); color:#3b82f6; border:1px solid rgba(59,130,246,0.3); border-radius:100px; padding:6px 16px; font-size:14px; font-weight:600; margin-bottom:20px; }}
  main {{ max-width:1100px; margin:0 auto; padding:0 24px 80px; }}
  .category {{ margin-bottom:48px; }}
  .cat-title {{ font-size:22px; font-weight:600; margin-bottom:20px; padding-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.08); }}
  .tools-grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:12px; }}
  .tool-card {{ background:#18181f; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:20px 16px; text-decoration:none; color:#f0f0f5; display:flex; flex-direction:column; align-items:center; gap:12px; text-align:center; transition:border-color 0.2s,transform 0.2s; }}
  .tool-card:hover {{ border-color:var(--accent,#3b82f6); transform:translateY(-3px); }}
  .tool-icon {{ font-size:32px; }}
  .tool-name {{ font-size:14px; font-weight:500; line-height:1.4; }}
  footer {{ border-top:1px solid rgba(255,255,255,0.08); padding:24px; text-align:center; color:#9090a0; font-size:13px; }}
</style>
</head>
<body>
<header>
  <a href="index.html" class="logo">Calc<span>Hub</span></a>
</header>
<div class="hero">
  <div class="count-badge">{total}+ Free Calculators</div>
  <h1>The Ultimate <span>Calculator</span> Hub</h1>
  <p>Free online calculators for finance, health, math and everyday life — no sign-up needed.</p>
</div>
<main>
  {category_html}
</main>
<footer>© 2024 CalcHub — Free Online Calculators</footer>
</body>
</html>"""

# ============================================================
# MAIN
# ============================================================
def main():
    parser = argparse.ArgumentParser(description="CalcHub Page Generator")
    parser.add_argument("--limit",    type=int,  default=None, help="Max pages to generate")
    parser.add_argument("--category", type=str,  default=None, help="Filter by category")
    args = parser.parse_args()

    print("=" * 55)
    print("  CalcHub - Bulk Page Generator")
    print("=" * 55)

    # Load
    all_data = load_data()
    template = load_template()
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Filter
    data = all_data
    if args.category:
        data = [c for c in data if c["category"].lower() == args.category.lower()]
        print(f"  Category filter: {args.category}")
    if args.limit:
        data = data[:args.limit]
        print(f"  Limit: {args.limit} pages")

    print(f"  Total to generate: {len(data)} pages")
    print("-" * 55)

    # Generate pages
    success = 0
    errors  = 0
    start   = time.time()

    for i, calc in enumerate(data, 1):
        try:
            page    = generate_page(calc, template, all_data)
            outpath = os.path.join(OUTPUT_DIR, f"{calc['id']}.html")
            with open(outpath, "w", encoding="utf-8") as f:
                f.write(page)
            success += 1
            if i % 100 == 0 or i == len(data):
                elapsed = time.time() - start
                rate    = i / elapsed
                eta     = (len(data) - i) / rate if rate > 0 else 0
                print(f"  [{i}/{len(data)}]  ✓  {success} done  |  {rate:.0f} pages/sec  |  ETA: {eta:.0f}s")
        except Exception as e:
            errors += 1
            print(f"  ERROR on {calc.get('id','?')}: {e}")

    # Generate index
    index_html = generate_index(all_data)
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        f.write(index_html)
    print(f"\n  ✓ Index page generated: {INDEX_FILE}")

    # Summary
    elapsed = time.time() - start
    print("\n" + "=" * 55)
    print(f"  DONE!")
    print(f"  Pages generated : {success}")
    print(f"  Errors          : {errors}")
    print(f"  Time taken      : {elapsed:.2f} seconds")
    print(f"  Output folder   : ./{OUTPUT_DIR}/")
    print("=" * 55)

if __name__ == "__main__":
    main()
