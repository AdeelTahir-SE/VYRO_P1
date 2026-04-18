// Rearranges text by writing into rows and
// reading by column order.

// Key word (determines column
// order)

export  function columnarTransposition(text: string, key: string) {
  const numCols = key.length;
  const numRows = Math.ceil(text.length / numCols);
  const grid: string[][] = Array.from({ length: numRows }, () =>
    Array(numCols).fill("")
  );
    // Fill the grid row-wise
    for (let i = 0; i < text.length; i++) {
        const row = Math.floor(i / numCols);
        const col = i % numCols;
        grid[row][col] = text[i];
    }
    // Create an array of column indices based on the key
    const columnIndices = [...key]
        .map((char, index) => ({ char, index }))
        .sort((a, b) => a.char.localeCompare(b.char))
        .map(item => item.index);
    // Read the grid column-wise based on the sorted key
    let result = "";
    for (const colIndex of columnIndices) {
        for (let row = 0; row < numRows; row++) {
            if (grid[row][colIndex]) {
                result += grid[row][colIndex];
            }
        }
    }
    return result;
}