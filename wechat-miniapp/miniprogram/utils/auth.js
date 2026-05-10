const session = require("./session");

function requestUserProfile() {
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: "用于登录并保存你的图纸信息",
      success: resolve,
      fail: reject,
    });
  });
}

async function loginWithProfile(profile) {
  const result = await wx.cloud.callFunction({
    name: "login",
    data: {
      userInfo: {
        nickName: profile.userInfo.nickName || "",
        avatarUrl: profile.userInfo.avatarUrl || "",
      },
    },
  });

  const user = result.result?.user || null;
  if (!user) {
    throw new Error("登录结果异常");
  }

  session.setCurrentUser(user);
  return user;
}

module.exports = {
  requestUserProfile,
  loginWithProfile,
};
