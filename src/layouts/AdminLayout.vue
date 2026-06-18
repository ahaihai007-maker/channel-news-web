<template>
  <div class="admin-layout">
    <NavHeader />
    
    <div class="main-container">
      <aside class="sidebar">
        <el-menu
          :default-active="activeMenu"
          class="admin-menu"
          router
        >
          <div class="menu-title">管理后台</div>
          
          <el-menu-item index="/admin/article-manage">
            <el-icon><Bell /></el-icon>
            <span class="menu-text">稿件管理</span>
            <el-badge v-if="pendingCount > 0" :value="pendingCount" class="badge" />
          </el-menu-item>
          
          <el-divider />
          
          <el-menu-item index="/admin/articles">
            <el-icon><Document /></el-icon>
            <span>文章管理</span>
          </el-menu-item>

          <el-divider />

          <el-menu-item index="/admin/config">
            <el-icon><Setting /></el-icon>
            <span>装修模版</span>
          </el-menu-item>

          <el-menu-item index="/admin/payment">
            <el-icon><Money /></el-icon>
            <span>稿费管理</span>
          </el-menu-item>
        </el-menu>
      </aside>
      
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, provide } from 'vue'
import { useRoute } from 'vue-router'
import NavHeader from '../components/common/NavHeader.vue'
import { Bell, Timer, Upload, Odometer, User, Document, Setting, Money } from '@element-plus/icons-vue'
import { getPendingReviews } from '../services/api.js'

const route = useRoute()
const pendingCount = ref(0)

const activeMenu = computed(() => {
  return route.path
})

const fetchPendingCount = async () => {
  try {
    const res = await getPendingReviews({ page: 1, pageSize: 1 })
    if (res.code === 200) {
      pendingCount.value = res.data.total
    }
  } catch (error) {
    console.error('获取待审核数量失败')
  }
}

// 提供给子组件刷新待审核数量的方法
provide('refreshPendingCount', fetchPendingCount)

// 监听路由变化，每次进入管理后台页面都刷新数量
watch(() => route.path, (newPath) => {
  if (newPath.startsWith('/admin')) {
    fetchPendingCount()
  }
}, { immediate: true })

onMounted(() => {
  fetchPendingCount()
})
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: #f5f7fa;
}

.main-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  gap: 20px;
}

.sidebar {
  width: 200px;
  flex-shrink: 0;
}

.menu-title {
  padding: 16px 20px;
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
}

.admin-menu {
  border-radius: 8px;
  min-height: 500px;
}

.menu-text {
  margin-right: 5px;
}

.badge {
  margin-left: 5px;
  vertical-align: super;
}

.content {
  flex: 1;
  min-width: 0;
}

@media (max-width: 768px) {
  .main-container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
  }
}
</style>
