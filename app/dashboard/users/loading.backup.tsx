import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function UsersLoading() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="mb-6">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>

        <Card className="border-gray-400 shadow-none rounded-md">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Toolbar skeleton */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <Skeleton className="h-10 max-w-sm flex-1" />
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-10" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>

              {/* Table skeleton */}
              <div className="rounded-md border">
                <div className="h-12 border-b bg-muted/50 flex items-center px-4">
                  <Skeleton className="h-4 w-full" />
                </div>
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 border-b flex items-center px-4 last:border-0"
                  >
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>

              {/* Pagination skeleton */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-20" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
