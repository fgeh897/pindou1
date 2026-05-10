const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const ownerOpenId = wxContext.OPENID;
  const now = new Date().toISOString();
  const projectId = event.projectId || "";

  const payload = {
    ownerOpenId,
    name: event.name || "未命名图纸",
    coverImageUrl: event.coverImageUrl || "",
    gridWidth: Number(event.gridWidth || 40),
    gridHeight: Number(event.gridHeight || 40),
    status: event.status || "draft",
    tags: Array.isArray(event.tags) ? event.tags : [],
    notes: event.notes || "",
    snapshot: event.snapshot || {},
    updatedAt: now,
  };

  if (projectId) {
    const current = await db.collection("projects").doc(projectId).get();
    if (current.data.ownerOpenId !== ownerOpenId) {
      throw new Error("无权修改这张图纸");
    }

    await db.collection("projects").doc(projectId).update({
      data: payload,
    });

    const next = await db.collection("projects").doc(projectId).get();
    return { project: next.data };
  }

  const created = await db.collection("projects").add({
    data: {
      ...payload,
      createdAt: now,
    },
  });

  const next = await db.collection("projects").doc(created._id).get();
  return { project: next.data };
};
