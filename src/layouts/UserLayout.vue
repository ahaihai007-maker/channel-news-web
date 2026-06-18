<template>
  <div class="user-layout">
    <NavHeader />
    
    <div class="main-container">
      <aside class="sidebar">
        <el-menu
          :default-active="activeMenu"
          class="user-menu"
          router
        >
          <el-menu-item index="/user/articles">
            <el-icon><Document /></el-icon>
            <span>我的稿件</span>
          </el-menu-item>
          
          <el-menu-item index="/user/article/create">
            <el-icon><Edit /></el-icon>
            <span>投稿</span>
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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NavHeader from '../components/common/NavHeader.vue'
import { Document, Edit } from '@element-plus/icons-vue'

const route = useRoute()

const activeMenu = computed(() => {
  return route.path
})
</script>

<style scoped>
.user-layout {
  min-height: 100vh;
  background: #f5f7fa;
}

.main-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  gap: 20px;
}

.sidebar {
  width: 220px;
  flex-shrink: 0;
}

.user-menu {
  border-radius: 8px;
  min-height: 400px;
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
