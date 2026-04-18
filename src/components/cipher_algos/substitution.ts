// Replaces each letter using a custom

// alphabet mapping.

// Substitution alphabet (26
// chars)
export  function Substitution(text: string, alphabet: string) {
  const standardAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const upperText = text.toUpperCase();
  let result = "";
    for (const char of upperText) {
        const index = standardAlphabet.indexOf(char);
        if (index !== -1) {
            result += alphabet[index];
        } else {
            result += char;
        }
    }
    return result;
}