export const monitoringChartTheme = Object.freeze({
  surface: '#fbfcfe',
  border: '#d9e0e8',
  ink: '#273341',
  muted: '#697789',
  grid: '#e8edf2',
  accent: '#2563eb',
  accentSoft: 'rgba(37, 99, 235, 0.1)',
  secondary: '#0f766e',
  warning: '#a16207',
  danger: '#c2413b',
  loadingMask: 'rgba(248, 250, 252, 0.82)'
})

export function monitoringChartAnimationDuration() {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 420
}
