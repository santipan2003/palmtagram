"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { ProfileHighlight } from "@/lib/data/mock-data";
import Image from "next/image";

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
                {/* relative parent for Next/Image */}
                <div className="relative h-full w-full rounded-full overflow-hidden border-2 border-background">
                  <Image
                    src={highlight.cover || "/placeholder.svg"}
                    alt={highlight.title}
                    fill
                    sizes="64px"
                    className="object-cover"
                    placeholder="blur"
                    blurDataURL="/placeholder.svg"
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
