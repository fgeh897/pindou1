const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async () => {
  const wxContext = cloud.getWXContext();
  const ownerOpenId = wxContext.OPENID;

  const result = await db
    .collection("projects")
    .where({ ownerOpenId })
    .orderBy("updatedAt", "desc")
    .get();

  return {
    projects: result.data || [],
  };
};
