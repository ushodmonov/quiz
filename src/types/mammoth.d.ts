declare module 'mammoth' {
  export interface ExtractRawTextOptions {
    arrayBuffer: ArrayBuffer
  }

  export interface ExtractRawTextResult {
    value: string
  }

  export function extractRawText(options: ExtractRawTextOptions): Promise<ExtractRawTextResult>
}
