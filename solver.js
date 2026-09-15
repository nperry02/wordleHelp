// Green tiles consume letters before yellow tiles, including duplicate letters.
function feedbackCode(guess, answer) {
  const remaining = {};
  const colors = [0, 0, 0, 0, 0];
  for (let i = 0; i < 5; i += 1) {
    if (guess[i] === answer[i]) colors[i] = 2;
    else remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < 5; i += 1) {
    if (colors[i] !== 2 && remaining[guess[i]] > 0) {
      colors[i] = 1;
      remaining[guess[i]] -= 1;
    }
  }
  return colors.reduce((code, color) => code * 3 + color, 0);
}

function scoreGuess(guess, answers) {
  const groups = new Uint16Array(243);
  for (const answer of answers) groups[feedbackCode(guess, answer)] += 1;
  // An all-green result finishes the puzzle, leaving zero unsolved answers.
  groups[242] = 0;
  let total = 0;
  let worst = 0;
  for (const count of groups) {
    total += count * count;
    worst = Math.max(worst, count);
  }
  return { word: guess, average: total / answers.length, worst,
    possible: answers.includes(guess) };
}

const solverMode = document.getElementById('solver-mode');
const solverWord = document.getElementById('solver-word');
const solverReason = document.getElementById('solver-reason');
const solverMetrics = document.getElementById('solver-metrics');
const solverNext = document.getElementById('solver-next');
let solverVersion = 0;
let solverRanking = [];
let solverIndex = 0;
let solverAnswerCount = 0;

function renderSolver() {
  const guess = solverRanking[solverIndex];
  if (!guess) return;
  solverWord.textContent = guess.word.toUpperCase();
  solverReason.textContent = `Choice ${solverIndex + 1} of ${solverRanking.length}. ${guess.possible ? 'This could be the answer.' : 'This tests letters; it cannot be the answer with these clues.'}`;
  solverMetrics.textContent = `Average left: ${guess.average.toFixed(2)} · Worst case: ${guess.worst} · Solve chance (equal word weights): ${guess.possible ? (100 / solverAnswerCount).toFixed(1) : '0'}%. A correct guess counts as zero answers left to solve.`;
  solverNext.disabled = solverRanking.length <= 1;
}

async function updateSolver(clues) {
  const version = ++solverVersion;
  solverRanking = [];
  solverIndex = 0;
  solverNext.disabled = true;
  solverMetrics.textContent = '';
  const answers = WORDS.filter(word => matchesClues(word, clues));
  solverAnswerCount = answers.length;
  document.getElementById('solver-count').textContent = `${answers.length} remaining answer${answers.length === 1 ? '' : 's'}`;
  document.getElementById('solver-answers').textContent = answers.length ? answers.join(', ').toUpperCase() : 'None';
  if (!answers.length) {
    solverWord.textContent = 'No matching answers';
    solverReason.textContent = 'No dictionary words match. Check your clues; this dictionary may also be missing the word.';
    return;
  }
  if (!clues.greens.some(Boolean) && !clues.yellows.some(Boolean) && !clues.blocked) {
    solverWord.textContent = 'Start typing clues';
    solverReason.textContent = 'Add your Wordle clues to compare guesses against every matching word in the full dictionary.';
    return;
  }
  solverWord.textContent = 'Calculating…';
  solverReason.textContent = 'Comparing the possible color results for each guess.';
  // Yield regularly so typing stays responsive and newer clues cancel old work.
  await new Promise(resolve => setTimeout(resolve, 120));
  if (version !== solverVersion) return;
  const guesses = solverMode.value === 'explore' && answers.length > 1 ? WORDS : answers;
  const ranking = [];
  let sliceStart = performance.now();
  for (const guess of guesses) {
    ranking.push(scoreGuess(guess, answers));
    if (performance.now() - sliceStart > 12) {
      await new Promise(resolve => setTimeout(resolve, 0));
      if (version !== solverVersion) return;
      sliceStart = performance.now();
    }
  }
  ranking.sort((a, b) => a.average - b.average || a.worst - b.worst || Number(b.possible) - Number(a.possible) || a.word.localeCompare(b.word));
  solverRanking = ranking;
  renderSolver();
}

solverMode.addEventListener('change', () => updateSolver(getClues()));
solverNext.addEventListener('click', () => {
  if (!solverRanking.length) return;
  solverIndex = (solverIndex + 1) % solverRanking.length;
  renderSolver();
});
