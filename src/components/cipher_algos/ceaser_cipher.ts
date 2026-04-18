export type CaesarMode = "encrypt" | "decrypt";

const ALPHABET_SIZE = 26;

function shiftChar(char: string, shift: number): string {
  const code = char.charCodeAt(0);
  const isUpper = code >= 65 && code <= 90;
  const isLower = code >= 97 && code <= 122;

  if (!isUpper && !isLower) {
    return char;
  }

  const base = isUpper ? 65 : 97;
  const normalizedShift = ((shift % ALPHABET_SIZE) + ALPHABET_SIZE) % ALPHABET_SIZE;
  const nextCode = ((code - base + normalizedShift) % ALPHABET_SIZE) + base;
  return String.fromCharCode(nextCode);
}

export function caesarCipher(text: string, shift: number, mode: CaesarMode = "encrypt"): string {
  const direction = mode === "encrypt" ? shift : -shift;
  return [...text].map((char) => shiftChar(char, direction)).join("");
}

export default caesarCipher;