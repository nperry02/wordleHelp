# Wordle Help

A browser-based helper for filtering five-letter words using Wordle clues.

## Run

Open `index.html` in your browser. On macOS:

```sh
open index.html
```

No installation, build step, or server is required.

## Use

- Enter green letters in their exact positions.
- Enter yellow letters in the positions where they appeared. Each square accepts multiple letters.
- Enter ruled-out letters in the blocked letters field.

The matching dictionary words update as you type. Two separate recommendations help choose a guess:

- **Most Shared Letters** ranks matches by how often their unique letters occur in the remaining words, excluding known green letters.
- **Narrow Down the Answers** simulates Wordle feedback, including repeated letters, and minimizes the average number of unsolved candidates left. It shows the worst case and solve chance assuming equal word weights. A correct guess counts as zero candidates left to solve.

The second section automatically uses the full dictionary as its candidate pool. By default it recommends matching words; its dropdown also allows testing words from elsewhere in the dictionary. Calculations start after you enter clues.

## Limitations

The dictionary is not an official current Wordle answer or allowed-guess list. It may contain obscure or unaccepted words and may miss others. Reported solve chances assume all matching words are equally likely. The clue fields do not capture exact duplicate-letter counts across previous guesses. Exploring words outside the matching candidates may conflict with hard mode.

## Tests

With Node.js installed:

```sh
node --test tests/solver.test.cjs
```

The app itself does not require Node.js.
