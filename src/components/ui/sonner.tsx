"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useTheme } from "@/components/theme/theme-provider"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

// Colors come from tokens via CSS variables; sonner's own theme prop follows the
// chosen preference (light / dark / system).
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()
  return (
    <Sonner
      theme={theme}
      position="top-center"
      className="toaster group"
      mobileOffset={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
      icons={{
        success: <CircleCheckIcon className="size-5" />,
        info: <InfoIcon className="size-5" />,
        warning: <TriangleAlertIcon className="size-5" />,
        error: <OctagonXIcon className="size-5" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--surface)",
          "--normal-text": "var(--text)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "!shadow-soft !text-base !font-sans",
          title: "!font-bold",
          icon: "!text-primary",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
