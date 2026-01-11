import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Extract metadata from filename
 * Examples:
 * - tibbiy_kimyo_1_1.docx -> { subject: "Tibbiy kimyo", semester: 1, courses: 1 }
 * - gistologiya_2_1_2025_2026 -> { subject: "Gistologiya", semester: 2, courses: 1, years: "2025-2026" }
 * - odam_anatomiyasi_1_1 -> { subject: "Odam anatomiya", semester: 1, courses: 1 }
 */
function extractMetadata(fileName, folderName = '') {
  const baseName = fileName.replace(/\.(docx|txt)$/i, '')
  let source = folderName || baseName
  
  // Remove "ttdu_" prefix from the beginning (case insensitive)
  source = source.replace(/^ttdu[_\-]/i, '')
  
  // Split by underscore, hyphen, or space
  const parts = source.split(/[_\-\s]+/).filter(p => p)
  
  let subjectParts = []
  let semester = null
  let courses = null
  let years = null
  const yearParts = []
  
  // Process parts
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const num = parseInt(part)
    
    if (!isNaN(num)) {
      // Check if it's a year (4 digits)
      if (part.length === 4 && num >= 2000 && num <= 2100) {
        yearParts.push(part)
      } else {
        // First number is usually semester, second is courses
        if (semester === null) {
          semester = num
        } else if (courses === null && num < 10) {
          courses = num
        }
      }
    } else {
      // It's part of subject name
      // Skip common prefixes like "ttdu"
      if (semester === null && courses === null && yearParts.length === 0) {
        const lowerPart = part.toLowerCase()
        if (lowerPart !== 'ttdu' && lowerPart !== 'test') {
          subjectParts.push(part)
        }
      }
    }
  }
  
  // Format years
  if (yearParts.length >= 2) {
    years = `${yearParts[0]}-${yearParts[1]}`
  } else if (yearParts.length === 1) {
    years = yearParts[0]
  }
  
  // Format subject (capitalize first letter of each word)
  let subject = subjectParts
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
  
  // Clean up common variations
  subject = subject
    .replace(/anatomiyasi/i, 'anatomiya')
    .replace(/kimyo/i, 'kimyo')
    .replace(/gistologiya/i, 'Gistologiya')
  
  return { subject, semester, courses, years }
}

/**
 * Generate test catalog from DOCX and TXT files in assets folder
 */
function generateTestCatalog() {
  const assetsDir = path.join(__dirname, '../public/assets')
  const catalogPath = path.join(assetsDir, 'test-catalog.json')

  const tests = []
  
  // Read all files and folders in assets directory
  const items = fs.readdirSync(assetsDir, { withFileTypes: true })
  
  for (const item of items) {
    // Skip test-catalog.json itself
    if (item.name === 'test-catalog.json') continue
    
    const itemPath = path.join(assetsDir, item.name)
    
    if (item.isDirectory()) {
      // Handle subdirectories (like gistologiya_2_1_2025_2026)
      const subFiles = fs.readdirSync(itemPath)
      const subTests = []
      
      for (const subFile of subFiles) {
        if (subFile.toLowerCase().endsWith('.docx') || subFile.toLowerCase().endsWith('.txt')) {
          const subTestItem = {
            name: subFile, // Use full file name
            path: `${item.name}/${subFile}`
          }
          
          subTests.push(subTestItem)
        }
      }
      
      if (subTests.length > 0) {
        const folderMetadata = extractMetadata(item.name)
        const name = folderMetadata.years 
          ? `${folderMetadata.subject}(${folderMetadata.years})`
          : folderMetadata.subject || item.name.replace(/[_-]/g, ' ')
        
        const testItem = {
          name: name,
          semester: folderMetadata.semester,
          years: folderMetadata.years,
          subject: folderMetadata.subject,
          courses: folderMetadata.courses,
          institute: 'TTDU',
          sub_catologs: subTests
        }
        
        // Remove null/undefined values
        Object.keys(testItem).forEach(key => {
          if (testItem[key] === null || testItem[key] === undefined) {
            delete testItem[key]
          }
        })
        
        tests.push(testItem)
      }
    } else if (item.isFile()) {
      // Handle files directly in assets folder
      if (item.name.toLowerCase().endsWith('.docx') || item.name.toLowerCase().endsWith('.txt')) {
        const metadata = extractMetadata(item.name)
        const name = metadata.years 
          ? `${metadata.subject}(${metadata.years})`
          : metadata.subject || item.name.replace(/\.(docx|txt)$/i, '').replace(/[_-]/g, ' ')
        
        const testItem = {
          name: name,
          path: item.name,
          semester: metadata.semester,
          years: metadata.years,
          subject: metadata.subject,
          courses: metadata.courses,
          institute: 'TTDU'
        }
        
        // Remove null/undefined values
        Object.keys(testItem).forEach(key => {
          if (testItem[key] === null || testItem[key] === undefined) {
            delete testItem[key]
          }
        })
        
        tests.push(testItem)
      }
    }
  }

  const catalog = {
    tests: tests
  }

  // Write catalog to JSON file
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8')
  
  console.log(`✅ Test catalog generated successfully!`)
  console.log(`📁 Found ${tests.length} test(s):`)
  tests.forEach((test, index) => {
    if (test.sub_catologs && test.sub_catologs.length > 0) {
      console.log(`   ${index + 1}. ${test.subject || test.name} (${test.sub_catologs.length} sub-tests)`)
    } else {
      console.log(`   ${index + 1}. ${test.subject || test.name} (${test.path})`)
    }
  })
  console.log(`\n📝 Catalog saved to: ${catalogPath}`)
  console.log(`\n💡 Tip: You can manually edit the catalog to add more details.`)
}

// Run if called directly
try {
  generateTestCatalog()
} catch (error) {
  console.error('❌ Error generating catalog:', error.message)
  process.exit(1)
}
