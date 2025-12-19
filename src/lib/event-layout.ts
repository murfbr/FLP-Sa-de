import { Appointment } from '@/types'
import { formatInTimeZone } from '@/lib/utils'

export interface LayoutedEvent extends Appointment {
  layout: {
    top: number
    height: number
    left: number
    width: number
  }
}

/**
 * Calculates layout for overlapping events to display them side-by-side.
 * Uses a column packing algorithm.
 */
export function computeEventLayout(
  events: Appointment[],
  getTop: (date: Date) => number,
  getHeight: (date: Date, duration: number) => number,
): LayoutedEvent[] {
  // 1. Sort events by start time, then duration (descending)
  const sortedEvents = [...events].sort((a, b) => {
    const startA = new Date(a.schedules.start_time).getTime()
    const startB = new Date(b.schedules.start_time).getTime()
    if (startA !== startB) return startA - startB

    // If start times are equal, longer duration first
    const durA = a.services.duration_minutes
    const durB = b.services.duration_minutes
    return durB - durA
  })

  // 2. Assign events to columns
  const columns: LayoutedEvent[][] = []

  const layoutedEvents: LayoutedEvent[] = sortedEvents.map((event) => {
    const startTime = new Date(event.schedules.start_time).getTime()
    const endTime = new Date(event.schedules.end_time).getTime()

    // Find first column where this event fits
    let colIndex = -1
    for (let i = 0; i < columns.length; i++) {
      const lastEventInCol = columns[i][columns[i].length - 1]
      const lastEventEnd = new Date(lastEventInCol.schedules.end_time).getTime()

      if (startTime >= lastEventEnd) {
        colIndex = i
        break
      }
    }

    if (colIndex === -1) {
      colIndex = columns.length
      columns.push([])
    }

    columns[colIndex].push(event as LayoutedEvent)

    // Calculate vertical position immediately
    const top = getTop(new Date(event.schedules.start_time))
    const height = getHeight(
      new Date(event.schedules.start_time),
      event.services.duration_minutes,
    )

    return {
      ...event,
      layout: {
        top,
        height: Math.max(height, 28), // Minimum height
        left: 0, // Placeholder
        width: 0, // Placeholder
        colIndex, // Temporary property
      },
    } as LayoutedEvent & { layout: { colIndex: number } }
  })

  // 3. Group events into colliding clusters to determine width
  const clusters: (LayoutedEvent & { layout: { colIndex: number } })[][] = []
  let currentCluster: (LayoutedEvent & { layout: { colIndex: number } })[] = []
  let clusterEnd = 0

  layoutedEvents.forEach((event) => {
    const start = new Date(event.schedules.start_time).getTime()
    const end = new Date(event.schedules.end_time).getTime()

    if (currentCluster.length === 0) {
      currentCluster.push(event)
      clusterEnd = end
    } else {
      // If this event starts after the current cluster ends, start new cluster
      if (start >= clusterEnd) {
        clusters.push(currentCluster)
        currentCluster = [event]
        clusterEnd = end
      } else {
        currentCluster.push(event)
        clusterEnd = Math.max(clusterEnd, end)
      }
    }
  })
  if (currentCluster.length > 0) clusters.push(currentCluster)

  // 4. Assign Final Left/Width based on clusters
  clusters.forEach((cluster) => {
    // Find max column index used in this cluster (0-based)
    const maxColIndex = Math.max(...cluster.map((e) => e.layout.colIndex))
    const totalCols = maxColIndex + 1

    cluster.forEach((event) => {
      event.layout.width = 100 / totalCols
      event.layout.left = (event.layout.colIndex / totalCols) * 100
    })
  })

  return layoutedEvents
}
