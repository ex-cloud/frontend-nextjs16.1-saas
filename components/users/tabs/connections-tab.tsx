"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

interface ConnectionsTabProps {
  userId: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ConnectionsTab({ userId }: ConnectionsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Profile Section */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Profile</h3>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">1</Badge>
                    <span className="text-sm">Contact</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Blogger</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Logs Section */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Logs</h3>

              <div className="space-y-2">
                <div className="text-sm">Access Log</div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary">1</Badge>
                  <span className="text-sm">Activity Log</span>
                </div>

                <div className="text-sm">Energy Point Log</div>

                <div className="text-sm">Route History</div>
              </div>
            </div>

            {/* Settings Section */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Settings</h3>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">User Permission</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-sm">Document Follow</div>
              </div>
            </div>
          </div>

          {/* Activity Section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Activity</h3>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Communication</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">ToDo</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Integrations Section */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Integrations</h3>

              <div className="space-y-2">
                <div className="text-sm">Token Cache</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
