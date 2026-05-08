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
      title: "等待区块数据",
      description: "先完成网格解析，系统才会生成当前 5x5 的拼搭建议。",
      highlights: [],
    };
  }

  if (strategyType === "edge-first") {
    const highlights = currentChunk.cells
      .filter((cell) => {
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
      title: "策略 B：从边缘到中心",
      description: `建议先固定外围 ${highlights.length} 颗边缘珠子，再补内部，能更快建立轮廓并减少看错位的概率。`,
      highlights,
    };
  }

  const stats = buildStats(currentChunk.cells);
  const dominant = stats[0];
  const highlights = currentChunk.cells
    .filter((cell) => cell.code === dominant?.code)
    .map((cell) => ({ x: cell.x, y: cell.y }));

  return {
    title: "策略 A：按颜色填涂",
    description: dominant
      ? `当前区块里数量最多的是 ${dominant.code}（共 ${dominant.count} 颗），可以先把这组颜色一次性铺完。`
      : "当前区块没有可用颜色统计。",
    highlights,
  };
}
