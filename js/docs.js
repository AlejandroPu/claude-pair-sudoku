// Documentation page: fetches README.md, DEVLOG.md and CHANGELOG.md and renders them.
// The Markdown files are the only source of the text; nothing is copied into docs.html.

// Accent rules — the place to add or remove amber/blue accents (tests/docs.test.mjs pins the counts).
const RULES = [
  { page: 'readme', section: /^How to play/, whole: true },
  { page: 'readme', section: /^License/, whole: true },
  { page: 'part-1', lead: 'blue' },
  { page: 'part-1', section: /^Conclusion/, whole: true },
  { page: 'readme', section: /^Tech stack/, thead: 'amber' },
  { page: 'readme', section: /^Development/, thead: 'amber' },
  { page: 'readme', section: /^Puzzle codes/, kind: 'ol' },
  { page: 'part-1', section: /^4\./, kind: 'table', thead: 'blue' },
  { page: 'part-1', match: /progressive conceptual compression/, after: true },
  { page: 'part-2', section: /^2\./, whole: true },
  { page: 'part-2', section: /^5\./, whole: true },
  { page: 'part-2', section: /^8\./, whole: true },
  { page: 'part-2', section: /^10\./, kind: 'ul' },
  { page: 'part-2', match: /most important progression/, take: 2 },
  { page: 'part-3', section: /^3\./, whole: true },
  { page: 'part-3', section: /^4\./, kind: 'ul' },
  { page: 'part-3', section: /^5\./, kind: 'ul' },
];

const ORDER = ['readme', 'part-1', 'part-2', 'part-3'];
const LICENSE_URL = 'https://github.com/AlejandroPu/claude-pair-sudoku/blob/main/LICENSE';
const SITE_DOCS_URL = 'https://alejandropu.github.io/claude-pair-sudoku/docs.html';

// ══ MARKDOWN RENDERER (only what README.md and DEVLOG.md use) ══

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = t => t.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/\s/g, '-');

// Targets written for GitHub, rewritten for this page (routing is by URL hash).
function linkTarget(u) {
  let m;
  if ((m = u.match(/^DEVLOG\.md#(.+)$/))) return '#' + m[1];
  if (u === 'DEVLOG.md') return '#part-1';
  if (u === 'README.md') return '#readme';
  if (u === 'LICENSE') return LICENSE_URL;
  return u;
}

function inline(text) {
  const keep = [];
  const hold = h => '\u0000' + (keep.push(h) - 1) + '\u0000';
  let s = text.replace(/`([^`]+)`/g, (_, c) => hold('<code>' + esc(c) + '</code>'));
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => hold('<a href="' + esc(linkTarget(u)) + '">' + inline(t) + '</a>'));
  s = esc(s);
  s = s.replace(/https?:\/\/[^\s<]+[^\s<.,;:)]/g, u => hold('<a href="' + u + '">' + u + '</a>'));
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<em>$2</em>');
  s = s.replace(/ {2}$/gm, '<br>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[+i]);
}

// Returns blocks: headings { type:'h', n, id, text, html }, hr, and { type:'b', kind, text, html }.
// `slugs` de-duplicates heading ids within one file.
function render(md, slugs) {
  const L = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  const isBlank = l => /^\s*$/.test(l);
  const starts = l => /^(#{1,6} |```|> ?|\||- |\* |\d+\. |---\s*$|<hr)/.test(l);
  while (i < L.length) {
    const l = L[i];
    if (isBlank(l)) { i++; continue; }
    let m;
    if ((m = l.match(/^(#{1,6}) (.*)$/))) {
      const n = m[1].length, html = inline(m[2]);
      let id = slugify(m[2].replace(/\*\*/g, '')), k = id, c = 0;
      while (slugs.has(k)) k = id + '-' + (++c);
      slugs.add(k);
      out.push({ type: 'h', n, id: k, text: m[2], html: `<h${n} id="${k}">${html}</h${n}>` });
      i++; continue;
    }
    if (l.startsWith('```')) {
      const buf = []; i++;
      while (i < L.length && !L[i].startsWith('```')) buf.push(L[i++]);
      i++; out.push({ type: 'b', kind: 'pre', text: buf.join('\n'), html: '<pre><code>' + esc(buf.join('\n')) + '</code></pre>' }); continue;
    }
    if (/^---\s*$/.test(l) || /^<hr\b/i.test(l)) { out.push({ type: 'hr', html: '<hr>' }); i++; continue; }
    if (/^> ?/.test(l)) {
      const buf = [];
      while (i < L.length && /^> ?/.test(L[i])) buf.push(L[i++].replace(/^> ?/, ''));
      const inner = render(buf.join('\n'), new Set()).map(b => b.html).join('');
      const note = /^\*\*Note\b/.test(buf[0]);
      out.push({ type: 'b', kind: 'quote', text: buf.join(' '), html: `<blockquote${note ? ' class="note"' : ''}>${inner}</blockquote>` }); continue;
    }
    if (l.startsWith('|') && L[i + 1] && /^\|[\s:|-]+\|\s*$/.test(L[i + 1])) {
      const cells = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const head = cells(l); i += 2; const rows = [];
      while (i < L.length && L[i].startsWith('|')) rows.push(cells(L[i++]));
      out.push({ type: 'b', kind: 'table', text: l, html: '<div class="tbl"><table><thead><tr>' + head.map(c => '<th>' + inline(c) + '</th>').join('') +
        '</tr></thead><tbody>' + rows.map(r => '<tr>' + r.map(c => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>' });
      continue;
    }
    if (/^(- |\* |\d+\. )/.test(l)) {
      const ordered = /^\d+\. /.test(l), items = [], raw = [];
      while (i < L.length && (ordered ? /^\d+\. /.test(L[i]) : /^(- |\* )/.test(L[i]))) {
        let it = L[i++].replace(/^(- |\* |\d+\. )/, '');
        while (i < L.length && /^\s{2,}\S/.test(L[i])) it += ' ' + L[i++].trim();
        raw.push(it); items.push('<li>' + inline(it) + '</li>');
      }
      out.push({ type: 'b', kind: ordered ? 'ol' : 'ul', text: raw.join(' '), html: `<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>` }); continue;
    }
    const buf = [];
    while (i < L.length && !isBlank(L[i]) && !(buf.length && starts(L[i]))) buf.push(L[i++]);
    out.push({ type: 'b', kind: 'p', text: buf.join(' '), html: '<p>' + inline(buf.join('\n')) + '</p>' });
  }
  return out;
}

// ══ COLOUR BLOCKS ══
// Each page opens amber (everything before its first "##"), then one blue block per "##"
// section; RULES add amber where asked: a whole section, a table header, or single blocks
// inside a blue section (an amber inset).

function segmentsOf(blocks) {
  const segs = [{ head: null, items: [] }];
  for (const b of blocks) {
    if (b.type === 'hr') continue;
    if (b.type === 'h' && (b.n === 2 || (b.n === 1 && segs[0].items.length))) segs.push({ head: b, items: [b] });
    else segs[segs.length - 1].items.push(b);
  }
  return segs;
}

const rulesFor = (route, sg) =>
  RULES.filter(r => r.page === route && (!r.section || (sg.head && sg.head.n === 2 && r.section.test(sg.head.text))));

// Index of the first block a rule points at inside a segment, or -1. A header-only rule points at a table.
const ruleAt = (r, sg) => sg.items.findIndex(b => b.type !== 'h' &&
  (!(r.kind || r.thead) || b.kind === (r.kind || 'table')) && (!r.match || r.match.test(b.text || '')));

// True when the rule finds something in these blocks (the tests use it to catch orphaned accents).
function ruleMatches(r, blocks) {
  return segmentsOf(blocks).some(sg => rulesFor(r.page, sg).includes(r) && (r.whole || r.lead || ruleAt(r, sg) >= 0));
}

function assemble(route, blocks) {
  let html = '';
  segmentsOf(blocks).forEach((sg, k) => {
    if (!sg.items.length) return;
    const rules = rulesFor(route, sg);
    const opening = k === 0 || sg.head.n === 1;
    const lead = k === 0 && rules.find(r => r.lead);
    const color = lead ? lead.lead : opening || rules.some(r => r.whole) ? 'amber' : 'blue';
    const marks = new Set(); let thead = null;
    for (const r of rules) {
      if (r.whole || r.lead) continue;
      if (r.thead) { thead = r.thead; if (!r.kind) continue; }
      const at = ruleAt(r, sg);
      if (at < 0) continue;
      for (let j = 0; j < (r.take || 1); j++) marks.add(at + j + (r.after ? 1 : 0));
    }
    html += `<section class="blk ${color}">`;
    let inset = false;
    sg.items.forEach((b, i) => {
      const m = color === 'blue' && marks.has(i);
      if (m && !inset) { html += '<div class="inset">'; inset = true; }
      if (!m && inset) { html += '</div>'; inset = false; }
      html += thead && b.kind === 'table' ? b.html.replace('<thead>', `<thead class="${thead}-head">`) : b.html;
    });
    html += (inset ? '</div>' : '') + '</section>';
  });
  return html;
}

// ══ PAGES AND ROUTING ══

const trimHr = arr => { while (arr.length && arr[arr.length - 1].type === 'hr') arr.pop(); return arr; };

// The README is one page; the DEVLOG is split at its "# Part …" headings (Part I also carries
// the DEVLOG title and intro). `owner` maps every heading id to the page that shows it.
function buildPages(readmeMd, devlogMd) {
  const readme = render(readmeMd.trim(), new Set());
  const devlog = render(devlogMd.trim(), new Set());
  const partAt = devlog.map((b, k) => (b.type === 'h' && b.n === 1 && /^Part [IVX]+/.test(b.text)) ? k : -1).filter(k => k >= 0);
  const intro = trimHr(devlog.slice(1, partAt[0]));
  const pages = {
    readme: { label: 'README', eyebrow: 'README.md', blocks: trimHr(readme) },
    'part-1': { label: 'Part I', eyebrow: 'DEVLOG.md · Part I', blocks: [devlog[0], ...intro, { type: 'hr', html: '<hr>' }, ...trimHr(devlog.slice(partAt[0], partAt[1]))] },
    'part-2': { label: 'Part II', eyebrow: 'DEVLOG.md · Part II', blocks: trimHr(devlog.slice(partAt[1], partAt[2])) },
    'part-3': { label: 'Part III', eyebrow: 'DEVLOG.md · Part III', blocks: trimHr(devlog.slice(partAt[2])) },
  };
  const owner = {};
  for (const r of ORDER) for (const b of pages[r].blocks) if (b.type === 'h') owner[b.id] = owner[b.id] || r;
  return { pages, owner };
}

// A URL hash -> the page to show and the heading to scroll to (anything else -> README).
function resolveHash(hash, owner) {
  const h = (hash || '').replace(/^#/, '');
  if (ORDER.includes(h)) return { route: h };
  if (owner[h]) return { route: owner[h], anchor: h };
  return { route: 'readme' };
}

// The release label comes from the first "## [x.y.z]" heading of the CHANGELOG.
function releaseOf(changelogMd) {
  const m = changelogMd.match(/^## \[(\d+\.\d+\.\d+)\]/m);
  return m ? m[1] : null;
}

// ══ PAGE (browser only) ══

function showPage(model, hash) {
  const { route, anchor } = resolveHash(hash, model.owner);
  const p = model.pages[route];
  const view = document.getElementById('view'), pager = document.getElementById('pager');
  view.innerHTML = '<p class="eyebrow">' + p.eyebrow + '</p><div class="md">' + assemble(route, p.blocks) + '</div>';
  const k = ORDER.indexOf(route), prev = ORDER[k - 1], next = ORDER[k + 1];
  pager.innerHTML = (prev ? `<a href="#${prev}">← ${model.pages[prev].label}</a>` : '<span></span>') +
                    (next ? `<a href="#${next}">${model.pages[next].label} →</a>` : '');
  document.querySelectorAll('#nav a').forEach(a => {
    if (a.dataset.route === route) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  const target = anchor && document.getElementById(anchor);
  if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
}

async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(url + ' ' + r.status);
  return r.text();
}

async function boot() {
  try {
    const [readme, devlog, changelog] = await Promise.all(['README.md', 'DEVLOG.md', 'CHANGELOG.md'].map(fetchText));
    const model = buildPages(readme, devlog);
    const version = releaseOf(changelog);
    if (version) document.getElementById('release').textContent = 'Release ' + version;
    const go = () => showPage(model, location.hash);
    window.addEventListener('hashchange', go);
    go();
  } catch (e) {
    document.getElementById('view').innerHTML = '<p>The documentation could not be loaded. Open it from <a href="' + SITE_DOCS_URL +
      '">the published site</a>, or run a local server (see Run locally in the README).</p>';
  }
}

boot();
