import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Generate test catalog from DOCX files in assets folder
 */
function generateTestCatalog() {
  const assetsDir = path.join(__dirname, '../public/assets')
  const catalogPath = path.join(assetsDir, 'test-catalog.json')

  // Read all files in assets directory
  const files = fs.readdirSync(assetsDir)
  
  // Filter only DOCX files
  const docxFiles = files.filter(file => file.toLowerCase().endsWith('.docx'))
  
  // Generate catalog items
  const tests = docxFiles.map((fileName, index) => {
    // Generate ID from filename (remove extension, replace spaces/special chars with hyphens, lowercase)
    const id = fileName
      .replace(/\.docx$/i, '')
      .replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
    
    // Generate name from filename (remove extension, replace underscores/hyphens with spaces, capitalize)
    const name = fileName
      .replace(/\.docx$/i, '')
      .replace(/[_-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
    
    return {
      id: id || `test-${index + 1}`,
      name: name || `Test ${index + 1}`,
      fileName: fileName,
      description: ''
    }
  })

  const catalog = {
    tests: tests
  }

  // Write catalog to JSON file
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8')
  
  console.log(`✅ Test catalog generated successfully!`)
  console.log(`📁 Found ${tests.length} DOCX file(s):`)
  tests.forEach((test, index) => {
    console.log(`   ${index + 1}. ${test.name} (${test.fileName})`)
  })
  console.log(`\n📝 Catalog saved to: ${catalogPath}`)
  console.log(`\n💡 Tip: You can manually edit the catalog to add descriptions.`)
}

// Run if called directly
try {
  generateTestCatalog()
} catch (error) {
  console.error('❌ Error generating catalog:', error.message)
  process.exit(1)
}
