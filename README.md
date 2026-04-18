# 🔐 CipherStack – Cascade Encryption Builder

CipherStack is a **node-based cascade encryption tool** that allows users to visually build encryption pipelines by chaining multiple cipher algorithms together.

It demonstrates the concept of **cascade encryption**, where plaintext is transformed through multiple layers of encryption, increasing security and complexity.

---

## 🚀 Features

- 🔗 Build a pipeline of multiple cipher algorithms
- ⚙️ Configure each cipher independently
- 🔄 Reorder, add, and remove nodes dynamically
- 🔍 View intermediate outputs at each step
- 🔐 Encrypt plaintext through the pipeline
- 🔓 Decrypt ciphertext using reverse pipeline
- ✅ Guaranteed round-trip correctness (Encrypt → Decrypt = Original Text)

---

## 🧠 Supported Cipher Algorithms

| Algorithm               | Description                                                                 | Configuration |
|------------------------|-----------------------------------------------------------------------------|--------------|
| Caesar Cipher          | Shifts each letter by N positions in the alphabet                          | Shift (int)  |
| XOR Cipher             | XORs each byte with a repeating key                                        | Key (string) |
| Vigenère Cipher        | Polyalphabetic substitution using a keyword                                | Keyword      |
| Rail Fence Cipher      | Zigzag transposition across N rails                                         | Rails (int)  |
| Substitution Cipher    | Custom alphabet mapping                                                     | 26-char map  |
| Columnar Transposition | Rearranges text using column order defined by keyword                      | Keyword      |

---

## 🔁 How It Works

### Encryption Flow
1. Input plaintext enters the first node  
2. Each node processes the output of the previous node  
3. Final node produces the ciphertext  

### Decryption Flow
1. Ciphertext enters the last node  
2. Pipeline runs in reverse order  
3. Each cipher applies its inverse operation  
4. Final output = original plaintext  

---

## 🧪 Example

### Pipeline:

Caesar (shift 3) → XOR (key: abc) → Vigenère (key: secret)


### Encryption:

hello → khoor → (xor output) → (final ciphertext)


### Decryption:

(final ciphertext) → (xor output) → khoor → hello