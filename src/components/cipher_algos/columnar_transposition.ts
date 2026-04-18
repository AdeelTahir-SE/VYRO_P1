export type ColumnarMode = "encrypt" | "decrypt";

function buildOrder(keyword: string): number[] {
    return [...keyword]
        .map((char, index) => ({ char: char.toUpperCase(), index }))
        .sort((left, right) => {
            if (left.char === right.char) {
                return left.index - right.index;
            }

            return left.char.localeCompare(right.char);
        })
        .map((item) => item.index);
}

export function columnarTransposition(text: string, key: string, mode: ColumnarMode = "encrypt"): string {
    const cleanedKey = key.replace(/\s+/g, "").toUpperCase();

    if (cleanedKey.length < 2) {
        return text;
    }

    const columnCount = cleanedKey.length;
    const order = buildOrder(cleanedKey);

    if (mode === "encrypt") {
        const rowCount = Math.ceil(text.length / columnCount);
        const grid: string[][] = Array.from({ length: rowCount }, () => Array.from({ length: columnCount }, () => ""));

        [...text].forEach((char, index) => {
            grid[Math.floor(index / columnCount)][index % columnCount] = char;
        });

        return order
            .map((columnIndex) => grid.map((row) => row[columnIndex]).join(""))
            .join("");
    }

    const rowCount = Math.ceil(text.length / columnCount);
    const baseLength = Math.floor(text.length / columnCount);
    const remainder = text.length % columnCount;
    const columnLengths = Array.from({ length: columnCount }, (_, index) => baseLength + (index < remainder ? 1 : 0));
    const columns = Array.from({ length: columnCount }, () => "");

    let cursor = 0;
    order.forEach((columnIndex) => {
        const length = columnLengths[columnIndex];
        columns[columnIndex] = text.slice(cursor, cursor + length);
        cursor += length;
    });

    const output: string[] = [];
    for (let row = 0; row < rowCount; row += 1) {
        for (let column = 0; column < columnCount; column += 1) {
            const char = columns[column][row];
            if (char) {
                output.push(char);
            }
        }
    }

    return output.join("");
}

export default columnarTransposition;