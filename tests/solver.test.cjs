const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { performance } = require('node:perf_hooks');
function setup() {
  const elements = new Map();
  const element = () => ({value:'', textContent:'', innerHTML:'', disabled:false, dataset:{}, addEventListener(){}, appendChild(){}, focus(){}});
  const greens = Array.from({length:5}, element);
  const yellows = Array.from({length:5}, element);
  const document = { getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); }, querySelectorAll(s) { return s.includes('green') ? greens : yellows; }, createElement:element };
  const context = vm.createContext({document, setTimeout, performance});
  for (const file of ['words.js','solver.js','app.js']) vm.runInContext(fs.readFileSync(file,'utf8'), context);
  vm.runInContext('solverVersion += 1', context);
  return {run: code => vm.runInContext(code,context), elements, greens, yellows};
}
test('feedback consumes greens first and limits duplicate yellows', () => {
  const {run} = setup();
  assert.equal(run("feedbackCode('allee', 'apple')"), 191); // 21002
  assert.equal(run("feedbackCode('aaaaa', 'cacao')"), 60); // 02020
  assert.equal(run("feedbackCode('apple', 'apple')"), 242);
  assert.equal(run("feedbackCode('zzzzz', 'apple')"), 0);
});
test('expected remainder includes solved outcomes as zero', () => {
  const {run} = setup();
  assert.equal(run("scoreGuess('cigar', ['cigar']).average"), 0);
  assert.equal(run("scoreGuess('zzzzz', ['cigar', 'rebut']).average"), 2);
  assert.equal(run("scoreGuess('cigar', ['cigar', 'rebut']).average"), 0.5);
});
test('example board, cycling, cancellation and empty state', async () => {
  const {run,elements,greens,yellows} = setup();
  greens[2].value = 'A'; yellows[3].value = 'DE'; elements.get('blocked-letters').value = 'CORNSP';
  await run('updateSolver(getClues())');
  assert.equal(run('solverAnswerCount'), 9);
  assert.equal(run("WORDS.filter(w => matchesClues(w, getClues())).join(',')"), 'adage,adawe,dealt,death,deave,djave,dwale,heald,weald');
  assert.ok(run('solverRanking[0].possible')); 
  assert.ok(run('solverRanking[0].worst') <= 3);
  assert.ok(run('solverRanking[0].average') < 2);
  run('updateSummary()');
  assert.equal(elements.get('best-guess-word').textContent, 'DWALE');
  greens.forEach(e => e.value='Z');
  await run('updateSolver(getClues())');
  await new Promise(r => setTimeout(r,160));
  assert.equal(elements.get('solver-word').textContent, 'No matching answers');
  assert.equal(elements.get('solver-next').disabled,true);
  greens.forEach((e,i) => e.value='CIGAR'[i]); yellows[3].value=''; elements.get('blocked-letters').value='';
  await run('updateSolver(getClues())');
  assert.equal(elements.get('solver-word').textContent,'CIGAR');
  assert.equal(run('solverRanking[0].average'),0);
});
