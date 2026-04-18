export type XorMode = "encrypt" | "decrypt";

function normalizeKey(key: string): Uint8Array {
    const safeKey = key.length > 0 ? key : "0";
    return new TextEncoder().encode(safeKey);
}

export function xorCipher(text: string, key: string, _mode: XorMode = "encrypt"): string {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const textBytes = encoder.encode(text);
    const keyBytes = normalizeKey(key);
    const resultBytes = new Uint8Array(textBytes.length);

    for (let i = 0; i < textBytes.length; i += 1) {
        resultBytes[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    return decoder.decode(resultBytes);
}

export default xorCipher;
