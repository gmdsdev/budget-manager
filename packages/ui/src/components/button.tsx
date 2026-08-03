import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@budget-manager/ui/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-base leading-[1.2] font-semibold whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        outline:
          "border-input bg-transparent text-foreground hover:bg-accent aria-expanded:bg-accent",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/70 aria-expanded:bg-secondary",
        ghost:
          "text-foreground hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent aria-expanded:text-accent-foreground",
        destructive:
          "border-destructive/40 bg-transparent text-destructive hover:bg-destructive/10 focus-visible:ring-destructive",
        link: "text-link underline-offset-4 hover:underline",
        // For the branded plane (the dashboard hero), where the page's own
        // `primary` is the background and would vanish. Forest fill, bright
        // green label — and the focus ring has to be offset against the brand
        // surface rather than the page.
        onBrand:
          "bg-wise-forest-green text-wise-bright-green hover:bg-wise-forest-green/85 focus-visible:ring-wise-forest-green focus-visible:ring-offset-wise-bright-green",
        // The secondary actions on that plane: a wash of the same ink with a
        // ring, so they read as one set with `onBrand` without competing.
        ghostOnBrand:
          "bg-wise-forest-green/[0.08] text-wise-forest-green ring-[1.5px] ring-wise-forest-green/25 ring-inset hover:bg-wise-forest-green/[0.14] focus-visible:ring-wise-forest-green focus-visible:ring-offset-wise-bright-green",
      },
      // Wise's control scale, and it does not change with the viewport: the
      // everyday button is 48px (`13px 24px` around 16px/1.2 text in the
      // reference), which already clears the touch minimum, so there is no
      // dense desktop variant to shrink to and no responsive override to get
      // wrong. `sm` is the 36px control the filter chips and row actions wear.
      size: {
        default:
          "h-12 gap-2 px-6 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-7 gap-1 px-3 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-9 gap-1.5 px-4 text-sm has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-4",
        lg: "h-14 gap-2 px-8 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-12",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-9 [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-14 [&_svg:not([class*='size-'])]:size-5",
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
