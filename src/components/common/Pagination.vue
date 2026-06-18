<template>
  <div class="pagination-wrapper">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 10
  },
  total: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:modelValue', 'update:pageSize', 'change'])

const currentPage = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const pageSize = computed({
  get: () => props.pageSize,
  set: (val) => emit('update:pageSize', val)
})

const handleSizeChange = (val) => {
  emit('update:pageSize', val)
  emit('change', { page: 1, pageSize: val })
}

const handleCurrentChange = (val) => {
  emit('update:modelValue', val)
  emit('change', { page: val, pageSize: props.pageSize })
}
</script>

<style scoped>
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}
</style>
