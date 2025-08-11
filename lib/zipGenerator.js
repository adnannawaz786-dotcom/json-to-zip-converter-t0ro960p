/* EXPORTS: generateZipFromJson, createFileStructure, downloadZip */

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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
    compressionOptions: {
      level: 6
    }
  });

  return zipBlob;
}

/**
 * Recursively processes JSON nodes to create file structure
 * @param {JSZip} folder - Current folder context
 * @param {any} data - Data to process
 * @param {string} path - Current path
 * @param {Object} config - Configuration options
 */
async function processJsonNode(folder, data, path, config) {
  if (data === null || data === undefined) {
    const fileName = sanitizeFileName(`null${config.fileExtension}`);
    folder.file(fileName, 'null');
    return;
  }

  if (Array.isArray(data)) {
    // Handle arrays
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
        const fileName = sanitizeFileName(`${itemName}${config.fileExtension}`);
        const content = typeof data[i] === 'string' ? data[i] : JSON.stringify(data[i], null, 2);
        folder.file(fileName, content);
      }
    }
  } else if (typeof data === 'object') {
    // Handle objects
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
          const fileName = sanitizeFileName(`${sanitizedKey}${config.fileExtension}`);
          folder.file(fileName, JSON.stringify(value, null, 2));
        }
      } else {
        const fileName = sanitizeFileName(`${sanitizedKey}${config.fileExtension}`);
        const content = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
        
        if (config.timestampFiles) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const fileNameWithTimestamp = fileName.replace(config.fileExtension, `_${timestamp}${config.fileExtension}`);
          folder.file(fileNameWithTimestamp, content);
        } else {
          folder.file(fileName, content);
        }
      }
    }
  } else {
    // Handle primitive values
    const fileName = sanitizeFileName(`value${config.fileExtension}`);
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    folder.file(fileName, content);
  }
}

/**
 * Sanitizes file names to be filesystem-safe
 * @param {string} fileName - Original file name
 * @returns {string} - Sanitized file name
 */
function sanitizeFileName(fileName) {
  return fileName
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .substring(0, 255); // Limit length
}

/**
 * Generates README content for the ZIP file
 * @param {Object} jsonData - Original JSON data
 * @param {string} rootName - Root folder name
 * @returns {string} - README content
 */
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
This ZIP contains a hierarchical representation of the original JSON structure:
- Objects become folders
- Arrays become numbered item folders
- Primitive values become individual files
- Empty objects/arrays are preserved as special files

## Notes
- File names have been sanitized for filesystem compatibility
- Complex nested structures maintain their original hierarchy
- Metadata is preserved in _metadata.json

Generated by JSON to ZIP Converter
`;
}

/**
 * Generates metadata for the conversion
 * @param {Object} jsonData - Original JSON data
 * @param {string} rootName - Root folder name
 * @returns {Object} - Metadata object
 */
function generateMetadata(jsonData, rootName) {
  const stats = analyzeJsonStructure(jsonData);
  
  return {
    generatedAt: new Date().toISOString(),
    rootName,
    originalSize: JSON.stringify(jsonData).length,
    statistics: stats,
    version: '1.0.0'
  };
}

/**
 * Analyzes JSON structure to provide statistics
 * @param {any} data - JSON data to analyze
 * @param {number} depth - Current depth level
 * @returns {Object} - Structure statistics
 */
function analyzeJsonStructure(data, depth = 0) {
  const stats = {
    objectCount: 0,
    arrayCount: 0,
    fileCount: 0,
    maxDepth: depth
  };

  if (Array.isArray(data)) {
    stats.arrayCount = 1;
    data.forEach(item => {
      const subStats = analyzeJsonStructure(item, depth + 1);
      stats.objectCount += subStats.objectCount;
      stats.arrayCount += subStats.arrayCount;
      stats.fileCount += subStats.fileCount;
      stats.maxDepth = Math.max(stats.maxDepth, subStats.maxDepth);
    });
  } else if (typeof data === 'object' && data !== null) {
    stats.objectCount = 1;
    Object.values(data).forEach(value => {
      const subStats = analyzeJsonStructure(value, depth + 1);
      stats.objectCount += subStats.objectCount;
      stats.arrayCount += subStats.arrayCount;
      stats.fileCount += subStats.fileCount;
      stats.maxDepth = Math.max(stats.maxDepth, subStats.maxDepth);
    });
  } else {
    stats.fileCount = 1;
  }

  return stats;
}

/**
 * Creates a file structure preview from JSON
 * @param {any} data - JSON data
 * @param {string} name - Current node name
 * @param {number} depth - Current depth
 * @returns {Object} - Tree structure for preview
 */
export function createFileStructure(data, name = 'root', depth = 0) {
  const node = {
    name: sanitizeFileName(name),
    type: 'folder',
    children: [],
    depth
  };

  if (Array.isArray(data)) {
    if (data.length === 0) {
      node.children.push({
        name: 'empty_array.json',
        type: 'file',
        depth: depth + 1
      });
    } else {
      data.forEach((item, index) => {
        const itemName = `item_${index.toString().padStart(3, '0')}`;
        if (typeof item === 'object' && item !== null) {
          node.children.push(createFileStructure(item, itemName, depth + 1));
        } else {
          node.children.push({
            name: `${itemName}.json`,
            type: 'file',
            depth: depth + 1
          });
        }
      });
    }
  } else if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data);
    if (keys.length === 0) {
      node.children.push({
        name: 'empty_object.json',
        type: 'file',
        depth: depth + 1
      });
    } else {
      keys.forEach(key => {
        const value = data[key];
        const sanitizedKey = sanitizeFileName(key);
        
        if (typeof value === 'object' && value !== null) {
          node.children.push(createFileStructure(value, sanitizedKey, depth + 1));
        } else {
          node.children.push({
            name: `${sanitizedKey}.json`,
            type: 'file',
            depth: depth + 1
          });
        }
      });
    }
  } else {
    node.type = 'file';
    node.name = `${name}.json`;
  }

  return node;
}

/**
 * Downloads the ZIP file with a given filename
 * @param {Blob} zipBlob - The ZIP blob to download
 * @param {string} filename - Desired filename
 */
export function downloadZip(zipBlob, filename = 'converted-json.zip') {
  saveAs(zipBlob, filename);
}

async function generateZipFromJson(...) { … }
function createFileStructure(...) { … }
function downloadZip(...) { … }

export { generateZipFromJson, createFileStructure, downloadZip };
