"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const YEARLY_ACTIVITY = [
  { month: "J", load: 72 },
  { month: "F", load: 58 },
  { month: "M", load: 50 },
  { month: "A", load: 40 },
  { month: "M", load: 64 },
  { month: "J", load: 78 },
  { month: "J", load: 92 },
  { month: "A", load: 100 },
  { month: "S", load: 86 },
  { month: "O", load: 70 },
  { month: "N", load: 56 },
  { month: "D", load: 44 },
];

export const YearlyActivity = ({ className }: { className?: string }) => (
  <Card className={cn(className)}>
    <CardHeader>
      <CardTitle>Yearly Fitness Summary</CardTitle>
      <CardDescription>Calories and workout load by month</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col gap-4">
      <div className="grid grid-cols-12 gap-1.5">
        {YEARLY_ACTIVITY.map((month, index) => (
          <div
            key={`yearly-month-${index}`}
            className="rounded-md p-1.5 text-center ring ring-border"
          >
            <div className="text-sm text-muted-foreground">{month.month}</div>
            <div className="relative mt-1 h-16 overflow-hidden rounded-sm bg-muted">
              <div
                className="absolute inset-x-0 bottom-0 rounded-sm bg-chart-3"
                style={{ height: `${month.load}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
    <CardFooter>
      <Button className="w-full">View details</Button>
    </CardFooter>
  </Card>
);
