<template>
  <el-tag :type="tagType" size="small">
    {{ statusText }}
  </el-tag>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true
  }
})

const statusMap = {
  'draft': { text: '草稿', type: 'info' },
  'pending': { text: '待审核', type: 'warning' },
  'approved': { text: '已通过', type: 'success' },
  'rejected': { text: '已拒绝', type: 'danger' },
  'published': { text: '已发布', type: 'primary' }
}

const statusText = computed(() => {
  return statusMap[props.status]?.text || props.status
})

const tagType = computed(() => {
  return statusMap[props.status]?.type || 'info'
})
</script>
