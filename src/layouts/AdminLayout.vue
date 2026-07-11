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
          <div class="menu-header">
            <span class="menu-kicker">Admin Console</span>
            <strong class="menu-title">管理后台</strong>
          </div>

          <template v-for="section in menuSections" :key="section.title">
            <div class="menu-section-title">{{ section.title }}</div>

            <el-menu-item
              v-for="item in section.items"
              :key="item.index"
              :index="item.index"
              class="admin-menu-item"
            >
              <el-icon class="menu-icon">
                <component :is="item.icon" />
              </el-icon>
              <span class="menu-label">{{ item.label }}</span>
              <el-badge
                v-if="item.badge === 'pending' && pendingCount > 0"
                :value="pendingCount"
                :max="99"
                class="menu-badge"
              />
            </el-menu-item>
          </template>
        </el-menu>
      </aside>
      
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, markRaw, provide, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import NavHeader from '../components/common/NavHeader.vue'
import {
  Bell,
  ChatDotRound,
  Connection,
  Document,
  MagicStick,
  Money,
  Promotion,
  Setting
} from '@element-plus/icons-vue'
import { getPendingReviews } from '../services/api.js'

const route = useRoute()
const pendingCount = shallowRef(0)

const menuSections = [
  {
    title: '内容流转',
    items: [
      {
        index: '/admin/article-manage',
        label: '稿件管理',
        icon: markRaw(Bell),
        badge: 'pending',
        activePaths: ['/admin/article-manage', '/admin/review']
      },
      {
        index: '/admin/articles',
        label: '文章管理',
        icon: markRaw(Document),
        activePaths: ['/admin/articles']
      }
    ]
  },
  {
    title: '发布配置',
    items: [
      {
        index: '/admin/config',
        label: '装修模版',
        icon: markRaw(Setting),
        activePaths: ['/admin/config']
      },
      {
        index: '/admin/telegram-config',
        label: 'Telegram 系统',
        icon: markRaw(Connection),
        activePaths: ['/admin/telegram-config']
      },
      {
        index: '/admin/ads',
        label: '广告模板',
        icon: markRaw(Promotion),
        activePaths: ['/admin/ads']
      }
    ]
  },
  {
    title: '自动化',
    items: [
      {
        index: '/admin/pipeline',
        label: 'AI 管线处理',
        icon: markRaw(MagicStick),
        activePaths: ['/admin/pipeline']
      },
      {
        index: '/admin/article-publish-plans',
        label: '发文计划',
        icon: markRaw(MagicStick),
        activePaths: ['/admin/article-publish-plans']
      },
      {
        index: '/admin/ai-config',
        label: 'AI 设置',
        icon: markRaw(Setting),
        activePaths: ['/admin/ai-config']
      },
      {
        index: '/admin/interaction-ai',
        label: '互动 AI',
        icon: markRaw(ChatDotRound),
        activePaths: ['/admin/interaction-ai']
      }
    ]
  },
  {
    title: '结算',
    items: [
      {
        index: '/admin/payment',
        label: '稿费管理',
        icon: markRaw(Money),
        activePaths: ['/admin/payment']
      }
    ]
  }
]

const menuItems = menuSections.flatMap((section) => section.items)

const activeMenu = computed(() => {
  const matchedItem = menuItems.find((item) =>
    item.activePaths.some((path) => route.path === path || route.path.startsWith(`${path}/`))
  )

  return matchedItem?.index || route.path
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
</script>

<style scoped>
.admin-layout {
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

.admin-menu {
  min-height: calc(100vh - 108px);
  padding: 0 10px 14px;
  border: 1px solid #e7eaf0;
  border-right: 1px solid #e7eaf0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(31, 41, 55, 0.06);
  box-sizing: border-box;
}

.menu-section-title {
  padding: 16px 8px 7px;
  font-size: 12px;
  line-height: 1;
  font-weight: 700;
  color: #9aa3b2;
  letter-spacing: 0;
}

.admin-menu-item {
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

.admin-menu-item:hover {
  background: #f2f6ff;
  color: #2563eb;
}

.admin-menu-item.is-active {
  background: #eaf2ff;
  color: #1d4ed8;
  font-weight: 700;
}

.menu-icon {
  width: 18px;
  margin-right: 10px;
  color: inherit;
}

.menu-label {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-badge {
  margin-left: 8px;
  flex-shrink: 0;
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

  .admin-menu {
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

  .admin-menu-item {
    min-width: 180px;
  }
}
</style>
