/**
 * Renders every src/diagrams/*.mmd file to a matching .svg, once, here on your
 * machine. The site then inlines those SVGs at build time, so the published
 * pages ship no Mermaid runtime and no client-side rendering.
 *
 * Run it after editing any .mmd file:
 *   node scripts/generate-diagrams.mjs
 *
 * It needs Chrome (Mermaid measures text, so it needs a real browser) and a
 * free local port. Neither is needed to build or deploy the site.
 *
 * Theme colours are rendered as sentinel hex values and then swapped for the
 * site's CSS variables, so one SVG follows both light and dark mode.
 */
import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import http from 'node:http';

const execFileAsync = promisify(execFile);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const diagramDir = path.join(root, 'src/diagrams');
const tmpDir = path.join(root, '.diagram-build');
const PORT = 8917;

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
];

/**
 * Sentinel colour -> the CSS the final SVG should use instead. Each sentinel is
 * a flat grey so Mermaid's own derived shades stay easy to spot and remap.
 */
const TOKENS = {
  '#f0f1f2': { rgb: [240, 241, 242], css: 'hsl(var(--background))' },
  '#e1e2e3': { rgb: [225, 226, 227], css: 'hsl(var(--muted))' },
  '#d2d3d4': { rgb: [210, 211, 212], css: 'hsl(var(--foreground))' },
  '#c3c4c5': { rgb: [195, 196, 197], css: 'hsl(var(--border))' },
  '#b4b5b6': { rgb: [180, 181, 182], css: 'hsl(var(--muted-foreground))' },
};

/**
 * Shades Mermaid computes itself rather than taking from themeVariables.
 * #0f0e0d is its "readable text on the background" inverse, which would be
 * near-black text on a dark page if left alone.
 */
const DERIVED = {
  '#0f0e0d': 'hsl(var(--foreground))',
};

async function findChrome() {
  const { access } = await import('node:fs/promises');
  for (const candidate of CHROME_CANDIDATES) {
    try {
      await access(candidate);
      return candidate;
    } catch {}
  }
  throw new Error(
    'No Chrome/Chromium found. Mermaid needs a real browser to measure text.\n' +
      'Install Google Chrome, or add its path to CHROME_CANDIDATES in this script.'
  );
}

function serve(dir) {
  const server = http.createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const filePath = path.join(dir, urlPath);
      if (!filePath.startsWith(dir)) {
        res.writeHead(403).end();
        return;
      }
      const body = await readFile(filePath);
      const type = filePath.endsWith('.mjs') || filePath.endsWith('.js')
        ? 'text/javascript'
        : filePath.endsWith('.html')
          ? 'text/html'
          : 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type }).end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

function buildHarness(charts) {
  return `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body>
<div id="results"></div>
<script type="module">
  import mermaid from '/node_modules/mermaid/dist/mermaid.esm.mjs';

  const charts = ${JSON.stringify(charts)};

  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    fontFamily: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    flowchart: { rankSpacing: 20, nodeSpacing: 16, padding: 6, useMaxWidth: true },
    themeVariables: {
      background: '#f0f1f2',
      primaryColor: '#e1e2e3',
      mainBkg: '#e1e2e3',
      secondaryColor: '#e1e2e3',
      tertiaryColor: '#f0f1f2',
      primaryTextColor: '#d2d3d4',
      textColor: '#d2d3d4',
      nodeTextColor: '#d2d3d4',
      primaryBorderColor: '#c3c4c5',
      nodeBorder: '#c3c4c5',
      clusterBkg: '#f0f1f2',
      clusterBorder: '#c3c4c5',
      edgeLabelBackground: '#f0f1f2',
      lineColor: '#b4b5b6',
      fontSize: '13px',
    },
  });

  const out = document.getElementById('results');
  for (const [name, code] of Object.entries(charts)) {
    const { svg } = await mermaid.render('gen-' + name, code);
    const box = document.createElement('div');
    box.setAttribute('data-diagram', name);
    box.innerHTML = svg;
    out.appendChild(box);
  }
  document.title = 'DIAGRAMS_READY';
</script>
</body></html>`;
}

/** Make the rendered SVG theme-aware and responsive. */
function postProcess(svg) {
  let out = svg;

  for (const [sentinel, { rgb, css }] of Object.entries(TOKENS)) {
    out = out.replaceAll(new RegExp(sentinel, 'gi'), css);
    // Mermaid also emits some of these as rgb()/rgba() with an alpha.
    const [r, g, b] = rgb;
    out = out.replace(
      new RegExp(`rgba?\\(\\s*${r}\\s*,\\s*${g}\\s*,\\s*${b}\\s*(?:,\\s*([\\d.]+)\\s*)?\\)`, 'gi'),
      (_match, alpha) => (alpha ? css.replace(/\)$/, ` / ${alpha})`) : css)
    );
  }

  for (const [derived, css] of Object.entries(DERIVED)) {
    out = out.replaceAll(new RegExp(derived, 'gi'), css);
  }

  // Set width/height to match the viewBox 1:1, so every diagram renders at the
  // SAME scale (one source unit = one CSS px), matching how they were measured
  // during generation. Forcing width:100% here would stretch each diagram to
  // fill its container independently of the others, magnifying small/simple
  // diagrams far more than large/complex ones, which is what caused the two
  // diagrams on the same page to look wildly different in scale. Capping and
  // responsive shrinking happen in the component's CSS instead, applied
  // consistently across all diagrams, not baked in per-file here.
  //
  // This must touch ONLY the root <svg> tag: <rect> and <foreignObject> (which
  // carries the label text) both collapse to nothing if their own width/height
  // are stripped.
  out = out.replace(/^<svg\b[^>]*>/, (rootTag) => {
    const viewBoxMatch = rootTag.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
    if (!viewBoxMatch) throw new Error('Root <svg> has no viewBox, cannot size it.');
    const [, w, h] = viewBoxMatch;

    let tag = rootTag
      .replace(/\s(?:width|height)="[^"]*"/g, '')
      .replace(/\sstyle="[^"]*"/g, '')
      .replace(/\spreserveAspectRatio="[^"]*"/g, '');
    return tag.replace(
      /^<svg\b/,
      `<svg width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"`
    );
  });

  return out.trim();
}

async function main() {
  const chrome = await findChrome();

  const files = (await readdir(diagramDir)).filter((f) => f.endsWith('.mmd'));
  if (!files.length) {
    console.log('No .mmd files found in src/diagrams');
    return;
  }

  const charts = {};
  for (const file of files) {
    charts[path.basename(file, '.mmd')] = await readFile(path.join(diagramDir, file), 'utf8');
  }

  await mkdir(tmpDir, { recursive: true });
  const harnessPath = path.join(root, '.diagram-harness.html');
  await writeFile(harnessPath, buildHarness(charts));

  const server = await serve(root);
  try {
    const { stdout } = await execFileAsync(
      chrome,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--virtual-time-budget=15000',
        '--dump-dom',
        `http://localhost:${PORT}/.diagram-harness.html`,
      ],
      { maxBuffer: 64 * 1024 * 1024 }
    );

    if (!stdout.includes('DIAGRAMS_READY')) {
      throw new Error('Mermaid did not finish rendering. Check the .mmd syntax.');
    }

    for (const name of Object.keys(charts)) {
      const marker = `data-diagram="${name}"`;
      const start = stdout.indexOf(marker);
      if (start === -1) throw new Error(`No output produced for ${name}`);
      const svgStart = stdout.indexOf('<svg', start);
      const svgEnd = stdout.indexOf('</svg>', svgStart) + '</svg>'.length;
      const svg = postProcess(stdout.slice(svgStart, svgEnd));
      const outPath = path.join(diagramDir, `${name}.svg`);
      await writeFile(outPath, svg + '\n');
      console.log(`✓ ${name}.svg (${(svg.length / 1024).toFixed(1)} KB)`);
    }
  } finally {
    server.close();
    await rm(harnessPath, { force: true });
    await rm(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
