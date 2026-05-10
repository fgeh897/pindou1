const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const ownerOpenId = wxContext.OPENID;
  const projectId = event.projectId;

  if (!projectId) {
    throw new Error("缺少 projectId");
  }

  const result = await db.collection("projects").doc(projectId).get();
  if (!result.data || result.data.ownerOpenId !== ownerOpenId) {
    throw new Error("图纸不存在或无权限");
  }

  return {
    project: result.data,
  };
};
