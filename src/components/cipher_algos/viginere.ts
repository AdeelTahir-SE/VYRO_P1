// Polyalphabetic substitution using a

// keyword.

// Keyword (string)
export  function vigenere(text: string, keyword: string) {
  const upperText = text.toUpperCase();
  const upperKeyword = keyword.toUpperCase();
  let result = "";
  let keywordIndex = 0;
    for (const char of upperText) {
        if (char >= "A" && char <= "Z") {
            const textCharCode = char.charCodeAt(0) - 65;
            const keywordCharCode = upperKeyword[keywordIndex % upperKeyword.length].charCodeAt(0) - 65;
            const cipherCharCode = (textCharCode + keywordCharCode) % 26 + 65;
            result += String.fromCharCode(cipherCharCode);
            keywordIndex++;
        }
        else {
            result += char;
        }
    }
    return result;
}