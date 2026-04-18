// Transposition cipher that writes text in a

// zigzag across N rails.

// Number of rails (integer)

export  function railFence(text: string, numRails: number) {
  if (numRails <= 1) return text;
  const rails: string[] = Array.from({ length: numRails }, () => "");
  let currentRail = 0;
  let directionDown = true;
    for (const char of text) {
        rails[currentRail] += char;
        if (currentRail === 0) {
            directionDown = true;
        } else if (currentRail === numRails - 1) {
            directionDown = false;
        }
        currentRail += directionDown ? 1 : -1;
    }
    return rails.join("");
}