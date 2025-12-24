"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDepartmentPositions } from "@/hooks/use-departments";
import { useCreatePosition } from "@/hooks/use-positions";
import {
  Briefcase,
  Plus,
  DollarSign,
  Search,
  Check,
  Link2,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { POSITION_LEVEL_OPTIONS, Position } from "@/types/hrm";
import { toast } from "sonner";
import { positionApi } from "@/lib/api/positions";

interface DepartmentPositionsTabProps {
  departmentId: number;
  onRefresh?: () => void;
}

export function DepartmentPositionsTab({
  departmentId,
  onRefresh,
}: DepartmentPositionsTabProps) {
  const { data, isLoading, refetch } = useDepartmentPositions(
    departmentId,
    1,
    50
  );
  const createPositionMutation = useCreatePosition();

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [positionToRemove, setPositionToRemove] = useState<Position | null>(
    null
  );

  // Add existing position state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPositions, setSelectedPositions] = useState<number[]>([]);
  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Create new position state
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    level: "",
    description: "",
    salary_min: "",
    salary_max: "",
  });

  const formatCurrency = (value: string | number | null | undefined) => {
    if (!value) return "-";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Open Add Position dialog (assign existing)
  const handleOpenAddDialog = async () => {
    setSelectedPositions([]);
    setSearchQuery("");
    setAddDialogOpen(true);
    setLoadingAvailable(true);

    try {
      // Fetch all positions not in this department
      const response = await positionApi.list({ per_page: 100 });
      const currentPositionIds = (data?.data || []).map((p) => p.id);
      // Filter positions that are not already in this department or have no department
      const available = (response.data || []).filter(
        (p) =>
          p.department_id !== departmentId && !currentPositionIds.includes(p.id)
      );
      setAvailablePositions(available);
    } catch (error) {
      console.error("Failed to fetch positions:", error);
      toast.error("Failed to load available positions");
    } finally {
      setLoadingAvailable(false);
    }
  };

  // Open Create Position dialog
  const handleOpenCreateDialog = () => {
    setFormData({
      name: "",
      code: "",
      level: "",
      description: "",
      salary_min: "",
      salary_max: "",
    });
    setCreateDialogOpen(true);
  };

  const handleTogglePosition = (positionId: number) => {
    setSelectedPositions((prev) =>
      prev.includes(positionId)
        ? prev.filter((id) => id !== positionId)
        : [...prev, positionId]
    );
  };

  // Add existing positions to department
  const handleAddPositions = async () => {
    if (selectedPositions.length === 0) return;

    setIsAdding(true);
    try {
      // Update each position to belong to this department
      await Promise.all(
        selectedPositions.map((positionId) =>
          positionApi.update(positionId, { department_id: departmentId })
        )
      );

      toast.success(
        `Successfully added ${selectedPositions.length} position(s) to department`
      );
      setAddDialogOpen(false);
      refetch();
      onRefresh?.();
    } catch (error) {
      console.error("Failed to add positions:", error);
      toast.error("Failed to add positions. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  // Create new position
  const handleCreatePosition = async () => {
    if (!formData.name || !formData.code) {
      toast.error("Name and Code are required");
      return;
    }

    try {
      await createPositionMutation.mutateAsync({
        name: formData.name,
        code: formData.code,
        level: formData.level || undefined,
        description: formData.description || undefined,
        salary_min: formData.salary_min
          ? parseFloat(formData.salary_min)
          : undefined,
        salary_max: formData.salary_max
          ? parseFloat(formData.salary_max)
          : undefined,
        department_id: departmentId,
        is_active: true,
      });

      toast.success("Position created successfully");
      setCreateDialogOpen(false);
      refetch();
      onRefresh?.();
    } catch (error) {
      console.error("Failed to create position:", error);
      toast.error("Failed to create position");
    }
  };

  // Remove position from department
  const handleRemoveClick = (position: Position) => {
    setPositionToRemove(position);
    setRemoveDialogOpen(true);
  };

  const handleRemoveConfirm = async () => {
    if (!positionToRemove) return;

    setIsRemoving(true);
    try {
      // Set position's department_id to null
      await positionApi.update(positionToRemove.id, { department_id: null });

      toast.success(
        `Successfully removed ${positionToRemove.name} from department`
      );
      setRemoveDialogOpen(false);
      setPositionToRemove(null);
      refetch();
      onRefresh?.();
    } catch (error) {
      console.error("Failed to remove position:", error);
      toast.error("Failed to remove position. Please try again.");
    } finally {
      setIsRemoving(false);
    }
  };

  const filteredPositions = availablePositions.filter(
    (position) =>
      position.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      position.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="px-6 pb-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const positions = data?.data || [];

  return (
    <div className="px-6 pb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Department Positions ({positions.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleOpenAddDialog}>
              <Link2 className="h-4 w-4 mr-2" />
              Add Position
            </Button>
            <Button size="sm" onClick={handleOpenCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Position
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No positions in this department
              </p>
              <div className="flex gap-2 justify-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenAddDialog}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Add Existing Position
                </Button>
                <Button size="sm" onClick={handleOpenCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Position
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Salary Range</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{position.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{position.code}</span>
                    </TableCell>
                    <TableCell>
                      {position.level ? (
                        <Badge variant="outline">{position.level}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        <span>
                          {formatCurrency(position.salary_min)} -{" "}
                          {formatCurrency(position.salary_max)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {position.users_count || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={position.is_active ? "default" : "secondary"}
                      >
                        {position.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveClick(position)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Existing Position Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Position to Department</DialogTitle>
            <DialogDescription>
              Select existing positions to add to this department.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search positions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[300px] border rounded-md">
              {loadingAvailable ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredPositions.map((position) => (
                    <div
                      key={position.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                      onClick={() => handleTogglePosition(position.id)}
                    >
                      <Checkbox
                        checked={selectedPositions.includes(position.id)}
                        onCheckedChange={() =>
                          handleTogglePosition(position.id)
                        }
                      />
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{position.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {position.code}
                        </p>
                      </div>
                      {selectedPositions.includes(position.id) && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  ))}
                  {filteredPositions.length === 0 && !loadingAvailable && (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery
                        ? "No positions found matching your search"
                        : "No available positions to add"}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {selectedPositions.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedPositions.length} position(s) selected
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddPositions}
              disabled={selectedPositions.length === 0 || isAdding}
            >
              {isAdding ? "Adding..." : "Add Positions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Position Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Position</DialogTitle>
            <DialogDescription>
              Create a new position for this department.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Position Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Senior Software Engineer"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                placeholder="e.g., SSE"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: e.target.value.toUpperCase(),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select
                value={formData.level}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, level: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {POSITION_LEVEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary_min">Min Salary</Label>
                <Input
                  id="salary_min"
                  type="number"
                  placeholder="0"
                  value={formData.salary_min}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      salary_min: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary_max">Max Salary</Label>
                <Input
                  id="salary_max"
                  type="number"
                  placeholder="0"
                  value={formData.salary_max}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      salary_max: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Position description..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePosition}
              disabled={createPositionMutation.isPending}
            >
              {createPositionMutation.isPending
                ? "Creating..."
                : "Create Position"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Position Confirmation Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Position</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{positionToRemove?.name}
              &quot; from this department? The position will still exist but
              won&apos;t be linked to this department.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
