async function listProjects() {
  const result = await wx.cloud.callFunction({
    name: "projectList",
  });
  return result.result?.projects || [];
}

async function getProject(projectId) {
  const result = await wx.cloud.callFunction({
    name: "projectDetail",
    data: { projectId },
  });
  return result.result?.project || null;
}

async function saveProject(payload) {
  const result = await wx.cloud.callFunction({
    name: "projectUpsert",
    data: payload,
  });
  return result.result?.project || null;
}

async function deleteProject(projectId) {
  await wx.cloud.callFunction({
    name: "projectDelete",
    data: { projectId },
  });
}

module.exports = {
  listProjects,
  getProject,
  saveProject,
  deleteProject,
};
