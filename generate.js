#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// CONFIG
const DATA_FILE = "data/calculators.json";
const TEMPLATE_FILE = "templates/calculator.html";
const OUTPUT_DIR = "output";
const INDEX_FILE = "output/index.html";

// LOAD FILES
function loadData() {
    const data = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(data);
}

function loadTemplate() {
    return fs.readFileSync(TEMPLATE_FILE, "utf8");
}

// BUILD INPUTS HTML
function buildInputs(inputs) {
    let html = "";
    for (const inp of inputs) {
        html += `
      <div class="field">
        <label for="${inp.id}">${inp.label}</label>
        <input 
          type="number" 
          id="${inp.id}" 
          placeholder="${inp.placeholder}"
          min="${inp.min || 0}"
          max="${inp.max || 9999999}"
        >
      </div>`;
    }
    return html;
}

// BUILD JS VARIABLE DECLARATIONS
function buildCalcVars(inputs) {
    let vars_js = "";
    for (const inp of inputs) {
        vars_js += `
    var ${inp.id} = parseFloat(document.getElementById("${inp.id}").value) || 0;`;
    }
    return vars_js;
}

// BUILD RELATED TOOLS HTML
function buildRelated(allData, currentId, category, maxItems = 6) {
    let related = allData.filter(c => c.id !== currentId && c.category === category);
    if (related.length < 3) {
        const otherCategory = allData.filter(c => c.id !== currentId && c.category !== category);
        related = related.concat(otherCategory);
    }
    related = related.slice(0, maxItems);
    
    let html = "";
    for (const r of related) {
        html += `
      <a href="${r.id}.html" class="tool-card">
        <span class="tool-icon">${r.icon}</span>
        <span class="tool-name">${r.name}</span>
      </a>`;
    }
    return html;
}

// GENERATE ONE PAGE
function generatePage(calc, template, allData) {
    const inputsHtml = buildInputs(calc.inputs);
    const calcVars = buildCalcVars(calc.inputs);
    const relatedHtml = buildRelated(allData, calc.id, calc.category);
    const categorySlug = calc.category.toLowerCase().replace(" & ", "-").replace(" ", "-");

    let page = template;
    page = page.replace(/\{\{ID\}\}/g, calc.id);
    page = page.replace(/\{\{NAME\}\}/g, calc.name);
    page = page.replace(/\{\{DESCRIPTION\}\}/g, calc.description);
    page = page.replace(/\{\{ICON\}\}/g, calc.icon);
    page = page.replace(/\{\{COLOR\}\}/g, calc.color);
    page = page.replace(/\{\{CATEGORY\}\}/g, calc.category);
    page = page.replace(/\{\{CATEGORY_SLUG\}\}/g, categorySlug);
    page = page.replace(/\{\{META_TITLE\}\}/g, calc.meta_title);
    page = page.replace(/\{\{META_DESC\}\}/g, calc.meta_desc);
    page = page.replace(/\{\{RESULT_LABEL\}\}/g, calc.result_label);
    page = page.replace(/\{\{RESULT_UNIT\}\}/g, calc.result_unit);
    page = page.replace(/\{\{RESULT_INFO\}\}/g, calc.result_info);
    page = page.replace(/\{\{FORMULA\}\}/g, calc.formula);
    page = page.replace(/\{\{INPUTS_HTML\}\}/g, inputsHtml);
    page = page.replace(/\{\{CALC_VARS\}\}/g, calcVars);
    page = page.replace(/\{\{RELATED_HTML\}\}/g, relatedHtml);

    return page;
}

// GENERATE INDEX / HOME PAGE
function generateIndex(allData) {
    // Group by category
    const categories = {};
    for (const calc of allData) {
        const cat = calc.category;
        if (!categories[cat]) {
            categories[cat] = [];
        }
        categories[cat].push(calc);
    }

    let categoryHtml = "";
    for (const [cat, calcs] of Object.entries(categories)) {
        let cards = "";
        for (const c of calcs) {
            cards += `
          <a href="${c.id}.html" class="tool-card" style="--accent:${c.color}">
            <div class="tool-icon">${c.icon}</div>
            <div class="tool-name">${c.name}</div>
          </a>`;
        }
        categoryHtml += `
      <section class="category">
        <h2 class="cat-title">${cat}</h2>
        <div class="tools-grid">${cards}
        </div>
      </section>`;
    }

    const total = allData.length;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CalcHub - ${total}+ Free Online Calculators</title>
<meta name="description" content="Free online calculators for finance, health, math, and everyday life. ${total}+ tools available.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Plus Jakarta Sans',sans-serif; background:#0f0f13; color:#f0f0f5; min-height:100vh; }
  header { position: sticky; top: 0; z-index: 1000; border-bottom:1px solid rgba(255,255,255,0.08); padding:16px 24px; display:flex; align-items:center; background: rgba(15, 15, 19, 0.9); backdrop-filter: blur(10px); }
  .logo { font-size:20px; font-weight:700; color:#f0f0f5; text-decoration:none; }
  .logo .accent { color:#3b82f6; }
  .hero { text-align:center; padding:80px 24px 60px; }
  .hero h1 { font-size:clamp(32px,5vw,56px); font-weight:700; margin-bottom:16px; }
  .hero h1 span { color:#3b82f6; }
  .hero p { color:#9090a0; font-size:18px; max-width:500px; margin:0 auto 32px; line-height:1.6; }
  .count-badge { display:inline-block; background:rgba(59,130,246,0.15); color:#3b82f6; border:1px solid rgba(59,130,246,0.3); border-radius:100px; padding:6px 16px; font-size:14px; font-weight:600; margin-bottom:20px; }
  main { max-width:1100px; margin:0 auto; padding:0 24px 80px; }
  .category { margin-bottom:48px; }
  .cat-title { font-size:22px; font-weight:600; margin-bottom:20px; padding-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.08); }
  .tools-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:12px; }
  .tool-card { background:#18181f; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:20px 16px; text-decoration:none; color:#f0f0f5; display:flex; flex-direction:column; align-items:center; gap:12px; text-align:center; transition:border-color 0.2s,transform 0.2s; }
  .tool-card:hover { border-color:#3b82f6; transform:translateY(-3px); }
  .tool-icon { font-size:32px; }
  .tool-name { font-size:14px; font-weight:500; line-height:1.4; }
  footer { border-top:1px solid rgba(255,255,255,0.08); padding:24px; text-align:center; color:#9090a0; font-size:13px; }
  @media (max-width: 600px) { nav { display: none; } }
</style>
</head>
<body>
<header>
  <a href="index.html" class="logo">AllCalculators<span class="accent">Hub</span></a>
</header>
<div class="hero">
  <div class="count-badge">${total}+ Free Calculators</div>
  <h1>The Ultimate <span>Calculator</span> Hub</h1>
  <p>Free online calculators for finance, health, math and everyday life — no sign-up needed.</p>
</div>
<main>
  ${categoryHtml}
</main>
<footer>© 2024 CalcHub — Free Online Calculators</footer>
</body>
</html>`;
}

// MAIN
function main() {
    console.log("=" * 55);
    console.log("  CalcHub - Bulk Page Generator (Node.js)");
    console.log("=" * 55);

    // Parse command line arguments
    const args = process.argv.slice(2);
    let limit = null;
    let category = null;
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--limit' && i + 1 < args.length) {
            limit = parseInt(args[i + 1]);
        } else if (args[i] === '--category' && i + 1 < args.length) {
            category = args[i + 1];
        }
    }

    // Load
    const allData = loadData();
    const template = loadTemplate();
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Filter
    let data = allData;
    if (category) {
        data = data.filter(c => c.category.toLowerCase() === category.toLowerCase());
        console.log(`  Category filter: ${category}`);
    }
    if (limit) {
        data = data.slice(0, limit);
        console.log(`  Limit: ${limit} pages`);
    }

    console.log(`  Total to generate: ${data.length} pages`);
    console.log("-" * 55);

    // Generate pages
    let success = 0;
    let errors = 0;
    const start = Date.now();

    for (let i = 0; i < data.length; i++) {
        const calc = data[i];
        try {
            const page = generatePage(calc, template, allData);
            const outpath = path.join(OUTPUT_DIR, `${calc.id}.html`);
            fs.writeFileSync(outpath, page, "utf8");
            success++;
            
            if ((i + 1) % 100 === 0 || (i + 1) === data.length) {
                const elapsed = (Date.now() - start) / 1000;
                const rate = (i + 1) / elapsed;
                const eta = rate > 0 ? (data.length - (i + 1)) / rate : 0;
                console.log(`  [${i + 1}/${data.length}]  ✓  ${success} done  |  ${Math.round(rate)} pages/sec  |  ETA: ${Math.round(eta)}s`);
            }
        } catch (e) {
            errors++;
            console.log(`  ERROR on ${calc.id || '?'}: ${e.message}`);
        }
    }

    // Generate index
    const indexHtml = generateIndex(allData);
    fs.writeFileSync(INDEX_FILE, indexHtml, "utf8");
    console.log(`\n  ✓ Index page generated: ${INDEX_FILE}`);

    // Summary
    const elapsed = (Date.now() - start) / 1000;
    console.log("\n" + "=" * 55);
    console.log("  DONE!");
    console.log(`  Pages generated : ${success}`);
    console.log(`  Errors          : ${errors}`);
    console.log(`  Time taken      : ${elapsed.toFixed(2)} seconds`);
    console.log(`  Output folder   : ./${OUTPUT_DIR}/`);
    console.log("=" * 55);
}

if (require.main === module) {
    main();
}
