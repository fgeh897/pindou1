import { buildStats } from "./parser.js";

function getCurrentChunk(gridData) {
  if (!gridData?.chunks?.length) {
    return null;
  }

  return gridData.chunks[gridData.currentChunkIndex ?? 0] || gridData.chunks[0];
}

export function generateSmartPlan(gridData, strategyType) {
  const currentChunk = getCurrentChunk(gridData);
  if (!currentChunk) {
    return {
      title: "Waiting for chunk data",
      description: "Run grid analysis first, then the assistant can generate a 5x5 build guide.",
      highlights: [],
    };
  }

  if (strategyType === "edge-first") {
    const highlights = currentChunk.cells
      .filter((cell) => {
        if (cell.excluded) {
          return false;
        }
        const localX = cell.x - currentChunk.startX + 1;
        const localY = cell.y - currentChunk.startY + 1;
        return (
          localX === 1 ||
          localY === 1 ||
          localX === currentChunk.width ||
          localY === currentChunk.height
        );
      })
      .map((cell) => ({ x: cell.x, y: cell.y }));

    return {
      title: "Strategy B: edge first",
      description: `Place the ${highlights.length} edge beads first, then fill the inner cells to stabilize the outline.`,
      highlights,
    };
  }

  const stats = buildStats(currentChunk.cells);
  const dominant = stats[0];
  const highlights = currentChunk.cells
    .filter((cell) => cell.code === dominant?.code)
    .map((cell) => ({ x: cell.x, y: cell.y }));

  return {
    title: "Strategy A: dominant color fill",
    description: dominant
      ? `The most common color in this chunk is ${dominant.code} (${dominant.count} beads). Finish that color first for faster batching.`
      : "No color statistics are available for this chunk yet.",
    highlights,
  };
}
