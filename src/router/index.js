import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user.js'

const routes = [
  {
    path: '/',
    redirect: (to) => {
      // Dynamic redirect based on login state to avoid loops
      const userStore = useUserStore()
      if (userStore.isLoggedIn) {
        return userStore.isAdmin ? '/admin/article-manage' : '/user/article/create'
      }
      return '/login'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { public: true, guestOnly: true }
  },
  {
    path: '/article/:id',
    name: 'ArticleDetail',
    component: () => import('../views/ArticleDetailView.vue'),
    meta: { public: true }
  },
  // 需要登录的路由
  {
    path: '/user',
    component: () => import('../layouts/UserLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'articles',
        name: 'UserArticles',
        redirect: '/user/article/create'
      },
      {
        path: 'article/create',
        name: 'CreateArticle',
        component: () => import('../views/user/SubmitArticleView.vue')
      },
      {
        path: 'article/edit/:id',
        name: 'EditArticle',
        component: () => import('../views/user/EditArticleView.vue')
      },
      {
        path: 'article/detail/:id',
        name: 'UserArticleDetail',
        component: () => import('../views/user/ArticleDetailUserView.vue')
      }
    ]
  },
  // 管理员路由
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: 'articles',
        name: 'AdminArticles',
        component: () => import('../views/admin/ArticlesView.vue')
      },
      {
        path: 'review/pending',
        name: 'ReviewPending',
        component: () => import('../views/admin/ReviewPendingView.vue')
      },
      {
        path: 'review/:id',
        name: 'ReviewDetail',
        component: () => import('../views/admin/ReviewDetailView.vue')
      },
      {
        path: 'publish',
        name: 'PublishManage',
        component: () => import('../views/admin/PublishManageView.vue')
      },
      {
        path: 'article-manage',
        name: 'ArticleManage',
        component: () => import('../views/admin/ArticleManageView.vue')
      },
      {
        path: 'comments',
        name: 'AdminComments',
        component: () => import('../views/admin/CommentsView.vue')
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: () => import('../views/admin/CategoriesView.vue')
      },
      {
        path: 'config',
        name: 'AdminConfig',
        component: () => import('../views/admin/ConfigView.vue')
      },
      {
        path: 'telegram-config',
        name: 'AdminTelegramConfig',
        component: () => import('../views/admin/TelegramConfigView.vue')
      },
      {
        path: 'ai-config',
        name: 'AdminAiConfig',
        component: () => import('../views/admin/AiConfigView.vue')
      },
      {
        path: 'ads',
        name: 'AdminAds',
        component: () => import('../views/admin/AdTemplateView.vue')
      },
      {
        path: 'pipeline',
        name: 'AdminPipeline',
        component: () => import('../views/admin/PipelineView.vue')
      },
      {
        path: 'article-publish-plans',
        name: 'AdminArticlePublishPlans',
        component: () => import('../views/admin/ArticlePublishPlanView.vue')
      },
      {
        path: 'payment',
        name: 'AdminPayment',
        component: () => import('../views/admin/PaymentView.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const isLoggedIn = userStore.isLoggedIn
  const isAdmin = userStore.isAdmin

  // 需要登录但未登录
  if (to.meta.requiresAuth && !isLoggedIn) {
    return next('/login')
  }

  // 需要管理员权限但非管理员
  if (to.meta.requiresAdmin && !isAdmin) {
    return next(isLoggedIn ? '/user/article/create' : '/login')
  }

  // 仅限游客访问（如登录页）
  if (to.meta.guestOnly && isLoggedIn) {
    return next(isAdmin ? '/admin/article-manage' : '/user/article/create')
  }

  next()
})

export default router
