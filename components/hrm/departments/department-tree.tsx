"use client"

import React, { useState } from 'react'
import { ChevronRight, ChevronDown, Building, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDepartmentTree } from '@/hooks/use-departments'
import type { DepartmentTreeNode } from '@/types/hrm'

interface DepartmentTreeProps {
  onSelectDepartment?: (node: DepartmentTreeNode) => void
  selectedId?: number
}

export function DepartmentTree({ onSelectDepartment, selectedId }: DepartmentTreeProps) {
  const { data: treeData, isLoading } = useDepartmentTree()
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set())

  const toggleNode = (nodeId: number) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  const renderTreeNode = (node: DepartmentTreeNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)
    const isSelected = selectedId === node.id

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            'flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer hover:bg-accent transition-colors',
            isSelected && 'bg-accent',
            level > 0 && 'ml-6'
          )}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id)
            }
            onSelectDepartment?.(node)
          }}
        >
          {/* Expand/Collapse Icon */}
          <div className="shrink-0 w-5">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleNode(node.id)
                }}
                className="hover:bg-accent-foreground/10 rounded p-0.5"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="w-4" />
            )}
          </div>

          {/* Department Icon */}
          <Building className="h-4 w-4 text-muted-foreground shrink-0" />

          {/* Department Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{node.name}</span>
              <span className="text-xs text-muted-foreground font-mono">
                {node.code}
              </span>
            </div>
            {node.manager && (
              <div className="text-xs text-muted-foreground">
                Manager: {node.manager.name}
              </div>
            )}
          </div>

          {/* Employee Count */}
          <Badge variant="secondary" className="shrink-0">
            <Users className="h-3 w-3 mr-1" />
            {node.employees_count || 0}
          </Badge>

          {/* Active Status */}
          {!node.is_active && (
            <Badge variant="outline" className="shrink-0">
              Inactive
            </Badge>
          )}
        </div>

        {/* Child Nodes */}
        {hasChildren && isExpanded && (
          <div className="ml-2">
            {node.children!.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (!treeData || treeData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No departments found. Create your first department to get started.
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Organization Structure</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (expandedNodes.size > 0) {
              setExpandedNodes(new Set())
            } else {
              // Expand all nodes
              const allIds = new Set<number>()
              const collectIds = (nodes: DepartmentTreeNode[]) => {
                nodes.forEach((node) => {
                  allIds.add(node.id)
                  if (node.children) {
                    collectIds(node.children)
                  }
                })
              }
              collectIds(treeData)
              setExpandedNodes(allIds)
            }
          }}
        >
          {expandedNodes.size > 0 ? 'Collapse All' : 'Expand All'}
        </Button>
      </div>
      {treeData.map((node) => renderTreeNode(node, 0))}
    </div>
  )
}

