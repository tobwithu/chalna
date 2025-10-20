import {
  PhysicalPosition,
  primaryMonitor,
  Window,
} from '@tauri-apps/api/window'

export function getTimeString(d: Date): string {
  function fmt(n: number): string {
    return n < 10 ? '0' + n : n.toString()
  }
  return (
    d.getFullYear() +
    '-' +
    fmt(d.getMonth() + 1) +
    '-' +
    fmt(d.getDate()) +
    ' ' +
    fmt(d.getHours()) +
    ':' +
    fmt(d.getMinutes()) +
    ':' +
    fmt(d.getSeconds())
  )
}

export function randomSort(): number {
  return Math.random() - 0.5
}
export async function setWindowPosition(
  window: Window,
  x: 'left' | 'right',
  y: 'top' | 'bottom',
): Promise<void> {
  const monitor = await primaryMonitor()
  if (monitor) {
    const windowSize = await window.outerSize()
    const workArea = monitor.workArea
    const newX =
      x === 'left'
        ? 0
        : workArea.position.x + workArea.size.width - windowSize.width
    const newY =
      y === 'top'
        ? 0
        : workArea.position.y + workArea.size.height - windowSize.height
    await window.setPosition(new PhysicalPosition(newX, newY))
  }
}
