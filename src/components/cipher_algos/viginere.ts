export type VigenereMode = "encrypt" | "decrypt";

const ALPHABET_SIZE = 26;

function isAlphabet(charCode: number): boolean {
    return (charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122);
}

function getShiftFromKeyChar(keyChar: string): number {
    return keyChar.toUpperCase().charCodeAt(0) - 65;
}

export function vigenereCipher(text: string, keyword: string, mode: VigenereMode = "encrypt"): string {
    const cleanedKey = [...keyword.toUpperCase()].filter((char) => char >= "A" && char <= "Z").join("");

    if (!cleanedKey) {
        return text;
    }

    let keywordIndex = 0;

    return [...text]
        .map((char) => {
            const code = char.charCodeAt(0);

            if (!isAlphabet(code)) {
                return char;
            }

            const isUpper = code >= 65 && code <= 90;
            const base = isUpper ? 65 : 97;
            const keyShift = getShiftFromKeyChar(cleanedKey[keywordIndex % cleanedKey.length]);
            const directionShift = mode === "encrypt" ? keyShift : -keyShift;
            const normalizedShift = ((directionShift % ALPHABET_SIZE) + ALPHABET_SIZE) % ALPHABET_SIZE;

            keywordIndex += 1;

            return String.fromCharCode(((code - base + normalizedShift) % ALPHABET_SIZE) + base);
        })
        .join("");
}

export default vigenereCipher;