// XORs each byte of input with a repeating

// key.

// Key (string)
export  function xorCipher(text: string, key: string) {
    const textBytes = new TextEncoder().encode(text);
    const keyBytes = new TextEncoder().encode(key);
    const resultBytes = new Uint8Array(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
        resultBytes[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    return new TextDecoder().decode(resultBytes);
}
