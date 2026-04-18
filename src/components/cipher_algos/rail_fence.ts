export type RailFenceMode = "encrypt" | "decrypt";

function sanitizeRails(rails: number): number {
    return Number.isFinite(rails) && rails > 1 ? Math.floor(rails) : 2;
}

export function railFence(text: string, numRails: number, mode: RailFenceMode = "encrypt"): string {
    const railCount = sanitizeRails(numRails);

    if (text.length <= 1 || railCount <= 1) {
        return text;
    }

    if (mode === "encrypt") {
        const rails: string[] = Array.from({ length: railCount }, () => "");
        let currentRail = 0;
        let directionDown = true;

        for (const char of text) {
            rails[currentRail] += char;
            if (currentRail === 0) {
                directionDown = true;
            } else if (currentRail === railCount - 1) {
                directionDown = false;
            }
            currentRail += directionDown ? 1 : -1;
        }

        return rails.join("");
    }

    const pattern: number[] = [];
    let currentRail = 0;
    let directionDown = true;

    for (let i = 0; i < text.length; i += 1) {
        pattern.push(currentRail);
        if (currentRail === 0) {
            directionDown = true;
        } else if (currentRail === railCount - 1) {
            directionDown = false;
        }
        currentRail += directionDown ? 1 : -1;
    }

    const railLengths = Array.from({ length: railCount }, () => 0);
    pattern.forEach((rail) => {
        railLengths[rail] += 1;
    });

    const rails: string[] = Array.from({ length: railCount }, () => "");
    let cursor = 0;
    for (let rail = 0; rail < railCount; rail += 1) {
        rails[rail] = text.slice(cursor, cursor + railLengths[rail]);
        cursor += railLengths[rail];
    }

    const railOffsets = Array.from({ length: railCount }, () => 0);
    return pattern
        .map((rail) => {
            const char = rails[rail][railOffsets[rail]];
            railOffsets[rail] += 1;
            return char;
        })
        .join("");
}

export default railFence;