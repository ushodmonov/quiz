declare module 'mammoth' {
  export interface ExtractRawTextOptions {
    arrayBuffer: ArrayBuffer
  }

  export interface ExtractRawTextResult {
    value: string
  }

  export interface ConvertToHtmlOptions {
    arrayBuffer: ArrayBuffer
  }

  export interface ConvertToHtmlResult {
    value: string
  }

  export function extractRawText(options: ExtractRawTextOptions): Promise<ExtractRawTextResult>
  export function convertToHtml(options: ConvertToHtmlOptions): Promise<ConvertToHtmlResult>
}
