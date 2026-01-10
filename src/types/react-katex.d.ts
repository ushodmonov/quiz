declare module 'react-katex' {
  import { ComponentType } from 'react'

  interface InlineMathProps {
    math: string
  }

  interface BlockMathProps {
    math: string
  }

  export const InlineMath: ComponentType<InlineMathProps>
  export const BlockMath: ComponentType<BlockMathProps>
}
