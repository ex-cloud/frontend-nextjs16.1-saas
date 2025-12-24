"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, AlertTriangle } from 'lucide-react'

interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  userName?: string
  isLoading?: boolean
  isBulk?: boolean
  count?: number
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  userName,
  isLoading = false,
  isBulk = false,
  count = 0,
}: DeleteConfirmationDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {isBulk ? 'Delete Multiple Users' : 'Delete User'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {isBulk ? (
              <>
                <span className="block">
                  Are you sure you want to delete <strong>{count} user(s)</strong>?
                </span>
                <span className="block text-destructive">
                  This action cannot be undone. All selected users and their associated
                  data will be permanently deleted.
                </span>
              </>
            ) : (
              <>
                <span className="block">
                  Are you sure you want to delete{' '}
                  <strong className="text-foreground">{userName}</strong>?
                </span>
                <span className="block text-destructive">
                  This action cannot be undone. This will permanently delete the user
                  and all associated data.
                </span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isBulk ? `Delete ${count} User(s)` : 'Delete User'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

