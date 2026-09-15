const greenTiles = [...document.querySelectorAll('[data-kind="green"]')];
const yellowTiles = [...document.querySelectorAll('[data-kind="yellow"]')];
const blockedInput = document.getElementById("blocked-letters");
const patternOutput = document.getElementById("pattern-output");
const yellowOutput = document.getElementById("yellow-output");
const blockedOutput = document.getElementById("blocked-output");
const clearButton = document.getElementById("clear-button");
const resultsCount = document.getElementById("results-count");
const resultsList = document.getElementById("results-list");
const bestGuessWord = document.getElementById("best-guess-word");
const bestGuessReason = document.getElementById("best-guess-reason");
const nextBestGuessButton = document.getElementById("next-best-guess-button");

let rankedGuesses = [];
let currentGuessIndex = 0;

function getClues() {
  return {
    greens: greenTiles.map((tile) => tile.value.toLowerCase() || ""),
    yellows: yellowTiles.map((tile) => cleanLetters(tile.value).toLowerCase()),
    blocked: cleanBlockedLetters(blockedInput.value).toLowerCase(),
  };
}

function matchesClues(word, clues) {
  const blockedSet = new Set(clues.blocked.split(""));
  const requiredLetters = new Set(clues.yellows.join("").split("").filter(Boolean));

  for (let index = 0; index < 5; index += 1) {
    const green = clues.greens[index];
    const yellowLetters = clues.yellows[index];

    if (green && word[index] !== green) {
      return false;
    }

    for (const yellow of yellowLetters) {
      if (word[index] === yellow) {
        return false;
      }

      if (!word.includes(yellow)) {
        return false;
      }
    }
  }

  for (const letter of blockedSet) {
    if (!requiredLetters.has(letter) && !clues.greens.includes(letter) && word.includes(letter)) {
      return false;
    }
  }

  for (const letter of requiredLetters) {
    if (!word.includes(letter)) {
      return false;
    }
  }

  return true;
}

function renderResults(matches) {
  resultsCount.textContent = `${matches.length} match${matches.length === 1 ? "" : "es"}`;
  resultsList.innerHTML = "";

  if (matches.length === 0) {
    const empty = document.createElement("p");
    empty.className = "results__empty";
    empty.textContent = "No words match those clues. Check for a yellow letter that also appears in blocked letters or a position conflict.";
    resultsList.appendChild(empty);
    return;
  }

  matches.slice(0, 150).forEach((word) => {
    const chip = document.createElement("span");
    chip.className = "word-chip";
    chip.textContent = word;
    resultsList.appendChild(chip);
  });
}

function getLetterFrequencies(matches, clues) {
  const frequencies = {};

  matches.forEach((word) => {
    const uniqueLetters = new Set(word.split(""));

    uniqueLetters.forEach((letter) => {
      if (!clues.greens.includes(letter)) {
        frequencies[letter] = (frequencies[letter] || 0) + 1;
      }
    });
  });

  return frequencies;
}

function getRankedGuesses(matches, clues) {
  if (matches.length === 0) {
    return [];
  }

  const frequencies = getLetterFrequencies(matches, clues);
  return matches
    .map((word) => {
    const uniqueLetters = new Set(word.split(""));
    let score = 0;

    uniqueLetters.forEach((letter) => {
      score += frequencies[letter] || 0;
    });

      return {
        word,
        score,
        frequencies,
      };
    })
    .sort((left, right) => right.score - left.score || left.word.localeCompare(right.word));
}

function renderBestGuess() {
  const bestGuess = rankedGuesses[currentGuessIndex];

  if (!bestGuess) {
    bestGuessWord.textContent = "No good guess";
    bestGuessReason.textContent = "There are no matching words left, so the clue set likely conflicts.";
    nextBestGuessButton.disabled = true;
    return;
  }

  const topLetters = [...new Set(bestGuess.word.split(""))]
    .sort((left, right) => (bestGuess.frequencies[right] || 0) - (bestGuess.frequencies[left] || 0))
    .slice(0, 4)
    .map((letter) => letter.toUpperCase())
    .join(", ");

  bestGuessWord.textContent = bestGuess.word.toUpperCase();
  bestGuessReason.textContent = `Choice ${currentGuessIndex + 1} of ${rankedGuesses.length}. Shared-letter score: ${bestGuess.score}. Letters such as ${topLetters} contribute based on how many matching words contain them. This is not a prediction of the answer.`;
  nextBestGuessButton.disabled = rankedGuesses.length <= 1;
}

function showNextBestGuess() {
  if (rankedGuesses.length <= 1) {
    return;
  }

  currentGuessIndex = (currentGuessIndex + 1) % rankedGuesses.length;
  renderBestGuess();
}

function cleanLetter(value) {
  const match = value.toUpperCase().match(/[A-Z]/);
  return match ? match[0] : "";
}

function cleanLetters(value) {
  const letters = value.toUpperCase().match(/[A-Z]/g) || [];
  return [...new Set(letters)].join("");
}

function cleanBlockedLetters(value) {
  const letters = value.toUpperCase().match(/[A-Z]/g) || [];
  return [...new Set(letters)].join("");
}

function updateSummary() {
  const clues = getClues();
  const pattern = greenTiles.map((tile) => tile.value || "_").join(" ");
  patternOutput.textContent = pattern;

  const yellowClues = yellowTiles
    .map((tile, index) => {
      if (!tile.value) {
        return null;
      }

      return `${tile.value} ${tile.value.length === 1 ? "is" : "are"} in the word, but not in spot ${index + 1}.`;
    })
    .filter(Boolean);

  yellowOutput.innerHTML = "";

  if (yellowClues.length === 0) {
    const item = document.createElement("li");
    item.textContent = "No yellow letters yet.";
    yellowOutput.appendChild(item);
  } else {
    yellowClues.forEach((clue) => {
      const item = document.createElement("li");
      item.textContent = clue;
      yellowOutput.appendChild(item);
    });
  }

  const blockedLetters = cleanBlockedLetters(blockedInput.value);
  blockedInput.value = blockedLetters;
  blockedOutput.textContent = blockedLetters || "None";

  const matches = WORDS.filter((word) => matchesClues(word, clues));
  renderResults(matches);
  rankedGuesses = getRankedGuesses(matches, clues);
  currentGuessIndex = 0;
  renderBestGuess();
  updateSolver(clues);
}

function handleTileInput(event) {
  const input = event.currentTarget;

  if (input.dataset.kind === "yellow") {
    input.value = cleanLetters(input.value);
  } else {
    input.value = cleanLetter(input.value);
  }

  updateSummary();
}

function clearBoard() {
  [...greenTiles, ...yellowTiles].forEach((tile) => {
    tile.value = "";
  });

  blockedInput.value = "";
  updateSummary();
  greenTiles[0].focus();
}

[...greenTiles, ...yellowTiles].forEach((tile, index, collection) => {
  tile.addEventListener("input", handleTileInput);

  tile.addEventListener("keydown", (event) => {
    if (event.key === "Backspace" && !tile.value && index > 0) {
      collection[index - 1].focus();
    }
  });

  tile.addEventListener("input", () => {
    if (tile.dataset.kind === "green" && tile.value && index < collection.length - 1) {
      collection[index + 1].focus();
    }
  });
});

blockedInput.addEventListener("input", updateSummary);
clearButton.addEventListener("click", clearBoard);
nextBestGuessButton.addEventListener("click", showNextBestGuess);

updateSummary();
