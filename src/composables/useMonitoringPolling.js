import { onMounted, onUnmounted, shallowRef } from 'vue'

export function useMonitoringPolling(callback, options = {}) {
  const { intervalMs = 30000, onPause = () => {} } = options
  const isAutoRefresh = shallowRef(true)
  let timerId = null

  function schedule() {
    stop()
    if (!isAutoRefresh.value || document.hidden) {
      return
    }
    timerId = window.setInterval(callback, intervalMs)
  }

  function stop() {
    if (timerId !== null) {
      window.clearInterval(timerId)
      timerId = null
    }
  }

  function setAutoRefresh(value) {
    isAutoRefresh.value = value
    schedule()
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      stop()
      onPause()
      return
    }
    callback()
    schedule()
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    schedule()
  })

  onUnmounted(() => {
    stop()
    onPause()
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  return {
    isAutoRefresh,
    setAutoRefresh,
    stop
  }
}
