App({
  globalData: {
    cloudEnvId: "your-cloud-env-id",
    user: null,
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 及以上基础库以支持云开发");
      return;
    }

    wx.cloud.init({
      env: this.globalData.cloudEnvId,
      traceUser: true,
    });
  },
});
