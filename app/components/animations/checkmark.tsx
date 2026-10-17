"use client"

import animation from "react-useanimations/lib/checkmark"

import { UseAnimation, type UseAnimationProps } from "~/components/use-animation"

// "Checkmark" from https://useanimations.com (MIT): https://useanimations.com/icons/checkmark
export function AnimatedCheckmark(
  props: Omit<UseAnimationProps, "animationData">
) {
  return (
    <UseAnimation
      animationData={animation.animationData}
      interaction="loop"
      {...props}
    />
  )
}
