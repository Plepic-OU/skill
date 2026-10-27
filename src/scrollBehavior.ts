// 'auto' still follows the stylesheet's scroll-behavior, which index.css resets for reduced motion.
export function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}
