"use client"

import { motion, type HTMLMotionProps } from "framer-motion"
import { stagger } from "@/lib/motion"
import { cn } from "@/lib/utils"

export function StaggerContainer({
  className,
  children,
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={stagger.container}
      initial="hidden"
      animate="show"
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  className,
  children,
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <motion.div variants={stagger.item} className={cn(className)} {...props}>
      {children}
    </motion.div>
  )
}
