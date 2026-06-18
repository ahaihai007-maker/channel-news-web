<template>
  <header class="nav-header">
    <div class="container">
      <div class="logo">
        <router-link to="/">
          <span class="logo-text">📚 文章投稿系统</span>
        </router-link>
      </div>
      
      <nav class="nav-menu">
        <router-link to="/" class="nav-item">首页</router-link>
      </nav>
      
      <div class="user-section">
        <template v-if="userStore.isLoggedIn">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :icon="UserFilled" />
              <span class="username">{{ userStore.user?.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="articles">我的文章</el-dropdown-item>
                <el-dropdown-item command="submit">投稿</el-dropdown-item>
                <el-dropdown-item v-if="userStore.isAdmin" command="admin">管理后台</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <router-link to="/login">
            <el-button type="primary">登录</el-button>
          </router-link>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user.js'
import { UserFilled, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const handleCommand = (command) => {
  switch (command) {
    case 'articles':
      router.push('/user/articles')
      break
    case 'submit':
      router.push('/user/article/create')
      break
    case 'admin':
      router.push('/admin/article-manage')
      break
    case 'logout':
      userStore.logout()
      ElMessage.success('退出登录成功')
      router.push('/')
      break
  }
}
</script>

<style scoped>
.nav-header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo a {
  text-decoration: none;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
}

.nav-menu {
  display: flex;
  gap: 30px;
}

.nav-item {
  text-decoration: none;
  color: #606266;
  font-size: 15px;
  transition: color 0.3s;
}

.nav-item:hover,
.nav-item.router-link-active {
  color: #409eff;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background 0.3s;
}

.user-info:hover {
  background: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #606266;
}
</style>
