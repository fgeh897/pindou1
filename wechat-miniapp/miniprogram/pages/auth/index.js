const auth = require("../../utils/auth");
const session = require("../../utils/session");

Page({
  data: {
    loading: false,
  },

  onShow() {
    const user = session.getCurrentUser();
    if (user) {
      wx.reLaunch({
        url: "/pages/home/index",
      });
    }
  },

  async handleLogin() {
    this.setData({ loading: true });

    try {
      const profile = await auth.requestUserProfile();
      await auth.loginWithProfile(profile);
      wx.reLaunch({
        url: "/pages/home/index",
      });
    } catch (error) {
      wx.showToast({
        title: error.message || "登录失败",
        icon: "none",
      });
    } finally {
      this.setData({ loading: false });
    }
  },
});
