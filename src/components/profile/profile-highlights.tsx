"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { ProfileHighlight } from "@/lib/data/mock-data";

export default function ProfileHighlights({
  highlights,
}: {
  highlights: ProfileHighlight[];
}) {
  return (
    <div className="mb-8">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max space-x-4 p-4">
          {highlights.map((highlight) => (
            <div
              key={highlight.id}
              className="flex flex-col items-center space-y-1"
            >
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-full flex items-center justify-center p-0.5 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
                <div className="h-full w-full rounded-full overflow-hidden border-2 border-background">
                  <img
                    src={highlight.cover || "/placeholder.svg"}
                    alt={highlight.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <span className="text-xs">{highlight.title}</span>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
