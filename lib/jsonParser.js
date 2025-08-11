/* EXPORTS: parseJsonInput, generateTreeStructure, validateJsonStructure, TreeNode, flattenTreeToFiles, getTreeStatistics */

/**
 * Parses JSON input and validates structure
 * @param {string} jsonString - Raw JSON string input
 * @returns {Object} - Parsed JSON object with validation results
 */
function parseJsonInput(jsonString) {
  try {
    if (!jsonString || jsonString.trim() === '') {
      return {
        success: false,
        error: 'JSON input cannot be empty',
        data: null
      };
    }

    const parsed = JSON.parse(jsonString);
    
    if (parsed === null || parsed === undefined) {
      return {
        success: false,
        error: 'JSON cannot be null or undefined',
        data: null
      };
    }

    return {
      success: true,
      error: null,
      data: parsed
    };
  } catch (error) {
    return {
      success: false,
      error: `Invalid JSON: ${error.message}`,
      data: null
    };
  }
}

/**
 * Validates JSON structure for file conversion
 * @param {any} jsonData - Parsed JSON data
 * @returns {Object} - Validation results
 */
function validateJsonStructure(jsonData) {
  const errors = [];
  const warnings = [];

  if (typeof jsonData !== 'object' || jsonData === null) {
    errors.push('Root element must be an object or array');
  }

  // Check for circular references
  try {
    JSON.stringify(jsonData);
  } catch (error) {
    if (error.message.includes('circular')) {
      errors.push('JSON contains circular references');
    }
  }

  // Validate file names and paths
  function validateKeys(obj, path = '') {
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        const currentPath = path ? `${path}/${key}` : key;
        
        // Check for invalid file name characters
        const invalidChars = /[<>:"|?*\x00-\x1f]/;
        if (invalidChars.test(key)) {
          warnings.push(`Invalid characters in key "${key}" at path "${currentPath}"`);
        }

        // Check for reserved names
        const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
        if (reservedNames.includes(key.toUpperCase())) {
          warnings.push(`Reserved system name "${key}" at path "${currentPath}"`);
        }

        // Recursively validate nested objects
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          validateKeys(obj[key], currentPath);
        }
      });
    }
  }

  if (typeof jsonData === 'object' && jsonData !== null) {
    validateKeys(jsonData);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasWarnings: warnings.length > 0
  };
}

/**
 * Tree node structure for file explorer display
 */
class TreeNode {
  constructor(name, type, value = null, children = []) {
    this.name = name;
    this.type = type; // 'file' or 'folder'
    this.value = value;
    this.children = children;
    this.isExpanded = true;
    this.id = Math.random().toString(36).substring(2, 9);
  }

  addChild(child) {
    this.children.push(child);
  }

  getFileCount() {
    if (this.type === 'file') return 1;
    return this.children.reduce((count, child) => count + child.getFileCount(), 0);
  }

  getFolderCount() {
    let count = this.type === 'folder' ? 1 : 0;
    return this.children.reduce((total, child) => total + child.getFolderCount(), count);
  }
}

/**
 * Generates tree structure from JSON data for preview
 * @param {any} jsonData - Parsed JSON data
 * @param {string} rootName - Name for root node
 * @returns {TreeNode} - Tree structure for display
 */
function generateTreeStructure(jsonData, rootName = 'root') {
  function createTreeNode(data, name, parentPath = '') {
    const currentPath = parentPath ? `${parentPath}/${name}` : name;
    
    if (data === null || data === undefined) {
      return new TreeNode(name, 'file', 'null');
    }

    if (typeof data === 'object' && !Array.isArray(data)) {
      const folderNode = new TreeNode(name, 'folder');
      
      Object.entries(data).forEach(([key, value]) => {
        const childNode = createTreeNode(value, key, currentPath);
        folderNode.addChild(childNode);
      });
      
      return folderNode;
    }

    if (Array.isArray(data)) {
      const folderNode = new TreeNode(name, 'folder');
      
      data.forEach((item, index) => {
        const itemName = `item_${index}`;
        const childNode = createTreeNode(item, itemName, currentPath);
        folderNode.addChild(childNode);
      });
      
      return folderNode;
    }

    // Primitive values become files
    const fileExtension = getFileExtension(data);
    const fileName = `${name}${fileExtension}`;
    return new TreeNode(fileName, 'file', data);
  }

  return createTreeNode(jsonData, rootName);
}

/**
 * Determines appropriate file extension based on data type
 * @param {any} value - The value to determine extension for
 * @returns {string} - File extension
 */
function getFileExtension(value) {
  if (typeof value === 'string') {
    // Check if string looks like JSON
    try {
      JSON.parse(value);
      return '.json';
    } catch {
      // Check if string looks like HTML
      if (value.trim().startsWith('<') && value.trim().endsWith('>')) {
        return '.html';
      }
      // Check if string looks like CSS
      if (value.includes('{') && value.includes('}') && value.includes(':')) {
        return '.css';
      }
      // Check if string looks like JavaScript
      if (value.includes('function') || value.includes('=>') || value.includes('var ') || value.includes('const ')) {
        return '.js';
      }
      return '.txt';
    }
  }
  
  if (typeof value === 'number') {
    return '.txt';
  }
  
  if (typeof value === 'boolean') {
    return '.txt';
  }
  
  return '.json';
}

/**
 * Flattens tree structure for ZIP file creation
 * @param {TreeNode} treeNode - Root tree node
 * @param {string} basePath - Base path for files
 * @returns {Array} - Array of file objects with path and content
 */
function flattenTreeToFiles(treeNode, basePath = '') {
  const files = [];
  
  function traverse(node, currentPath) {
    const fullPath = currentPath ? `${currentPath}/${node.name}` : node.name;
    
    if (node.type === 'file') {
      files.push({
        path: fullPath,
        content: node.value !== null ? String(node.value) : '',
        size: String(node.value || '').length
      });
    } else {
      // For folders, traverse children
      node.children.forEach(child => {
        traverse(child, fullPath);
      });
    }
  }
  
  traverse(treeNode, basePath);
  return files;
}

/**
 * Gets statistics about the tree structure
 * @param {TreeNode} treeNode - Root tree node
 * @returns {Object} - Statistics object
 */
function getTreeStatistics(treeNode) {
  const stats = {
    totalFiles: 0,
    totalFolders: 0,
    maxDepth: 0,
    totalSize: 0
  };
  
  function calculateStats(node, depth = 0) {
    stats.maxDepth = Math.max(stats.maxDepth, depth);
    
    if (node.type === 'file') {
      stats.totalFiles++;
      stats.totalSize += String(node.value || '').length;
    } else {
      stats.totalFolders++;
      node.children.forEach(child => {
        calculateStats(child, depth + 1);
      });
    }
  }
  
  calculateStats(treeNode);
  return stats;
}

export { parseJsonInput, generateTreeStructure, validateJsonStructure, TreeNode, flattenTreeToFiles, getTreeStatistics };