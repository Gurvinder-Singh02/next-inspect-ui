"use client";
import React from "react";
import { hashTestId } from "@/lib/hash-test-id";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function ShadcnProfileCard({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback data-testid={hashTestId("shadcn-avatar-fallback")}>
              JD
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>Jane Doe</CardTitle>
            <CardDescription>Senior Engineer</CardDescription>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge data-testid={hashTestId("shadcn-badge-default")}>React</Badge>
          <Badge variant="secondary">TypeScript</Badge>
          <Badge
            variant="outline"
            data-testid={hashTestId("shadcn-badge-outline")}
          >
            Next.js
          </Badge>
          <Badge variant="destructive">Urgent</Badge>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button size="sm" data-testid={hashTestId("shadcn-button-primary")}>
          Follow
        </Button>
        <Button
          variant="outline"
          size="sm"
          data-testid={hashTestId("shadcn-button-outline")}
        >
          Message
        </Button>
      </CardFooter>
    </Card>
  );
}
