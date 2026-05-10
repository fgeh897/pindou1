const projectApi = require("../../utils/project");

Page({
  data: {
    projectId: "",
    project: null,
  },

  onLoad(query) {
    this.setData({ projectId: query.id || "" });
  },

  onShow() {
    if (this.data.projectId) {
      this.loadProject(this.data.projectId);
    }
  },

  async loadProject(projectId) {
    try {
      const project = await projectApi.getProject(projectId);
      this.setData({ project });
    } catch (error) {
      wx.showToast({
        title: error.message || "加载详情失败",
        icon: "none",
      });
    }
  },

  handleEdit() {
    wx.navigateTo({
      url: `/pages/editor/index?id=${this.data.projectId}`,
    });
  },
});
