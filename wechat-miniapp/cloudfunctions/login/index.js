const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const now = new Date().toISOString();
  const userInfo = event.userInfo || {};
  const userRef = db.collection("users").doc(openid);

  try {
    await userRef.get();
    await userRef.update({
      data: {
        nickName: userInfo.nickName || "",
        avatarUrl: userInfo.avatarUrl || "",
        updatedAt: now,
      },
    });
  } catch (error) {
    await userRef.set({
      data: {
        openid,
        nickName: userInfo.nickName || "",
        avatarUrl: userInfo.avatarUrl || "",
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  return {
    user: {
      openid,
      nickName: userInfo.nickName || "",
      avatarUrl: userInfo.avatarUrl || "",
    },
  };
};
