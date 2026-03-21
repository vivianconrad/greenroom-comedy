import { cn } from '@/lib/utils'

const presetVariants = {
  success: 'bg-sage-bg text-green',
  warning: 'bg-amber-bg text-amber',
  danger: 'bg-red-bg text-red',
  info: 'bg-lav-bg text-lav',
  neutral: 'bg-cream text-soft',
}

function Pill({
  variant = 'neutral',
  bg,
  color,
  className,
  children,
  ...props
}) {
  const inlineStyle = bg || color ? { backgroundColor: bg, color } : undefined
  const variantClass = !bg && !color ? presetVariants[variant] : ''

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-body',
        variantClass,
        className
      )}
      style={inlineStyle}
      {...props}
    >
      {children}
    </span>
  )
}

export { Pill }
