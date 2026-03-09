import { Skeleton } from "./ui/skeleton";
import { Card } from "./ui/card";

type Variant = "dashboard" | "quiz" | "flashcards" | "battle";

export function PageSkeleton({ variant = "dashboard" }: { variant?: Variant }) {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Skeleton className="h-6 w-32 mb-3" />
          <Skeleton className="h-8 w-64" />
        </div>
        {variant === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-card border-border p-6">
                <div className="space-y-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-72" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        {variant === "quiz" && (
          <div className="max-w-4xl mx-auto">
            <Card className="bg-card border-border p-8 mb-6">
              <div className="space-y-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-10 w-64" />
              </div>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        )}
        {variant === "flashcards" && (
          <div className="max-w-3xl mx-auto">
            <Card className="bg-card border-border p-8 mb-6">
              <Skeleton className="h-7 w-56 mb-4" />
              <Skeleton className="h-24 w-full" />
            </Card>
            <div className="flex justify-center gap-4">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
        )}
        {variant === "battle" && (
          <div className="max-w-4xl mx-auto">
            <Card className="bg-card border-border p-8">
              <Skeleton className="h-6 w-48 mb-6" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="bg-secondary border-border p-4">
                    <Skeleton className="h-10 w-10 rounded-full mx-auto mb-2" />
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </Card>
                ))}
              </div>
              <div className="mt-6">
                <Skeleton className="h-12 w-full" />
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
