const USER_STORAGE_KEY = "pindou_current_user";

function getAppInstance() {
  return getApp();
}

function setCurrentUser(user) {
  const app = getAppInstance();
  app.globalData.user = user;
  wx.setStorageSync(USER_STORAGE_KEY, user);
}

function getCurrentUser() {
  const app = getAppInstance();
  if (app.globalData.user) {
    return app.globalData.user;
  }

  const cached = wx.getStorageSync(USER_STORAGE_KEY);
  if (cached) {
    app.globalData.user = cached;
    return cached;
  }

  return null;
}

function clearCurrentUser() {
  const app = getAppInstance();
  app.globalData.user = null;
  wx.removeStorageSync(USER_STORAGE_KEY);
}

module.exports = {
  setCurrentUser,
  getCurrentUser,
  clearCurrentUser,
};
