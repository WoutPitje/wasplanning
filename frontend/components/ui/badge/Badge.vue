<template>
  <div :class="cn(badgeVariants({ variant }), className)" v-bind="$attrs">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success:
          'border-transparent bg-success text-success-foreground hover:bg-success/80',
        warning:
          'border-transparent bg-warning text-warning-foreground hover:bg-warning/80',
        info:
          'border-transparent bg-info text-info-foreground hover:bg-info/80',
        brand:
          'border-transparent bg-brand text-white hover:bg-brand-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

interface BadgeProps {
  variant?: VariantProps<typeof badgeVariants>['variant']
  className?: string
}

withDefaults(defineProps<BadgeProps>(), {
  variant: 'default'
})
</script>