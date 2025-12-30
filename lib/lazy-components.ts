/**
 * Dynamic Import Helper
 * 
 * Use this to lazy load heavy components that are not immediately needed.
 * This reduces initial bundle size and improves page load times.
 * 
 * @example
 * const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
 *   ssr: false
 * })
 */

import dynamic from 'next/dynamic'


/**
 * Lazy load user form dialog
 * Only loads when user clicks "Add User" or "Edit"
 */
export const LazyUserFormDialog = dynamic(
  () => import('@/components/users/user-form-dialog').then(mod => ({ default: mod.UserFormDialog })),
  {
    ssr: false,
  }
)

/**
 * Lazy load calendar component (DayPicker - 1.28MB!)
 * Only loads when user opens date picker in user profile
 * Massive bundle size reduction when not needed
 */
export const LazyCalendar = dynamic(
  () => import('@/components/ui/calendar').then(mod => ({ default: mod.Calendar }))
)

/**
 * Lazy load interactive chart component (recharts - ~200KB)
 * Only loads on dashboard page when charts are visible
 * Reduces initial bundle for pages without charts
 */
export const LazyChartAreaInteractive = dynamic(
  () => import('@/components/chart-area-interactive').then(mod => ({ default: mod.ChartAreaInteractive })),
  {
    ssr: false,
  }
)
