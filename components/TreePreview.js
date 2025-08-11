/* EXPORTS: TreePreview (default) */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';

const TreePreview = ({ jsonData, onToggleExpand, expandedNodes = new Set() }) => {
  const parseJsonToTree = (data, path = '') => {
    const nodes = [];
    
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        const currentPath = `${path}[${index}]`;
        if (typeof item === 'object' && item !== null) {
          nodes.push({
            id: currentPath,
            name: `[${index}]`,
            type: 'folder',
            path: currentPath,
            children: parseJsonToTree(item, currentPath)
          });
        } else {
          nodes.push({
            id: `${currentPath}.txt`,
            name: `[${index}].txt`,
            type: 'file',
            path: currentPath,
            value: item
          });
        }
      });
    } else if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        const currentPath = path ? `${path}/${key}` : key;
        if (typeof value === 'object' && value !== null) {
          nodes.push({
            id: currentPath,
            name: key,
            type: 'folder',
            path: currentPath,
            children: parseJsonToTree(value, currentPath)
          });
        } else {
          nodes.push({
            id: `${currentPath}.txt`,
            name: `${key}.txt`,
            type: 'file',
            path: currentPath,
            value: value
          });
        }
      });
    }
    
    return nodes;
  };

  const TreeNode = ({ node, depth = 0 }) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const indentSize = depth * 24;

    const handleToggle = () => {
      if (hasChildren && onToggleExpand) {
        onToggleExpand(node.id);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: depth * 0.05 }}
        className="select-none"
      >
        <div
          className={`flex items-center py-1 px-2 hover:bg-gray-50 rounded cursor-pointer transition-colors duration-150 ${
            hasChildren ? 'cursor-pointer' : 'cursor-default'
          }`}
          style={{ marginLeft: `${indentSize}px` }}
          onClick={handleToggle}
        >
          <div className="flex items-center min-w-0 flex-1">
            {hasChildren ? (
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                className="mr-1 flex-shrink-0"
              >
                <ChevronRight size={16} className="text-gray-400" />
              </motion.div>
            ) : (
              <div className="w-5 flex-shrink-0" />
            )}
            
            <div className="mr-2 flex-shrink-0">
              {node.type === 'folder' ? (
                isExpanded ? (
                  <FolderOpen size={16} className="text-blue-500" />
                ) : (
                  <Folder size={16} className="text-blue-500" />
                )
              ) : (
                <File size={16} className="text-gray-500" />
              )}
            </div>
            
            <span
              className={`text-sm truncate ${
                node.type === 'folder' 
                  ? 'text-gray-900 font-medium' 
                  : 'text-gray-700'
              }`}
              title={node.name}
            >
              {node.name}
            </span>
            
            {node.type === 'file' && node.value !== undefined && (
              <span className="ml-2 text-xs text-gray-400 truncate">
                ({typeof node.value === 'string' ? `"${node.value.slice(0, 20)}${node.value.length > 20 ? '...' : ''}"` : String(node.value)})
              </span>
            )}
          </div>
        </div>
        
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {node.children.map((child) => (
                <TreeNode
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  if (!jsonData) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        <div className="text-center">
          <File size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No JSON data to preview</p>
        </div>
      </div>
    );
  }

  const treeData = parseJsonToTree(jsonData);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 flex items-center">
          <Folder size={16} className="mr-2 text-blue-500" />
          File Structure Preview
        </h3>
      </div>
      
      <div className="p-2 max-h-96 overflow-y-auto">
        {treeData.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {treeData.map((node) => (
              <TreeNode key={node.id} node={node} />
            ))}
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-20 text-gray-500">
            <p className="text-sm">Empty structure</p>
          </div>
        )}
      </div>
      
      {treeData.length > 0 && (
        <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {treeData.filter(n => n.type === 'folder').length} folders, {' '}
            {treeData.reduce((count, node) => {
              const countFiles = (n) => {
                let fileCount = n.type === 'file' ? 1 : 0;
                if (n.children) {
                  fileCount += n.children.reduce((sum, child) => sum + countFiles(child), 0);
                }
                return fileCount;
              };
              return count + countFiles(node);
            }, 0)} files
          </p>
        </div>
      )}
    </div>
  );
};

export default TreePreview;