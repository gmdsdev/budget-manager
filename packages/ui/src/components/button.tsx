import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@budget-manager/ui/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none border border-transparent bg-clip-padding text-xs font-semibold tracking-wide uppercase whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-border bg-primary text-primary-foreground shadow-brutal-xs hover:bg-primary/85 active:not-aria-[haspopup]:translate-x-0.5 active:not-aria-[haspopup]:translate-y-0.5 active:not-aria-[haspopup]:shadow-none",
        outline:
          "border-border bg-card text-foreground shadow-brutal-xs hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent aria-expanded:text-accent-foreground active:not-aria-[haspopup]:translate-x-0.5 active:not-aria-[haspopup]:translate-y-0.5 active:not-aria-[haspopup]:shadow-none",
        secondary:
          "border-border bg-secondary text-secondary-foreground shadow-brutal-xs hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_7%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground active:not-aria-[haspopup]:translate-x-0.5 active:not-aria-[haspopup]:translate-y-0.5 active:not-aria-[haspopup]:shadow-none",
        ghost:
          "hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent aria-expanded:text-accent-foreground active:not-aria-[haspopup]:translate-y-px",
        destructive:
          "border-destructive bg-destructive/10 text-destructive shadow-brutal-xs hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 active:not-aria-[haspopup]:translate-x-0.5 active:not-aria-[haspopup]:translate-y-0.5 active:not-aria-[haspopup]:shadow-none dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      // Touch first below md: 32px is comfortable with a pointer and awkward
      // with a thumb, so the everyday sizes grow to 40px on small screens and
      // keep the desktop density above it. `xs` stays put — it is used inside
      // dense compositions where growing would break the layout.
      size: {
        default:
          "h-10 gap-1.5 px-3 md:h-8 md:px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-none px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-10 gap-1 rounded-none px-3 md:h-7 md:px-2.5 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-1.5 px-3 md:h-9 md:px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-10 md:size-8",
        "icon-xs": "size-6 rounded-none [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-10 rounded-none md:size-7",
        "icon-lg": "size-10 md:size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
