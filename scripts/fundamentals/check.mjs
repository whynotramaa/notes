import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import katex from 'katex';

const root = 'src/content/fundamentals';
const expected = ['dbms', 'cn', 'os'];
const only = process.argv.slice(2);
const folders = only.length ? only : expected;
const figures = new Map();
const errors = [];
const warnings = [];
const report = [];
const referenced = new Set();
const covers = new Set();
const fail = (ok, message) => { if (!ok) errors.push(message); };

for (const file of await readdir('src/figs')) {
  if (!file.endsWith('.js')) continue;
  for (const [name, fn] of Object.entries(await import(`../../src/figs/${file}`))) {
    fail(!figures.has(name), `Duplicate exported figure ${name}`);
    figures.set(name, fn);
  }
}

const banned = /\b(?:delve|tapestry|testament|pivotal|seamlessly?|leverage|robust|realm|landscape|game-changer|unlock|unleash|embark|crucial|harness|intricate|furthermore|moreover|additionally|ever-evolving|cutting-edge)\b|in essence|it's important to note|it is worth noting|let's dive|dive into|navigate the|vital role|plays a key role|in today's|in conclusion|to summarize|overall,/gi;
const plain = s => s.replace(/<[^>]*>/g, '').replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

for (const slug of folders) {
  let files;
  try {
    files = (await readdir(`${root}/${slug}`)).filter(file => file.endsWith('.md')).sort();
  } catch {
    errors.push(`Missing unit ${slug}`);
    continue;
  }
  let meta;
  try {
    meta = (await import(`../../${root}/${slug}/_note.js`)).site;
  } catch {
    errors.push(`${slug}: missing metadata`);
    continue;
  }
  let parts = 0;
  const sections = [];
  const diagrams = [];
  let words = 0;
  let bodyWords = 0;
  let math = 0;
  const terms = new Set();
  fail(meta.order === expected.indexOf(slug) + 1, `${slug}: syllabus order`);
  for (const id of [meta.cover, meta.where]) {
    fail(figures.has(id), `${slug}: missing ${id}`);
    if (id) referenced.add(id);
  }
  if (meta.cover) covers.add(meta.cover);

  for (const file of files) {
    const source = await readFile(`${root}/${slug}/${file}`, 'utf8');
    const target = file === '_front.md'
      ? `dist/fundamentals/${slug}/index.html`
      : `dist/fundamentals/${slug}/${file.slice(0, -3)}/index.html`;
    let html = '';
    try {
      html = await readFile(target, 'utf8');
    } catch {
      errors.push(`Unbuilt page ${target}`);
    }
    fail(!/[\u2013\u2014]/.test(source), `${slug}/${file}: long dash`);
    const bad = [...source.matchAll(banned)].map(match => match[0]);
    fail(!bad.length, `${slug}/${file}: banned wording ${bad.join(', ')}`);
    fail(!html.includes('class="err"'), `${slug}/${file}: render error`);
    fail(!/XPHX\d+XPHX|KTXK\d+KTXK/.test(html), `${slug}/${file}: unresolved placeholders`);
    words += source.split(/\s+/).filter(Boolean).length;
    if (source.startsWith('@part')) {
      parts++;
      bodyWords += source.split(/\s+/).filter(Boolean).length;
      fail(source.includes(`where:${parts}`), `${slug}/${file}: map index`);
      const boxes = [...source.matchAll(/^:::(\w+) /gm)];
      fail(boxes.length >= 4 && boxes.length <= 7, `${slug}/${file}: ${boxes.length} callouts`);
      fail(boxes.filter(match => match[1] === 'key').length === 1, `${slug}/${file}: recap count`);
      fail(/:::key In one breath\n[\s\S]+\n:::\s*$/.test(source), `${slug}/${file}: missing final recap`);
      const blurb = source.split('\n')[0].split('|')[2]?.trim() || '';
      fail((blurb.match(/\.(?:\s|$)/g) || []).length === 3, `${slug}/${file}: opener needs three sentences`);
      for (const [, term] of source.matchAll(/\*\*([^*\n]+)\*\*/g)) {
        if (term.startsWith('"') || term.startsWith("'")) continue;
        const key = term.toLowerCase();
        if (terms.has(key)) warnings.push(`${slug}/${file}: repeated bold term ${term}`);
        terms.add(key);
      }
      for (const block of source.split(/^## (?=\d+\.)/m).slice(1)) {
        const first = block.split('\n')[0];
        const number = +first.split('.')[0];
        sections.push(number);
        const length = block.split(/\s+/).length;
        if (length < 180) warnings.push(`${slug}: short section ${number}, ${length} words`);
        fail(/@fig|\d/.test(block.slice(first.length)), `${slug}: section ${number} has no example or figure`);
      }
    }
    for (const [, id] of source.matchAll(/^@fig (\w+)/gm)) {
      diagrams.push(id);
      referenced.add(id);
      fail(figures.has(id), `${slug}/${file}: missing figure ${id}`);
      fail(html.includes(`id="fig-${id}"`), `${slug}/${file}: unrendered ${id}`);
    }
    const expectedCode = [...source.matchAll(/```\w*\n([\s\S]*?)```/g)].map(match => match[1].replace(/\n$/, ''));
    const actualCode = [...html.matchAll(/<pre\b[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)].map(match => plain(match[1]));
    fail(JSON.stringify(expectedCode) === JSON.stringify(actualCode), `${slug}/${file}: code rendering changed`);
    const noCode = source.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]+`/g, '');
    for (const [, display, inline] of noCode.matchAll(/\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$/g)) {
      try {
        katex.renderToString((display ?? inline).trim(), { throwOnError: true, strict: false });
        math++;
      } catch (error) {
        errors.push(`${slug}/${file}: math ${error.message}`);
      }
    }
    for (const [, url] of html.matchAll(/href="(\/[^\"]*)"/g)) {
      const [path, fragment] = url.split('#');
      if (path.startsWith('/_astro/')) continue;
      const targetPath = /\.[^/]+$/.test(path) ? `dist${path}` : `dist${path.replace(/\/$/, '')}/index.html`;
      try {
        await stat(targetPath);
        if (fragment) fail((await readFile(targetPath, 'utf8')).includes(`id="${fragment}"`), `${slug}/${file}: missing anchor ${url}`);
      } catch {
        errors.push(`${slug}/${file}: broken link ${url}`);
      }
    }
  }

  fail(parts >= 7 && parts <= 13, `${slug}: ${parts} parts`);
  fail(sections.length >= 45 && sections.length <= 60, `${slug}: ${sections.length} sections`);
  fail(sections.every((number, index) => number === index + 1), `${slug}: section numbering ${sections.join(',')}`);
  fail(new Set(diagrams).size >= 50, `${slug}: only ${new Set(diagrams).size} unique body figures`);
  const back = await readFile(`${root}/${slug}/99-interview.md`, 'utf8').catch(() => '');
  const questions = [...back.matchAll(/^\*\*Q(\d+)\./gm)].map(match => +match[1]);
  const exercises = [...back.matchAll(/^\*\*E(\d+)\*\*/gm)].map(match => +match[1]);
  const solutions = [...back.matchAll(/^\*\*E(\d+)\.\*\*/gm)].map(match => +match[1]);
  fail(questions.length >= 40, `${slug}: ${questions.length} questions`);
  fail(exercises.length >= 25, `${slug}: ${exercises.length} exercises`);
  fail(questions.every((number, index) => number === index + 1), `${slug}: question numbering`);
  fail(exercises.every((number, index) => number === index + 1) && JSON.stringify(exercises) === JSON.stringify(solutions), `${slug}: exercise/solution numbering`);
  fail(/@chapter faq|@chapter questions/.test(back) && back.includes('@chapter exercises') && back.includes('@chapter solutions'), `${slug}: back matter structure`);
  report.push({ slug, parts, sections: sections.length, bodyFigures: new Set(diagrams).size, words, bodyWords, questions: questions.length, exercises: exercises.length, formulas: math });
}

for (const id of referenced) {
  const fn = figures.get(id);
  if (!fn) continue;
  try {
    const svg = fn();
    const isCover = covers.has(id);
    if (isCover) {
      fail(/viewBox="0 0 750 975"/.test(svg), `${id}: cover canvas`);
      fail(/x="58" y="82" class="cap"/.test(svg), `${id}: cover kicker`);
    } else {
      fail(/viewBox="0 0 640 \d+"/.test(svg), `${id}: canvas`);
      fail(/x="10" y="16" class="cap"/.test(svg), `${id}: kicker`);
    }
    fail(!/NaN|undefined|Infinity/.test(svg), `${id}: invalid geometry`);
    fail((svg.match(/class="hand"/g) || []).length <= 2, `${id}: too many hand notes`);
    fail(!/[\u2013\u2014]/.test(svg), `${id}: long dash in figure`);
  } catch (error) {
    errors.push(`${id}: ${error.message}`);
  }
}

const result = { units: report, errors, warnings, checkedFigureFunctions: referenced.size };
await writeFile('scripts/fundamentals/report.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
process.exitCode = errors.length ? 1 : 0;
