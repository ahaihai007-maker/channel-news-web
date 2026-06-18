<template>
  <div class="payment-container">
    <el-card class="stats-card">
      <template #header>
        <div class="card-header">
          <span>稿费统计报表</span>
          <div class="header-actions">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="loadStatistics"
            />
          </div>
        </div>
      </template>

      <!-- 总计 -->
      <div class="summary-row">
        <el-statistic title="结算笔数" :value="statistics.summary?.totalRecords || 0" />
        <el-statistic title="总稿费" :value="statistics.summary?.totalAmount || 0" suffix="元" />
      </div>

      <!-- 按文章类型统计 -->
      <el-divider content-position="left">按文章类型</el-divider>
      <el-table :data="statistics.typeStats || []" stripe>
        <el-table-column prop="articleTypeDesc" label="文章类型" width="120" />
        <el-table-column prop="baseAmount" label="基础稿费" width="100">
          <template #default="{ row }">
            {{ row.baseAmount }} 元/篇
          </template>
        </el-table-column>
        <el-table-column prop="articleCount" label="文章数量" width="100" />
        <el-table-column prop="totalAmount" label="总稿费">
          <template #default="{ row }">
            {{ row.totalAmount }} 元
          </template>
        </el-table-column>
      </el-table>

      <!-- 按用户统计 -->
      <el-divider content-position="left">按用户</el-divider>
      <el-table :data="statistics.userStats || []" stripe>
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="articleCount" label="文章数量" width="100" />
        <el-table-column prop="totalAmount" label="总稿费">
          <template #default="{ row }">
            {{ row.totalAmount }} 元
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 稿费记录 -->
    <el-card class="records-card">
      <template #header>
        <span>结算记录</span>
      </template>

      <el-table :data="records" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="用户" width="120" />
        <el-table-column prop="articleTitle" label="文章标题" show-overflow-tooltip />
        <el-table-column prop="amount" label="稿费" width="100">
          <template #default="{ row }">
            {{ row.amount }} 元
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'PAID' ? 'success' : 'warning'">
              {{ row.status === 'PAID' ? '已结算' : '待结算' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="paidAt" label="结算时间" width="180" />
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadRecords"
        @current-change="loadRecords"
      />
    </el-card>

    <!-- 稿费配置 -->
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <span>稿费配置</span>
          <div>
            <el-button type="primary" size="small" @click="showAddConfig">
              新增配置
            </el-button>
            <el-button type="warning" size="small" @click="resetConfig">
              重置默认
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="paymentConfigs" stripe>
        <el-table-column prop="articleType" label="类型标识" width="120" />
        <el-table-column prop="description" label="类型名称" width="150">
          <template #default="{ row }">
            <el-input v-model="row.description" size="small" />
          </template>
        </el-table-column>
        <el-table-column prop="baseAmount" label="基础稿费(元/篇)">
          <template #default="{ row }">
            <el-input-number
              v-model="row.baseAmount"
              :min="0"
              :step="1"
              size="small"
            />
            <span class="unit">元/篇</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="saveConfig(row)">
              保存
            </el-button>
            <el-button type="danger" size="small" @click="deleteConfig(row)" v-if="row.isCustom">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增配置对话框 -->
    <el-dialog v-model="addConfigVisible" title="新增稿费配置" width="400px">
      <el-form :model="newConfig" label-width="80px">
        <el-form-item label="类型标识">
          <el-select 
            v-model="newConfig.articleType" 
            placeholder="选择或输入类型标识"
            filterable
            allow-create
            style="width: 100%"
          >
            <el-option label="SUBMISSION (网友投稿)" value="SUBMISSION" />
            <el-option label="BOT (机器人抓取)" value="BOT" />
            <el-option label="MANUAL (手动投稿)" value="MANUAL" />
            <el-option label="AD (付费广告)" value="AD" />
            <el-option label="SPECIAL (特别稿件)" value="SPECIAL" />
            <el-option label="URGENT (紧急稿件)" value="URGENT" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型名称">
          <el-select 
            v-model="newConfig.description" 
            placeholder="选择或输入类型名称"
            filterable
            allow-create
            style="width: 100%"
          >
            <el-option label="网友投稿" value="网友投稿" />
            <el-option label="机器人抓取" value="机器人抓取" />
            <el-option label="手动投稿" value="手动投稿" />
            <el-option label="付费广告" value="付费广告" />
            <el-option label="特别稿件" value="特别稿件" />
            <el-option label="紧急稿件" value="紧急稿件" />
          </el-select>
        </el-form-item>
        <el-form-item label="基础稿费">
          <el-input-number v-model="newConfig.baseAmount" :min="0" :step="1" />
          <span class="unit">元/篇</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addConfigVisible = false">取消</el-button>
        <el-button type="primary" @click="addConfig">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../services/request.js'

const loading = ref(false)
const dateRange = ref(null)
const statistics = ref({})
const records = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const paymentConfigs = ref([])
const addConfigVisible = ref(false)
const newConfig = ref({
  articleType: '',
  description: '',
  baseAmount: 0
})

const loadStatistics = async () => {
  try {
    const params = {}
    if (dateRange.value) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await request.get('/admin/payment/statistics', { params })
    statistics.value = res.data
  } catch (e) {
    console.error('加载统计失败', e)
  }
}

const loadRecords = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    if (dateRange.value) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await request.get('/admin/payment/records', { params })
    records.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (e) {
    console.error('加载记录失败', e)
  } finally {
    loading.value = false
  }
}

const loadConfigs = async () => {
  try {
    const res = await request.get('/admin/payment/config')
    paymentConfigs.value = res.data || []
  } catch (e) {
    console.error('加载配置失败', e)
  }
}

const saveConfig = async (config) => {
  try {
    await request.put('/admin/payment/config', {
      articleType: config.articleType,
      baseAmount: config.baseAmount
    })
    ElMessage.success('配置保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const resetConfig = async () => {
  try {
    const defaultConfigs = [
      { articleType: 'SUBMISSION', baseAmount: 5, description: '网友投稿' },
      { articleType: 'BOT', baseAmount: 0, description: '机器人抓取' },
      { articleType: 'MANUAL', baseAmount: 0, description: '手动投稿' },
      { articleType: 'AD', baseAmount: 0, description: '付费广告' }
    ]
    
    for (const config of defaultConfigs) {
      await request.put('/admin/payment/config', config)
    }
    
    await loadConfigs()
    ElMessage.success('已重置为默认配置')
  } catch (e) {
    ElMessage.error('重置失败')
  }
}

const showAddConfig = () => {
  newConfig.value = {
    articleType: '',
    description: '',
    baseAmount: 0
  }
  addConfigVisible.value = true
}

const addConfig = async () => {
  if (!newConfig.value.articleType || !newConfig.value.description) {
    ElMessage.warning('请填写类型标识和类型名称')
    return
  }
  
  try {
    await request.put('/admin/payment/config', newConfig.value)
    await loadConfigs()
    addConfigVisible.value = false
    ElMessage.success('新增配置成功')
  } catch (e) {
    ElMessage.error('新增失败')
  }
}

const deleteConfig = async (row) => {
  try {
    ElMessageBox.confirm('确定要删除该配置吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 删除配置（设置为0）
    row.baseAmount = 0
    await request.put('/admin/payment/config', row)
    await loadConfigs()
    ElMessage.success('删除成功')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadStatistics()
  loadRecords()
  loadConfigs()
})
</script>

<style scoped>
.payment-container {
  padding: 20px;
}

.stats-card,
.records-card,
.config-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.summary-row {
  display: flex;
  gap: 50px;
  margin-bottom: 20px;
}

.unit {
  margin-left: 8px;
  color: #909399;
}

.el-pagination {
  margin-top: 20px;
  justify-content: center;
}
</style>
