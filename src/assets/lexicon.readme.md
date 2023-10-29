# Lexicon files description

Lexicon files are a list of valid words in Scrabble for a given language. They are used to check if a word is valid or not. They also contain the word's definition.

## Format

Lexicon files are plain text files where each line represents a word with 3 fields:

1. The word itself, normalized for Scrabble.
2. The word's definition.
3. The root word, if any. It is used to find the defiinition of a derivate word.

The fields are separated by a tab (`	`) character.

## Example

```txt
...
PUZLE	m. rompecabezas (|| juego).
PUZLES		PUZLE
...
```

## Sources

### Spanish (`es.lexicon`)

- List of valid words: [fisescrabble.org](https://viejo.fisescrabble.org/L.rar)
- Definitions: **RAE dictionary, 15th edition epub**

### English (`en.lexicon`)

- List of valid words with definitions: **Collins Scrabble Words (2019). 279,496 words with definitions.**
