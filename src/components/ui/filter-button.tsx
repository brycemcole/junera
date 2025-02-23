import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { RiCloseFill } from '@remixicon/react'
import Image from "next/image"

const filterBadgeVariants = cva(
  "inline-flex items-center bg-background text-tremor-label text-muted-foreground border",
  {
    variants: {
      variant: {
        default: "rounded-md gap-x-2.5 py-1 pl-2.5 pr-1",
        pill: "rounded-md gap-x-2.5 py-1 pl-2.5 pr-1",
        avatar: "rounded-md gap-2 px-1 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface FilterBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof filterBadgeVariants> {
  label?: string
  value?: string
  avatar?: string
  children?: React.ReactNode
  onRemove?: () => void
}

export function FilterBadge({
  className,
  variant,
  label,
  value,
  avatar,
  children,
  onRemove,
  ...props
}: FilterBadgeProps) {
  if (variant === "avatar") {
    return (
      <span className={cn(filterBadgeVariants({ variant }), className)} {...props}>
        {avatar && (
          <Image
            className="inline-block size-5 rounded-md"
            src={avatar}
            alt=""
          />
        )}
        {children}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex size-5 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Remove"
          >
            <RiCloseFill className="size-4 shrink-0" aria-hidden={true} />
          </button>
        )}
      </span>
    )
  }

  return (
    <span className={cn(filterBadgeVariants({ variant }), className)} {...props}>
      {label}
      <span className="h-4 w-px bg-border" />
      <span className="font-medium text-foreground">
        {value}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            "-ml-1.5 flex size-5 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground",
            variant === "pill" ? "rounded-md" : "rounded"
          )}
          aria-label="Remove"
        >
          <RiCloseFill className="size-4 shrink-0" aria-hidden={true} />
        </button>
      )}
    </span>
  )
}