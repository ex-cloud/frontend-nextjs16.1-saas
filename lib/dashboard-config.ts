/**
 * Dashboard Configuration System
 *
 * Defines widget configurations and default layouts for the customizable dashboard.
 * Uses CSS Grid with explicit row/column placements.
 */

export interface WidgetConfig {
  id: string;
  label: string;
  // CSS Grid placement: row-start / col-start / row-end / col-end
  gridRow: string;
  gridColumn: string;
  // Constraints
  minColSpan?: number;
  maxColSpan?: number;
  minRowSpan?: number;
  maxRowSpan?: number;
  // Visibility
  visible: boolean;
}

export interface DashboardLayout {
  version: number;
  widgets: WidgetConfig[];
}

// 12-column grid system
export const GRID_COLUMNS = 12;

// Default widget configurations
export const DEFAULT_WIDGETS: WidgetConfig[] = [
  // Row 1: Stats & Quick Links
  {
    id: "stats",
    label: "Statistics Cards",
    gridRow: "1 / 2",
    gridColumn: "1 / 10", // 9 columns
    minColSpan: 6,
    maxColSpan: 12,
    visible: true,
  },
  {
    id: "quick-links",
    label: "Quick Links",
    gridRow: "1 / 2",
    gridColumn: "10 / 13", // 3 columns
    minColSpan: 2,
    maxColSpan: 6,
    visible: true,
  },

  // Row 2: Main Chart & Calendar
  {
    id: "main-chart",
    label: "Total Visitors Chart",
    gridRow: "2 / 3",
    gridColumn: "1 / 9", // 8 columns
    minColSpan: 4,
    maxColSpan: 12,
    visible: true,
  },
  {
    id: "calendar",
    label: "Calendar",
    gridRow: "2 / 3",
    gridColumn: "9 / 13", // 4 columns
    minColSpan: 3,
    maxColSpan: 6,
    visible: true,
  },

  // Row 3: Live Feed (Activity) -> Replaces old vertical activity
  {
    id: "live-feed",
    label: "Live Activity Feed",
    gridRow: "3 / 4",
    gridColumn: "1 / 5", // 4 columns
    minColSpan: 3,
    maxColSpan: 6,
    visible: true,
  },

  // Row 3: Bottom Charts
  {
    id: "user-metrics",
    label: "User Activity Level",
    gridRow: "3 / 4",
    gridColumn: "5 / 9", // 4 columns
    minColSpan: 3,
    maxColSpan: 6,
    visible: true,
  },
  {
    id: "role-distribution", // Renamed from user-roles for clarity or kept same ID
    label: "Roles Distribution",
    gridRow: "3 / 4",
    gridColumn: "9 / 13", // 4 columns
    minColSpan: 3,
    maxColSpan: 6,
    visible: true,
  },

  // Row 4: HRM Overview (Optional/Hidden by default if too crowded, or visible)
  {
    id: "hrm-overview",
    label: "HRM Overview",
    gridRow: "4 / 5",
    gridColumn: "1 / 13", // Full width
    minColSpan: 4,
    maxColSpan: 12,
    visible: true,
  },
];

export const DEFAULT_LAYOUT: DashboardLayout = {
  version: 2, // Bump version
  widgets: DEFAULT_WIDGETS,
};

// LocalStorage key for persisting layout
export const LAYOUT_STORAGE_KEY = "dashboard-layout-v2";

// Helper: Get widget by ID
export function getWidgetById(
  layout: DashboardLayout,
  id: string,
): WidgetConfig | undefined {
  return layout.widgets.find((w) => w.id === id);
}

// Helper: Update widget in layout
export function updateWidget(
  layout: DashboardLayout,
  id: string,
  updates: Partial<WidgetConfig>,
): DashboardLayout {
  return {
    ...layout,
    widgets: layout.widgets.map((w) =>
      w.id === id ? { ...w, ...updates } : w,
    ),
  };
}

// Helper: Swap two widgets' positions
export function swapWidgets(
  layout: DashboardLayout,
  idA: string,
  idB: string,
): DashboardLayout {
  const widgetA = getWidgetById(layout, idA);
  const widgetB = getWidgetById(layout, idB);

  if (!widgetA || !widgetB) return layout;

  return {
    ...layout,
    widgets: layout.widgets.map((w) => {
      if (w.id === idA) {
        return {
          ...w,
          gridRow: widgetB.gridRow,
          gridColumn: widgetB.gridColumn,
        };
      }
      if (w.id === idB) {
        return {
          ...w,
          gridRow: widgetA.gridRow,
          gridColumn: widgetA.gridColumn,
        };
      }
      return w;
    }),
  };
}

// Helper: Toggle widget visibility
export function toggleWidgetVisibility(
  layout: DashboardLayout,
  id: string,
): DashboardLayout {
  return {
    ...layout,
    widgets: layout.widgets.map((w) =>
      w.id === id ? { ...w, visible: !w.visible } : w,
    ),
  };
}

// Helper: Resize widget (change column span)
export function resizeWidget(
  layout: DashboardLayout,
  id: string,
  delta: number, // +1 (expand) or -1 (shrink)
): DashboardLayout {
  const widget = getWidgetById(layout, id); // Ensure getWidgetById is defined earlier
  if (!widget) return layout;

  // Parse current gridColumn "start / end"
  const [startStr, endStr] = widget.gridColumn.split("/").map((s) => s.trim());
  const start = parseInt(startStr, 10);
  const end = parseInt(endStr, 10);

  if (isNaN(start) || isNaN(end)) return layout;

  const currentSpan = end - start;
  let newSpan = currentSpan + delta;

  // Apply constraints
  const minSpan = widget.minColSpan || 2;
  const maxSpan = widget.maxColSpan || GRID_COLUMNS;

  // 1. Min/Max Width Check
  if (newSpan < minSpan) newSpan = minSpan;
  if (newSpan > maxSpan) newSpan = maxSpan;

  // 2. Grid Bounds Check (Cannot go beyond column 13)
  if (start + newSpan > 13) {
    newSpan = 13 - start;
  }

  // If no change, return layout
  if (newSpan === currentSpan) return layout;

  const newEnd = start + newSpan;
  const newGridColumn = `${start} / ${newEnd}`;

  return updateWidget(layout, id, { gridColumn: newGridColumn });
}
