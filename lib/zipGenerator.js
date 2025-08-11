/* EXPORTS: generateZipFromJson, createFileStructure, downloadZip, generateZipFile */

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Main function expected by index.js - generates and downloads ZIP file
 * @param {Object} parsedStructure - The parsed structure from parseJsonStructure
 * @param {string} jsonInput - Original JSON input string
 * @param {string} filename - Optional filename for the ZIP
 */
export async function generateZipFile(parsedStructure, jsonInput, filename = 'converted-json.zip') {
  try {
    // Parse the original JSON to get the raw data
    const jsonData = JSON.parse(jsonInput);
    
    // Generate the ZIP blob using existing function
    const zipBlob = await generateZipFromJson(jsonData, 'project', {
      includeMetadata: true,
      createReadme: true,
      timestampFiles: false
    });
    
    // Download the ZIP file
    downloadZip(zipBlob, filename);
    
  } catch (error) {
    console.error('Error generating ZIP file:', error);
    throw new Error(`Failed to generate ZIP: ${error.message}`);
  }
}

/**
 * Generates a ZIP file from a JSON structure
 * @param {Object} jsonData - The JSON data to convert to ZIP
 * @param {string} rootName - Name for the root folder
 * @param {Object} options - Configuration options
 * @returns {Promise<Blob>} - The generated ZIP blob
 */
export async function generateZipFromJson(jsonData, rootName = 'output', options = {}) {
  const zip = new JSZip();
  const config = {
    includeMetadata: true,
    fileExtension: '.json',
    createReadme: true,
    timestampFiles: false,
    ...options
  };

  // Create root folder
  const rootFolder = zip.folder(rootName);

  // Process the JSON structure
  await processJsonNode(rootFolder, jsonData, '', config);

  // Add README if requested
  if (config.createReadme) {
    const readmeContent = generateReadmeContent(jsonData, rootName);
    rootFolder.file('README.md', readmeContent);
  }

  // Add metadata file if requested
  if (config.includeMetadata) {
    const metadata = generateMetadata(jsonData, rootName);
    rootFolder.file('_metadata.json', JSON.stringify(metadata, null, 2));
  }

  // Generate the ZIP blob
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  return zipBlob;
}

/**
 * Recursively processes JSON nodes to create file structure
 */
async function processJsonNode(folder, data, path, config) {
  if (data === null || data === undefined) {
    folder.file(sanitizeFileName(`null${getSmartFileExtension(data)}`), 'null');
    return;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      folder.file('empty_array.json', '[]');
      return;
    }
    for (let i = 0; i < data.length; i++) {
      const itemName = `item_${i.toString().padStart(3, '0')}`;
      if (typeof data[i] === 'object' && data[i] !== null) {
        const subFolder = folder.folder(itemName);
        await processJsonNode(subFolder, data[i], `${path}/${itemName}`, config);
      } else {
        const ext = getSmartFileExtension(data[i]);
        folder.file(
          sanitizeFileName(`${itemName}${ext}`),
          typeof data[i] === 'string' ? data[i] : JSON.stringify(data[i], null, 2)
        );
      }
    }
  } else if (typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 0) {
      folder.file('empty_object.json', '{}');
      return;
    }
    for (const key of keys) {
      const sanitizedKey = sanitizeFileName(key);
      const value = data[key];
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value) || Object.keys(value).length > 0) {
          const subFolder = folder.folder(sanitizedKey);
          await processJsonNode(subFolder, value, `${path}/${sanitizedKey}`, config);
        } else {
          folder.file(`${sanitizedKey}.json`, JSON.stringify(value, null, 2));
        }
      } else {
        const content = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
        const ext = getSmartFileExtension(value);
        
        if (config.timestampFiles) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          folder.file(`${sanitizedKey}_${timestamp}${ext}`, content);
        } else {
          folder.file(`${sanitizedKey}${ext}`, content);
        }
      }
    }
  } else {
    const ext = getSmartFileExtension(data);
    folder.file(
      sanitizeFileName(`value${ext}`),
      typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    );
  }
}

/**
 * Smart file extension detection based on content
 * @param {any} value - The value to analyze
 * @returns {string} - Appropriate file extension
 */
function getSmartFileExtension(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    // Check for HTML
    if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
      return '.html';
    }
    
    // Check for CSS
    if (trimmed.includes('{') && trimmed.includes('}') && trimmed.includes(':')) {
      return '.css';
    }
    
    // Check for JavaScript
    if (trimmed.includes('function') || trimmed.includes('=>') || 
        trimmed.includes('const ') || trimmed.includes('let ') || 
        trimmed.includes('var ') || trimmed.includes('import ')) {
      return '.js';
    }
    
    // Check for JSON
    try {
      JSON.parse(value);
      return '.json';
    } catch {
      // Not JSON, check for other formats
    }
    
    // Check for Markdown
    if (trimmed.includes('#') || trimmed.includes('**') || trimmed.includes('##')) {
      return '.md';
    }
    
    // Default to .txt for strings
    return '.txt';
  }
  
  // Non-strings default to .json
  return '.json';
}

/** Sanitize file names */
function sanitizeFileName(fileName) {
  return fileName
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 255);
}

/** Generate README content */
function generateReadmeContent(jsonData, rootName) {
  const stats = analyzeJsonStructure(jsonData);
  const timestamp = new Date().toISOString();
  return `# ${rootName}

Generated from JSON structure on ${timestamp}

## Structure Overview
- **Total Objects**: ${stats.objectCount}
- **Total Arrays**: ${stats.arrayCount}
- **Total Files**: ${stats.fileCount}
- **Max Depth**: ${stats.maxDepth}

## File Organization
- Objects become folders
- Arrays become numbered item folders
- Primitive values become individual files with smart extensions
- Empty objects/arrays are preserved as special files

## Smart File Extensions
- JavaScript code → .js
- HTML content → .html
- CSS styles → .css
- JSON data → .json
- Markdown → .md
- Other text → .txt

Generated by JSON to ZIP Converter`;
}

/** Generate metadata */
function generateMetadata(jsonData, rootName) {
  const stats = analyzeJsonStructure(jsonData);
  return {
    generatedAt: new Date().toISOString(),
    rootName,
    originalSize: JSON.stringify(jsonData).length,
    statistics: stats,
    version: '1.0.0',
    features: {
      smartExtensions: true,
      sanitizedNames: true,
      structurePreservation: true
    }
  };
}

/** Analyze JSON structure */
function analyzeJsonStructure(data, depth = 0) {
  const stats = { objectCount: 0, arrayCount: 0, fileCount: 0, maxDepth: depth };
  
  if (Array.isArray(data)) {
    stats.arrayCount = 1;
    data.forEach(item => {
      const sub = analyzeJsonStructure(item, depth + 1);
      stats.objectCount += sub.objectCount;
      stats.arrayCount += sub.arrayCount;
      stats.fileCount += sub.fileCount;
      stats.maxDepth = Math.max(stats.maxDepth, sub.maxDepth);
    });
  } else if (typeof data === 'object' && data !== null) {
    stats.objectCount = 1;
    Object.values(data).forEach(v => {
      const sub = analyzeJsonStructure(v, depth + 1);
      stats.objectCount += sub.objectCount;
      stats.arrayCount += sub.arrayCount;
      stats.fileCount += sub.fileCount;
      stats.maxDepth = Math.max(stats.maxDepth, sub.maxDepth);
    });
  } else {
    stats.fileCount = 1;
  }
  
  return stats;
}

/** Create file structure preview */
export function createFileStructure(data, name = 'root', depth = 0) {
  const node = { name: sanitizeFileName(name), type: 'folder', children: [], depth };
  
  if (Array.isArray(data)) {
    if (data.length === 0) {
      node.children.push({ name: 'empty_array.json', type: 'file', depth: depth + 1 });
    } else {
      data.forEach((item, index) => {
        const itemName = `item_${index.toString().padStart(3, '0')}`;
        if (typeof item === 'object' && item !== null) {
          node.children.push(createFileStructure(item, itemName, depth + 1));
        } else {
          const ext = getSmartFileExtension(item);
          node.children.push({ name: `${itemName}${ext}`, type: 'file', depth: depth + 1 });
        }
      });
    }
  } else if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data);
    if (keys.length === 0) {
      node.children.push({ name: 'empty_object.json', type: 'file', depth: depth + 1 });
    } else {
      keys.forEach(key => {
        const value = data[key];
        const sanitizedKey = sanitizeFileName(key);
        if (typeof value === 'object' && value !== null) {
          node.children.push(createFileStructure(value, sanitizedKey, depth + 1));
        } else {
          const ext = getSmartFileExtension(value);
          node.children.push({ name: `${sanitizedKey}${ext}`, type: 'file', depth: depth + 1 });
        }
      });
    }
  } else {
    node.type = 'file';
    const ext = getSmartFileExtension(data);
    node.name = `${name}${ext}`;
  }
  
  return node;
}

/** Download the ZIP */
export function downloadZip(zipBlob, filename = 'converted-json.zip') {
  saveAs(zipBlob, filename);
}
