"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
import { useState, useMemo } from "react";
import { Role } from "@/types/role";

interface AssignedRolesCardProps {
  availableRoles: Role[];
  selectedRoles: string[];
  onRoleToggle: (roleName: string) => void;
  onSelectAll: () => void;
  onUnselectAll: () => void;
}

export function AssignedRolesCard({
  availableRoles,
  selectedRoles,
  onRoleToggle,
  onSelectAll,
  onUnselectAll,
}: AssignedRolesCardProps) {
  const [filterQuery, setFilterQuery] = useState("");

  // Filter roles based on search query
  const filteredRoles = useMemo(() => {
    if (!filterQuery.trim()) return availableRoles;
    const query = filterQuery.toLowerCase();
    return availableRoles.filter((role) =>
      role.name.toLowerCase().includes(query)
    );
  }, [availableRoles, filterQuery]);

  return (
    <Card className="shadow-none border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              Assigned Roles
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Select roles to assign permissions to this user.
            </p>
          </div>
          <Badge variant="secondary" className="font-medium">
            {selectedRoles.length} SELECTED
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filter Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter roles..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Select/Unselect All Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onSelectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={onUnselectAll}>
            Unselect All
          </Button>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredRoles.map((role) => {
            const isSelected = selectedRoles.includes(role.name);
            return (
              <div
                key={role.id}
                onClick={() => onRoleToggle(role.name)}
                className={`
                  relative flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                  transition-all duration-200 hover:border-primary/50
                  ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-background hover:bg-accent/30"
                  }
                `}
              >
                <Checkbox
                  id={`role-card-${role.id}`}
                  checked={isSelected}
                  onCheckedChange={() => onRoleToggle(role.name)}
                  className="pointer-events-none"
                />
                <span className="text-sm font-medium truncate flex-1">
                  {role.name}
                </span>
              </div>
            );
          })}
        </div>

        {filteredRoles.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {filterQuery ? "No roles match your search" : "No roles available"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
