// Simple helpers to keep Recharts tooltips/legends harmonious with current theme
export function getChartColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    text: styles.getPropertyValue('--text-primary')?.trim() || '#0F172A',
    grid: 'rgba(148, 163, 184, 0.25)',
    bg: styles.getPropertyValue('--surface')?.trim() || '#FFFFFF',
  };
}

export function tooltipStyle() {
  const c = getChartColors();
  return {
    backgroundColor: c.bg,
    color: c.text,
    border: '1px solid var(--border)',
    borderRadius: '12px',
  } as React.CSSProperties;
}

export function legendWrapperStyle() {
  return {
    color: 'var(--text-secondary)'
  } as React.CSSProperties;
}
