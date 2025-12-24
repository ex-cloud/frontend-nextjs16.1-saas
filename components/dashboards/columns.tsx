/**
 * Activity Log Table Columns
 * 
 * Column definitions for activity logs in dashboard
 */

import { ColumnDef } from '@tanstack/react-table'
import { ActivityLog } from '@/types/user'
import { formatDistanceToNow } from 'date-fns'

export const columns: ColumnDef<ActivityLog>[] = [
  {
    accessorKey: 'description',
    header: 'Activity',
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.description}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.log_name}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'causer',
    header: 'User',
    cell: ({ row }) => {
      const causer = row.original.causer
      return causer ? (
        <div className="flex flex-col">
          <span className="font-medium">{causer.name}</span>
          <span className="text-xs text-muted-foreground">{causer.email}</span>
        </div>
      ) : (
        <span className="text-muted-foreground">System</span>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Time',
    cell: ({ row }) => {
      try {
        return (
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(row.original.created_at), { addSuffix: true })}
          </span>
        )
      } catch {
        return <span className="text-sm text-muted-foreground">{row.original.created_at}</span>
      }
    },
  },
]
