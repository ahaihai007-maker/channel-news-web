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
          <div class="menu-header">
            <span class="menu-kicker">User Console</span>
            <strong class="menu-title">投稿中心</strong>
          </div>

          <div class="menu-section-title">内容提交</div>

          <el-menu-item index="/user/article/create" class="user-menu-item">
            <el-icon><Edit /></el-icon>
            <span class="menu-label">投稿</span>
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
import { Edit } from '@element-plus/icons-vue'

const route = useRoute()

const activeMenu = computed(() => {
  if (route.path.startsWith('/user/article')) {
    return '/user/article/create'
  }

  return route.path
})
</script>

<style scoped>
.user-layout {
  min-height: 100vh;
  background: #f4f6f8;
}

.main-container {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 24px;
  display: flex;
  gap: 24px;
  align-items: flex-start;
  box-sizing: border-box;
}

.sidebar {
  width: 248px;
  flex-shrink: 0;
  position: sticky;
  top: 84px;
}

.user-menu {
  min-height: calc(100vh - 108px);
  padding: 0 10px 14px;
  border: 1px solid #e7eaf0;
  border-right: 1px solid #e7eaf0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(31, 41, 55, 0.06);
  box-sizing: border-box;
}

.menu-header {
  padding: 18px 18px 16px;
  border-bottom: 1px solid #edf0f4;
}

.menu-kicker {
  display: block;
  margin-bottom: 4px;
  font-size: 11px;
  line-height: 1.2;
  color: #8a94a6;
  text-transform: uppercase;
  letter-spacing: 0;
}

.menu-title {
  display: block;
  font-size: 17px;
  line-height: 1.35;
  font-weight: 700;
  color: #1f2937;
}

.menu-section-title {
  padding: 16px 8px 7px;
  font-size: 12px;
  line-height: 1;
  font-weight: 700;
  color: #9aa3b2;
  letter-spacing: 0;
}

.user-menu-item {
  height: 42px;
  margin: 2px 0;
  padding: 0 12px !important;
  border-radius: 7px;
  color: #4b5563;
  font-size: 14px;
  line-height: 42px;
  transition:
    background-color 0.18s ease,
    color 0.18s ease;
}

.user-menu-item:hover {
  background: #f2f6ff;
  color: #2563eb;
}

.user-menu-item.is-active {
  background: #eaf2ff;
  color: #1d4ed8;
  font-weight: 700;
}

.menu-label {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content {
  flex: 1;
  min-width: 0;
}

@media (max-width: 768px) {
  .main-container {
    flex-direction: column;
    padding: 14px;
    gap: 14px;
  }
  
  .sidebar {
    width: 100%;
    position: static;
  }

  .user-menu {
    min-height: auto;
    padding: 0 10px 10px;
    overflow-x: auto;
  }

  .menu-header {
    padding: 14px 8px 12px;
  }

  .menu-section-title {
    padding-left: 4px;
  }

  .user-menu-item {
    min-width: 180px;
  }
}
</style>
