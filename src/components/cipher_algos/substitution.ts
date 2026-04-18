export type SubstitutionMode = "encrypt" | "decrypt";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function normalizeSubstitutionKey(key: string): string | null {
    const cleaned = key.toUpperCase().replace(/[^A-Z]/g, "");
    const uniqueChars = [...new Set(cleaned)].join("");

    if (uniqueChars.length !== 26) {
        return null;
    }

    return uniqueChars;
}

function buildMap(from: string, to: string): Map<string, string> {
    const map = new Map<string, string>();
    for (let i = 0; i < from.length; i += 1) {
        map.set(from[i], to[i]);
    }
    return map;
}

export function substitutionCipher(text: string, key: string, mode: SubstitutionMode = "encrypt"): string {
    const normalizedKey = normalizeSubstitutionKey(key);

    if (!normalizedKey) {
        return text;
    }

    const forward = buildMap(ALPHABET, normalizedKey);
    const reverse = buildMap(normalizedKey, ALPHABET);
    const map = mode === "encrypt" ? forward : reverse;

    return [...text]
        .map((char) => {
            const upper = char.toUpperCase();
            const mapped = map.get(upper);

            if (!mapped) {
                return char;
            }

            return char === upper ? mapped : mapped.toLowerCase();
        })
        .join("");
}

export default substitutionCipher;