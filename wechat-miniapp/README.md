# 微信小程序基础框架

这个目录是拼豆图纸助手的微信小程序第一版基础框架，目标先覆盖：

- 用户登录
- 用户图纸列表
- 新建/编辑/保存图纸
- 云端持久化

## 技术方案

第一版默认使用微信云开发：

- 登录：`wx.getUserProfile` + 云函数返回 `openid`
- 数据存储：云开发数据库
- 文件存储：先预留字段，后续可接入云存储

## 目录结构

```text
wechat-miniapp/
  miniprogram/
    app.js
    app.json
    app.wxss
    sitemap.json
    pages/
      auth/
      home/
      editor/
      project/
    utils/
  cloudfunctions/
    login/
    projectUpsert/
    projectList/
    projectDetail/
    projectDelete/
```

## 云开发准备

1. 用微信开发者工具打开 `wechat-miniapp/miniprogram`
2. 开通云开发并创建环境
3. 在 `miniprogram/app.js` 里把 `your-cloud-env-id` 改成你的环境 ID
4. 部署 `cloudfunctions/` 下全部云函数

## 数据库集合

### `users`

```json
{
  "_id": "openid",
  "openid": "openid",
  "nickName": "用户昵称",
  "avatarUrl": "头像地址",
  "createdAt": "2026-05-08T12:00:00.000Z",
  "updatedAt": "2026-05-08T12:00:00.000Z"
}
```

### `projects`

```json
{
  "_id": "自动生成",
  "ownerOpenId": "openid",
  "name": "我的图纸",
  "coverImageUrl": "",
  "gridWidth": 40,
  "gridHeight": 40,
  "status": "draft",
  "tags": [],
  "notes": "",
  "snapshot": {},
  "createdAt": "2026-05-08T12:00:00.000Z",
  "updatedAt": "2026-05-08T12:00:00.000Z"
}
```

## 当前能力

- 登录后自动创建/更新用户档案
- 首页拉取当前用户图纸
- 新建图纸
- 编辑图纸基础信息
- 保存到云数据库
- 查看单个图纸详情
- 删除图纸

## 下一步建议

- 接图片上传到云存储
- 接你现有网页版的图纸解析逻辑
- 增加图纸分享/协作
- 增加会员或客户权限体系
