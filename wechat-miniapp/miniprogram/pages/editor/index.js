const projectApi = require("../../utils/project");

const STATUS_OPTIONS = [
  { label: "草稿", value: "draft" },
  { label: "进行中", value: "active" },
  { label: "已完成", value: "done" },
];

Page({
  data: {
    projectId: "",
    saving: false,
    statusOptions: STATUS_OPTIONS,
    statusIndex: 0,
    form: {
      name: "",
      gridWidth: 40,
      gridHeight: 40,
      status: "draft",
      notes: "",
      coverImageUrl: "",
      snapshot: {},
    },
  },

  onLoad(query) {
    if (query.id) {
      this.setData({ projectId: query.id });
      this.loadProject(query.id);
    }
  },

  async loadProject(projectId) {
    try {
      const project = await projectApi.getProject(projectId);
      if (!project) {
        wx.showToast({
          title: "图纸不存在",
          icon: "none",
        });
        return;
      }

      const statusIndex = STATUS_OPTIONS.findIndex((item) => item.value === project.status);
      this.setData({
        statusIndex: statusIndex >= 0 ? statusIndex : 0,
        form: {
          name: project.name || "",
          gridWidth: project.gridWidth || 40,
          gridHeight: project.gridHeight || 40,
          status: project.status || "draft",
          notes: project.notes || "",
          coverImageUrl: project.coverImageUrl || "",
          snapshot: project.snapshot || {},
        },
      });
    } catch (error) {
      wx.showToast({
        title: error.message || "加载图纸失败",
        icon: "none",
      });
    }
  },

  handleInput(event) {
    const field = event.currentTarget.dataset.field;
    const value = event.detail.value;
    this.setData({
      [`form.${field}`]: field === "gridWidth" || field === "gridHeight" ? Number(value || 0) : value,
    });
  },

  handleStatusChange(event) {
    const statusIndex = Number(event.detail.value);
    this.setData({
      statusIndex,
      "form.status": STATUS_OPTIONS[statusIndex].value,
    });
  },

  async handleSave() {
    if (!this.data.form.name.trim()) {
      wx.showToast({
        title: "请先填写图纸名称",
        icon: "none",
      });
      return;
    }

    this.setData({ saving: true });
    try {
      const project = await projectApi.saveProject({
        projectId: this.data.projectId || "",
        ...this.data.form,
      });

      wx.showToast({
        title: "保存成功",
        icon: "success",
      });

      wx.redirectTo({
        url: `/pages/project/index?id=${project._id}`,
      });
    } catch (error) {
      wx.showToast({
        title: error.message || "保存失败",
        icon: "none",
      });
    } finally {
      this.setData({ saving: false });
    }
  },
});
