import { Slot } from "@radix-ui/react-slot"
import { type ComponentPropsWithoutRef, forwardRef } from "react"
import { cn } from "./cn"

interface LinkBoxProps extends ComponentPropsWithoutRef<"div"> {
  asChild?: boolean
}

export const LinkBox = forwardRef<HTMLDivElement, LinkBoxProps>(
  ({ asChild, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "div"

    return (
      <Comp
        className={cn(
          "relative [&_a[href]:not(.linkoverlay)]:relative [&_a[href]:not(.linkoverlay)]:z-1",
          /**
           * Safari doesn't support relative position of tr elements
           * @see https://mtsknn.fi/blog/relative-tr-in-safari/
           */
          "[&:is(tr)]:translate-x-0 [&:is(tr)]:translate-y-0 [&:is(tr)]:[clip-path:inset(0)]",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)

LinkBox.displayName = "LinkBox"

interface LinkOverlayProps extends ComponentPropsWithoutRef<"a"> {
  asChild?: boolean
}

export const LinkOverlay = forwardRef<HTMLAnchorElement, LinkOverlayProps>(
  ({ asChild, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "a"

    return (
      <Comp
        className={cn(
          "linkoverlay static before:absolute before:top-0 before:left-0 before:z-0 before:block before:h-full before:w-full before:cursor-inherit before:content-['']",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)

LinkOverlay.displayName = "LinkOverlay"
