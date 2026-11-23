import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

/*
 * Perfetto buttons: rounded pills. On hover a circle of the lighter tone
 * rises from below and fills the button (the ::before layer).
 *   gold    main action on dark or light surfaces
 *   light   outline button on photos and dark sections
 *   dark    solid ink button on paper
 *   outline outline button on paper
 */
const fill =
  "relative isolate overflow-hidden before:pointer-events-none before:absolute before:top-1/2 before:left-1/2 before:-z-10 before:aspect-square before:w-[110%] before:rounded-full before:content-[''] before:-translate-x-1/2 before:translate-y-[60%] before:scale-0 before:transition-[translate,scale] before:duration-[650ms] before:ease-in-out-quart hover:before:-translate-y-1/2 hover:before:scale-[1.6]"

const buttonCva = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2.5 rounded-full border border-transparent font-medium tracking-[0.02em] whitespace-nowrap no-underline transition-[color,border-color,background-color,opacity] duration-500 ease-in-out-quart outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        gold: cn(fill, "bg-gold text-[#1A120B] before:bg-gold-2"),
        light: cn(fill, "border-cream/45 text-cream before:bg-cream hover:border-cream hover:text-ink"),
        dark: cn(fill, "bg-ink text-cream before:bg-[#3A2E26]"),
        outline: cn(fill, "border-ink/40 text-ink before:bg-ink hover:border-ink hover:text-cream"),
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "rounded-none px-0 text-current underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-10 px-5 text-[0.9rem]",
        default: "h-[3.25rem] px-7 text-[0.98rem]",
        lg: "h-14 px-9 text-[1.04rem]",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "gold",
      size: "default",
    },
  }
)

/** Class names for a button look, merged so the variant always wins (use on <a> too). */
function buttonVariants({ className, ...variants }: VariantProps<typeof buttonCva> & { className?: string } = {}) {
  return cn(buttonCva(variants), className)
}

function Button({
  className,
  variant = "gold",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonCva> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  )
}

export { Button, buttonVariants }
