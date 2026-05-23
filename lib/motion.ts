export const springSnappy = { type: "spring" as const, stiffness: 400, damping: 30 }
export const springSmooth = { type: "spring" as const, stiffness: 260, damping: 28 }
export const springGentle = { type: "spring" as const, stiffness: 120, damping: 20 }
export const easeOut = [0.16, 1, 0.3, 1] as const

export const stagger = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.08 },
    },
  },
  item: {
    hidden: { opacity: 0, y: 16, filter: "blur(8px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.5, ease: easeOut },
    },
  },
}
