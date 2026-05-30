"use client"

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 data-horizontal:w-full data-horizontal:skeuo-line-horizontal data-vertical:self-stretch data-vertical:skeuo-line-vertical",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
