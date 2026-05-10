const session = require("../../utils/session");
const projectApi = require("../../utils/project");

function formatTime(isoString) {
  if (!isoString) {
    return "未保存";
  }

  const date = new Date(isoString);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function showConfirmModal(title, content) {
  return new Promise((resolve, reject) => {
    wx.showModal({
      title,
      content,
      success: resolve,
      fail: reject,
    });
  });
}

Page({
  data: {
    user: {},
    projects: [],
    loading: false,
  },

  onShow() {
    const user = session.getCurrentUser();
    if (!user) {
      wx.reLaunch({
        url: "/pages/auth/index",
      });
      return;
    }

    this.setData({ user });
    this.loadProjects();
  },

  async loadProjects() {
    this.setData({ loading: true });
    try {
      const projects = await projectApi.listProjects();
      this.setData({
        projects: projects.map((item) => ({
          ...item,
          updatedAtText: formatTime(item.updatedAt),
        })),
      });
    } catch (error) {
      wx.showToast({
        title: error.message || "加载图纸失败",
        icon: "none",
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  handleCreateProject() {
    wx.navigateTo({
      url: "/pages/editor/index",
    });
  },

  handleOpenProject(event) {
    const projectId = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/project/index?id=${projectId}`,
    });
  },

  async handleDeleteProject(event) {
    const projectId = event.currentTarget.dataset.id;
    const result = await showConfirmModal("删除图纸", "确定删除这张图纸吗？");

    if (!result.confirm) {
      return;
    }

    try {
      await projectApi.deleteProject(projectId);
      wx.showToast({
        title: "已删除",
        icon: "success",
      });
      this.loadProjects();
    } catch (error) {
      wx.showToast({
        title: error.message || "删除失败",
        icon: "none",
      });
    }
  },
});
