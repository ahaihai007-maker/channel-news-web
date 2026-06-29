import request from './request.js'

// 用户相关接口
export const userApi = {
  login: (data) => request.post('/user/login', data),
  register: (data) => request.post('/user/register', data),
  getCurrentUser: () => request.get('/user/me'),
  updateProfile: (data) => request.put('/user/profile', data)
}

// 发布文章相关接口 (公开)
export const getPublishedArticles = (params) => request.get('/publish/list', { params })
export const getPublishedArticleDetail = (id) => request.get(`/publish/${id}`)
export const searchArticles = (params) => request.get('/publish/search', { params })

// 我的文章相关接口
export const getMyArticles = (params) => request.get('/article/my', { params })
export const createArticle = (data) => request.post('/article/submit', data)
export const getArticleDetail = (id) => request.get(`/article/${id}`)
export const updateArticle = (id, data) => request.put(`/article/${id}`, data)
export const deleteArticle = (id) => request.delete(`/article/${id}`)
export const submitArticle = (id) => request.post(`/article/${id}/submit`)

// 审核相关接口
export const getPendingReviews = (params) => request.get('/review/pending', { params })
export const getReviewHistory = (params) => request.get('/review/history', { params })
export const getReviewDetail = (id) => request.get(`/review/${id}`)  // 管理员查看待审核文章详情
export const approveArticle = (id) => request.post(`/review/${id}/approve`)
export const rejectArticle = (id, reason) => request.post(`/review/${id}/reject`, { articleId: id, result: 'REJECTED', comment: reason })

// 管理员文章管理接口
export const getAllArticles = (params) => request.get('/admin/articles', { params })
export const getApprovedArticles = (params) => request.get('/admin/articles/approved', { params })
export const getPublishingArticles = (params) => request.get('/admin/articles/publishing', { params })
export const publishArticle = (id, data = {}) => request.post(`/admin/article/${id}/publish`, data)

// 文件上传投稿接口（支持两种认证方式）
// 方式1：普通用户使用JWT（已登录）- 调用 /api/article/submit-with-files
// 方式2：机器人使用X-Bot-Token - 调用 /api/bot/article/submit
// botToken参数：如果是true，使用默认token；如果是string，使用自定义token
export const submitArticleWithFiles = (data, files, botToken = false) => {
  const formData = new FormData()
  formData.append('title', data.title)
  formData.append('content', data.content)
  if (data.summary) formData.append('summary', data.summary)
  if (data.articleType) formData.append('articleType', data.articleType)
  
  // 添加文件
  if (files && files.length > 0) {
    files.forEach(file => {
      formData.append('files', file)
    })
  }
  
  const headers = {
    'Content-Type': 'multipart/form-data'
  }
  
  // 判断使用哪种认证方式
  if (botToken === true) {
    // 机器人使用默认token
    headers['X-Bot-Token'] = 'bot-secure-token-2026-change-this-in-production'
    formData.append('authorUsername', data.authorUsername)
    if (data.authorEmail) formData.append('authorEmail', data.authorEmail)
    return request.post('/bot/article/submit', formData, { headers })
  } else if (typeof botToken === 'string' && botToken) {
    // 机器人使用自定义token
    headers['X-Bot-Token'] = botToken
    formData.append('authorUsername', data.authorUsername)
    if (data.authorEmail) formData.append('authorEmail', data.authorEmail)
    return request.post('/bot/article/submit', formData, { headers })
  } else {
    // 普通用户使用JWT（已在请求拦截器中自动添加）
    return request.post('/article/submit-with-files', formData, { headers })
  }
}

// 评论相关接口
export const commentApi = {
  getByArticle: (articleId) => request.get(`/comment/article/${articleId}`),
  create: (data) => request.post('/comment', data),
  delete: (id) => request.delete(`/comment/${id}`)
}

// 系统配置接口
export const configApi = {
  getAll: () => request.get('/admin/config'),
  saveAll: (data) => request.post('/admin/config', data)
}

// AI润色接口
export const polishArticle = (id) => request.post(`/review/${id}/polish`)

// 更新文章接口（审核）
export const updateReviewArticle = (id, data) => request.put(`/review/${id}/update`, data)

// ========== 消息模板管理接口 ==========
export const messageTemplateApi = {
  // 获取模板列表
  getList: (params) => request.get('/admin/message-templates', { params }),
  
  // 创建模板
  create: (data) => request.post('/admin/message-templates', data),
  
  // 更新模板
  update: (id, data) => request.put(`/admin/message-templates/${id}`, data),
  
  // 删除模板
  delete: (id) => request.delete(`/admin/message-templates/${id}`),
  
  // 设置默认模板
  setDefault: (id) => request.post(`/admin/message-templates/${id}/set-default`)
}

// ========== Emoji配置管理接口 ==========
export const emojiConfigApi = {
  // 获取配置列表
  getList: () => request.get('/admin/emoji-config'),
  
  // 更新配置
  update: (id, data) => request.put(`/admin/emoji-config/${id}`, data)
}

// ========== 批量操作接口 ==========
export const batchApi = {
  // 批量审核通过
  approve: (articleIds) => request.post('/admin/batch/approve', { articleIds }),
  
  // 批量拒绝
  reject: (articleIds, reason) => request.post('/admin/batch/reject', { articleIds, reason }),
  
  // 批量发布
  publish: (articleIds, useTemplate, templateId, useEmoji, regionTag, typeTag) => 
    request.post('/admin/batch/publish', { articleIds, useTemplate, templateId, useEmoji, regionTag, typeTag }),
  
  // 批量删除
  delete: (articleIds) => request.post('/admin/batch/delete', { articleIds })
}

// ========== 标签管理接口 ==========
export const tagApi = {
  // 获取地区标签
  getRegions: () => request.get('/admin/tags/regions'),
  
  // 获取类型标签
  getTypes: () => request.get('/admin/tags/types')
}

// ========== 消息预览接口 ==========
export const previewApi = {
  // 生成 L1-L6 层级预览
  getPreview: (articleId, data) => request.post(`/admin/article/${articleId}/preview`, data)
}

// ========== 频道监控接口 ==========
export const channelMonitorApi = {
  getConfig: () => request.get('/admin/config'),
  saveChannels: (channels, enabled) => request.post('/admin/config', {
    monitor_channels: channels,
    monitor_enabled: enabled ? '1' : '0'
  })
}

// ========== AI管线处理接口 ==========
export const pipelineApi = {
  getArticles: (params) => request.get('/admin/pipeline/articles', { params }),
  getArticleDetail: (id) => request.get(`/admin/pipeline/articles/${id}`),
  preview: (articleId, pipeline) => request.post('/admin/pipeline/preview', { articleId, pipeline }),
  process: (articleId, pipeline, data = {}) => request.post('/admin/pipeline/process', { articleId, pipeline, ...data }),
  batchProcess: (articleIds, pipeline) => request.post('/admin/pipeline/batch-process', { articleIds, pipeline }),
}
