<script setup>
defineProps({
  form: { type: Object, required: true },
  submitting: { type: Boolean, required: true }
})

const visible = defineModel('visible', { required: true })

defineEmits(['submit'])
</script>

<template>
  <el-dialog v-model="visible" title="快速投稿" width="800px">
    <el-form :model="form" label-width="80px">
      <el-form-item label="标题" required>
        <el-input v-model="form.title" placeholder="请输入标题" />
      </el-form-item>
      <el-form-item label="内容" required>
        <el-input v-model="form.content" type="textarea" :rows="10" placeholder="请输入内容，支持HTML标签" />
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="form.articleType" placeholder="选择类型">
          <el-option label="网友投稿" value="SUBMISSION" />
          <el-option label="机器人抓取" value="BOT" />
          <el-option label="手动投稿" value="MANUAL" />
          <el-option label="付费广告" value="AD" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="$emit('submit')">提交</el-button>
    </template>
  </el-dialog>
</template>
