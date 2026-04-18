# 🔐 VYRO – Visual Cipher Pipeline Builder

VYRO is an **interactive node-based cascade encryption tool** that allows users to visually build and execute encryption pipelines by chaining multiple cipher algorithms together on an intuitive canvas.

It demonstrates the concept of **cascade encryption**, where plaintext is transformed through multiple layers of encryption, increasing security and complexity. All parameters can be edited directly on canvas nodes, and pipeline results are displayed in real-time.

---

## 🚀 Features

- 🎨 **Interactive Canvas**: Drag-and-drop nodes, pan, and zoom
- 🔗 **Build Pipelines**: Chain multiple cipher algorithms in sequence
- ⚙️ **Direct Editing**: Double-click nodes to edit parameters in-place
- 🔄 **Toggle Mode**: Switch between Encrypt and Decrypt for all nodes at once
- 🏷️ **Pipeline Numbering**: Each node displays its pipeline number
- 🔍 **Real-time Results**: See intermediate and final outputs on canvas nodes
- 🎯 **Linear Chain**: Ensures single input/output flow per node
- ⌨️ **Keyboard Controls**: Press Delete to remove selected nodes
- 🔐 **Encrypt Pipeline**: Process plaintext through multiple ciphers
- 🔓 **Decrypt Pipeline**: Reverse the process to recover original text
- ✅ **Round-trip Correctness**: Encrypt → Decrypt = Original Text

---

## 📋 Getting Started

### Installation

```bash
# Navigate to project directory
cd my-app

# Install dependencies
npm install

# Run development server
npm run dev
```

The application will open at `http://localhost:3000`

---

## 🧠 Supported Cipher Algorithms

| Algorithm                | Description                                          | Configuration | Example |
|--------------------------|------------------------------------------------------|----------------|---------|
| **Caesar Cipher**         | Shifts letters by N positions                        | Shift (0-25)   | Shift: 3 |
| **XOR Cipher**            | XORs bytes with repeating key                        | Key (string)   | Key: SECRET |
| **Vigenère Cipher**        | Polyalphabetic substitution using keyword            | Keyword        | Key: PASSWORD |
| **Rail Fence Cipher**     | Zigzag transposition across N rails                  | Rails (2-26)   | Rails: 3 |
| **Substitution Cipher**   | Custom 26-character alphabet mapping                | Alphabet       | QWERTY... |
| **Columnar Transposition**| Reorders columns by keyword order                    | Keyword        | Key: CIPHER |

---

## 📖 User Manual

### 🎯 Left Sidebar (Controls)

The left sidebar contains all pipeline controls and settings:

#### 1. **Mode Toggle Button** (🔒 Encrypt / 🔓 Decrypt)
- **Purpose**: Set the mode for all nodes in the pipeline
- **Click**: Click the button to toggle between Encrypt and Decrypt
- **Color**: Amber (🔒 Encrypt) or Orange (🔓 Decrypt)
- **Effect**: All nodes automatically switch their mode when toggled

#### 2. **Source Text Input**
- **Purpose**: Enter the text you want to process
- **How to use**: Type or paste your text in the textarea
- **Max size**: No limit (though very long text may affect performance)
- **Default**: "HELLO WORLD"
- **Note**: Changing source text clears previous results

#### 3. **Run Button** (Top right of Source section)
- **Color States**:
  - **Orange**: Ready to run
  - **Amber with loading**: Currently running
  - **Green (✓ Done)**: Successfully completed
  - **Red (✗ Error)**: An error occurred
- **Click**: Click to execute the pipeline with current source text
- **Wait time**: Results display after 300ms (simulated async)

#### 4. **Algorithm Library**
- **Purpose**: Add new cipher nodes to your pipeline
- **Methods**:
  - **Click**: Click any algorithm button to add it to the end of pipeline
  - **Drag**: Drag any algorithm button onto the canvas to add at specific position
- **Position**: New nodes stack horizontally by default

---

### 🎨 Canvas Area (Central)

The canvas is where you build and visualize your encryption pipeline.

#### Adding Nodes
1. **Click method**: Click an algorithm in the sidebar → node appears at end of chain
2. **Drag method**: Drag algorithm from sidebar onto canvas → place at desired location
3. **Result**: Node appears with default parameters

#### Node Display

Each node shows:
- **Algorithm Name** (top-left): e.g., "Caesar", "Vigenere"
- **Mode Badge** (top-left): "Encrypt" or "Decrypt"
- **Pipeline Number** (top-right): Displays #1, #2, #3, etc.
- **Summary** (middle): e.g., "Encrypt with shift 3"
- **Result Box** (bottom): Shows output after running
- **Double-click hint**: "Double-click to edit" (italic gray text)

#### Editing Node Parameters
1. **Double-click** a node on the canvas
2. Node background turns **blue** indicating edit mode
3. Edit fields appear:
   - **Caesar**: Shift input field
   - **Vigenère/XOR/Columnar**: Key input field
   - **Rail Fence**: Rails input field
   - **Substitution**: Alphabet (26 characters) input field
4. **Save changes**: Click "Save" button or press **Enter**
5. **Cancel changes**: Click "Cancel" button or press **Escape**
6. Node's summary automatically updates after save

#### Connecting Nodes
1. **Hover** over the right edge (green dot) of a node
2. **Drag** to the left edge (green dot) of another node
3. **Release** to create connection
4. **Linear chain**: Only one connection per node is allowed
   - Connecting to a new target removes the old connection
5. **Connection style**: Orange animated arrows show data flow direction

#### Moving Nodes
- **Drag** any node to reposition it on the canvas
- Nodes snap to grid (24px) for clean alignment

#### Deleting Nodes
- **Select** a node by clicking it
- **Press Delete** key on keyboard, or
- **Click** the node and press the **Delete** button (if visible in sidebar)
- Node and all its connections are removed

#### Viewing Results
1. **Run the pipeline** by clicking the Run button
2. Each node displays a result box showing:
   - **Output type**: "Intermediate result:" or "Final result:"
   - **Output preview**: First 40 characters (truncated with "..." if longer)
3. **Color coding**:
   - Nodes with results show **amber** result box
   - Final (terminal) nodes explicitly show "Final result:"

#### Canvas Controls
- **Pan**: Click and drag empty canvas area
- **Zoom**: Use mouse wheel to zoom in/out
- **Fit View**: Double-click empty area to fit all nodes
- **MiniMap**: Bottom-right corner shows minimap of full pipeline
- **Color Legend**: Each algorithm has a unique color in minimap

---

## 🔄 Pipeline Execution Flow

### Encryption (Forward Mode 🔒)

```
Source Text
    ↓
[Node 1: Encrypt] → Output A
    ↓
[Node 2: Encrypt] → Output B
    ↓
[Node 3: Encrypt] → Final Ciphertext
```

**Order**: Executes nodes in sequence from left to right

### Decryption (Reverse Mode 🔓)

```
Ciphertext (Input Source)
    ↓
[Node 1: Decrypt] → Partially decrypted
    ↓
[Node 2: Decrypt] → More decrypted
    ↓
[Node 3: Decrypt] → Original Text
```

**Order**: Same left-to-right order, but each node reverses its operation

---

## 💡 Usage Examples

### Example 1: Simple Caesar Encryption

1. **Create Pipeline**: Canvas starts with Caesar + Vigenère nodes
2. **Set Mode**: Ensure toggle shows 🔒 **Encrypt**
3. **Configure Caesar Node**: Double-click first node
   - Set Shift: `5`
   - Click Save
4. **Enter Text**: Type "HELLO" in Source Text
5. **Run**: Click Run button
6. **Result**: "MJQQT" appears in first node's result box

### Example 2: Triple Encryption

1. **Add Nodes**:
   - Start: Caesar (default)
   - Add: Click "Vigenere" → appears as second node
   - Add: Click "XOR" → appears as third node

2. **Configure Each Node**:
   - Caesar: Double-click → Set Shift to 3 → Save
   - Vigenère: Double-click → Set Key to "SECRET" → Save
   - XOR: Double-click → Set Key to "abc123" → Save

3. **Enter Source**: "ENCRYPTION"

4. **Run Encryption**: Click Run
   - Caesar output appears in Node 1
   - Vigenère output appears in Node 2
   - XOR final output appears in Node 3

5. **Switch to Decrypt**: Click 🔓 **Decrypt** toggle
   - All nodes change to Decrypt mode

6. **Run Decryption**: Copy the final ciphertext into Source Text
   - Click Run
   - Final result should be "ENCRYPTION" again ✅

### Example 3: Edit Parameters Without Recreating

1. **Build a 2-node pipeline**: Caesar → Vigenère

2. **Run with defaults**: "HELLO" → encrypted output

3. **Change Caesar shift**: 
   - Double-click Caesar node
   - Change Shift from 3 to 7
   - Click Save
   - Summary updates to "Encrypt with shift 7"

4. **Run again**: Same source text processes with new shift value

---

## ⌨️ Keyboard Shortcuts

| Key/Action | Effect |
|-----------|--------|
| **Double-click** node | Enter edit mode |
| **Enter** (in edit mode) | Save changes |
| **Escape** (in edit mode) | Cancel changes |
| **Delete** (with node selected) | Delete the node |
| **Click on canvas** | Deselect current node |
| **Drag node** | Move position |

---

## 🎯 Pro Tips

1. **Pipeline Strategy**: Place fast ciphers first (Caesar) and slower ones last (Columnar) for better performance feedback

2. **Testing**: Use short test strings like "ABC" or "TEST" first to verify pipeline behavior before processing large texts

3. **Intermediate Results**: Hover over node result boxes to see full output if truncated

4. **Undo Strategy**: There's no undo, so note your configurations before major changes

5. **Round-trip Verification**: Always test Encrypt→Decrypt on sample text to ensure your pipeline configuration is correct

6. **Long Pipelines**: Pipelines with 5+ nodes work well; beyond 10 nodes, performance may degrade slightly

---

## 🔍 Troubleshooting

### Issue: Node not showing result after running

**Solution**: 
- Ensure at least one node is in the pipeline
- Check that source text is not empty
- Try clicking Run again

### Issue: Can't connect nodes

**Solution**:
- Each node can only have ONE input and ONE output
- Disconnecting happens automatically when connecting to a new node
- Only connect the right edge of a node to the left edge of another

### Issue: Text appears corrupted after decryption

**Solution**:
- Ensure all nodes are in **Decrypt** mode (🔓 button shows Decrypt)
- Verify the ciphertext you're decrypting matches the original encryption output
- Non-alphanumeric characters may behave differently in some ciphers

### Issue: Mode toggle didn't change node modes

**Solution**:
- The toggle updates all existing nodes instantly
- If nodes still show old mode, refresh the page
- Ensure nodes are on the canvas (not just in the algorithm library)

---

## 🚀 Performance Notes

- **Typical Pipeline**: Up to 10 nodes with text < 1000 characters processes instantly
- **Large Text**: 10,000+ character texts may take 1-2 seconds with complex ciphers
- **Canvas**: 50+ nodes may cause slight UI lag; consider breaking into separate pipelines

---

## 📚 Algorithm Deep Dive

### Caesar Cipher
- **Shift**: 0-25 (0 = no change, 1 = A→B, 25 = Z→A)
- **Best for**: Learning, demonstrating single-shift encryption
- **Security**: Very weak (only 26 possibilities)

### Vigenère Cipher
- **Key**: Any text string (spaces ignored)
- **Repeats**: Key repeats across the message
- **Security**: Weak by modern standards but stronger than Caesar
- **Example**: Key "CAT" with "HELLO" → C applies to H, A to E, T to L, C to L, A to O

### Rail Fence Cipher
- **Rails**: 2-26 (more rails = more complex pattern)
- **Mechanism**: Text written in zigzag across N rails, then read row-by-row
- **Rail 2**: Simple, pairs of characters swap positions
- **Rail 3+**: Increasingly complex transposition patterns
- **Best for**: Understanding transposition ciphers

### XOR Cipher
- **Key**: Any text (repeats across message)
- **Operation**: Each byte XORed with corresponding key byte
- **Speed**: Very fast, good for learning binary operations
- **Security**: Depends entirely on key length and randomness

### Substitution Cipher
- **Alphabet**: Exactly 26 unique characters (A-Z mapping)
- **Standard order**: ABCDEFGHIJKLMNOPQRSTUVWXYZ
- **Custom**: QWERTYUIOPASDFGHJKLZXCVBNM (QWERTY keyboard layout)
- **Security**: Weak (frequency analysis attacks)

### Columnar Transposition
- **Keyword**: Text that determines column order
- **Process**: Text arranged in grid, columns reordered by keyword alphabetical order
- **Example**: Key "ZEBRA" → Columns ordered as Z,E,B,R,A positions
- **Security**: Moderate, better against casual analysis than substitution

---

## 🔐 Security Disclaimer

⚠️ **WARNING**: This tool is for **educational purposes only**. 

The ciphers implemented here are cryptographically weak and **NOT suitable** for protecting real sensitive data:
- Caesar, Substitution, Vigenère: Broken by frequency analysis
- Rail Fence, Columnar: Vulnerable to known-plaintext attacks
- XOR alone: Vulnerable to key recovery with sufficient ciphertext

**For real security**, use modern cryptographic libraries (AES-256, RSA, etc.)

---

## 📝 License

This project is provided as-is for educational purposes.