import { type ComponentPropsWithoutRef, forwardRef } from "react"
import { type VariantProps, tv } from "tailwind-variants"

const button = tv({
  base: "flex-shrink-0",
  variants: {
    variant: {
      secondary: [
        "flex h-8 flex-row items-center justify-center rounded-md border border-zinc-200 bg-white px-2 transition-colors duration-100 text-sm",
        "hover:bg-zinc-100",
        "focus:outline-none focus-visible:border-blue-400 focus-visible:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-blue-200",
        "dark:bg-zinc-900 dark:border-zinc-700",
        "dark:hover:bg-zinc-800",
        "dark:focus-visible:bg-zinc-800 dark:focus-visible:ring-blue-200/50",
      ],
      tertiary: [
        "flex px-2.5 items-center justify-center rounded-md border border-transparent text-zinc-400 transition-colors duration-100 text-sm h-7",
        "hover:bg-zinc-100",
        "focus:outline-none focus-visible:border-blue-400 focus-visible:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-blue-200",
        "dark:text-zinc-500",
        "dark:hover:bg-zinc-700",
        "dark:focus-visible:bg-zinc-700 dark:focus-visible:ring-blue-200/50",
      ],
    },
  },
  defaultVariants: {
    variant: "secondary",
  },
})

interface Props
  extends ComponentPropsWithoutRef<"button">,
    VariantProps<typeof button> {}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant, className, ...props }, ref) => {
    return (
      <button ref={ref} className={button({ variant, className })} {...props} />
    )
  },
)
