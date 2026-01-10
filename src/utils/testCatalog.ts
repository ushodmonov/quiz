import type { Question } from '../types'

export interface TestCatalogItem {
  id: string
  name: string
  fileName: string
  description?: string
}

export interface TestCatalog {
  tests: TestCatalogItem[]
}

/**
 * Get base URL for assets (handles GitHub Pages subdirectory)
 */
function getBaseUrl(): string {
  // Vite provides BASE_URL which includes the base path
  // For GitHub Pages: if base is '/quiz/', BASE_URL will be '/quiz/'
  // For local dev: BASE_URL will be '/'
  const baseUrl = import.meta.env.BASE_URL || '/'
  // Ensure baseUrl ends with '/' for proper path joining
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
}

/**
 * Load test catalog from JSON file
 */
export async function loadTestCatalog(): Promise<TestCatalog> {
  try {
    const baseUrl = getBaseUrl()
    const response = await fetch(`${baseUrl}assets/test-catalog.json`)
    if (!response.ok) {
      return { tests: [] }
    }
    const data = await response.json()
    return data as TestCatalog
  } catch (error) {
    console.error('Failed to load test catalog:', error)
    return { tests: [] }
  }
}

/**
 * Load questions from a test file in assets
 */
export async function loadTestQuestions(fileName: string): Promise<Question[]> {
  try {
    const baseUrl = getBaseUrl()
    const response = await fetch(`${baseUrl}assets/${fileName}`)
    if (!response.ok) {
      throw new Error(`Failed to load file: ${fileName}`)
    }
    
    // Check file extension
    if (fileName.toLowerCase().endsWith('.txt')) {
      const text = await response.text()
      const { parseTxtFile } = await import('./fileParser')
      return parseTxtFile(text)
    } else if (fileName.toLowerCase().endsWith('.docx')) {
      const arrayBuffer = await response.arrayBuffer()
      // Use mammoth directly with arrayBuffer
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ arrayBuffer })
      const { parseTxtFile } = await import('./fileParser')
      return parseTxtFile(result.value)
    } else {
      throw new Error(`Unsupported file format: ${fileName}`)
    }
  } catch (error) {
    console.error('Failed to load test questions:', error)
    throw error
  }
}

/**
 * Generate test catalog from DOCX files in assets
 * This function should be run once to create the catalog
 */
export async function generateTestCatalog(): Promise<TestCatalogItem[]> {
  // This would be run as a build script or admin function
  // For now, return empty array - catalog should be manually created
  return []
}
