/* EXPORTS: default (Home component) */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { parseJsonStructure } from '../lib/jsonParser';
import { generateZipFile } from '../lib/zipGenerator';
import { Download, FileTree, AlertCircle, CheckCircle2, Folder, File } from 'lucide-react';

const Home = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [parsedStructure, setParsedStructure] = useState(null);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleJsonChange = (value) => {
    setJsonInput(value);
    setError('');
    setParsedStructure(null);
    setShowPreview(false);
  };

  const handleParseJson = () => {
    if (!jsonInput.trim()) {
      setError('Please enter JSON data');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const structure = parseJsonStructure(parsed);
      setParsedStructure(structure);
      setShowPreview(true);
      setError('');
    } catch (err) {
      setError('Invalid JSON format: ' + err.message);
      setParsedStructure(null);
      setShowPreview(false);
    }
  };

  const handleGenerateZip = async () => {
    if (!parsedStructure) return;

    setIsGenerating(true);
    try {
      await generateZipFile(parsedStructure, jsonInput);
    } catch (err) {
      setError('Failed to generate ZIP file: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderTreeNode = (node, level = 0) => {
    const indent = level * 20;
    
    return (
      <motion.div
        key={node.path}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: level * 0.1 }}
        className="py-1"
      >
        <div 
          className="flex items-center gap-2 text-sm"
          style={{ paddingLeft: `${indent}px` }}
        >
          {node.type === 'folder' ? (
            <>
              <Folder className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-blue-700">{node.name}/</span>
              <Badge variant="secondary" className="text-xs">
                {node.children?.length || 0} items
              </Badge>
            </>
          ) : (
            <>
              <File className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">{node.name}</span>
              {node.size && (
                <Badge variant="outline" className="text-xs">
                  {node.size} bytes
                </Badge>
              )}
            </>
          )}
        </div>
        
        {node.children && (
          <div className="mt-1">
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </motion.div>
    );
  };

  const exampleJson = `{
  "project": {
    "src": {
      "components": {
        "Button.js": "export default function Button() { return <button>Click me</button>; }",
        "Modal.js": "export default function Modal() { return <div>Modal content</div>; }"
      },
      "pages": {
        "index.js": "export default function Home() { return <h1>Welcome</h1>; }",
        "about.js": "export default function About() { return <h1>About Us</h1>; }"
      },
      "styles": {
        "globals.css": "body { margin: 0; padding: 0; }"
      }
    },
    "package.json": "{ \\"name\\": \\"my-project\\", \\"version\\": \\"1.0.0\\" }",
    "README.md": "# My Project\\n\\nThis is a sample project."
  }
}`;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            JSON to ZIP Converter
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Convert JSON structures to downloadable ZIP files with dynamic file naming 
            and visual tree preview
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileTree className="h-5 w-5" />
                  JSON Input
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter your JSON structure here..."
                  value={jsonInput}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    onClick={handleParseJson}
                    className="flex-1"
                    disabled={!jsonInput.trim()}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Parse & Preview
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setJsonInput(exampleJson)}
                  >
                    Load Example
                  </Button>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Preview Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Folder className="h-5 w-5" />
                  File Structure Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {!showPreview ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-12 text-gray-500"
                    >
                      <FileTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Parse JSON to see file structure preview</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          {parsedStructure?.stats?.totalFiles || 0} files, {parsedStructure?.stats?.totalFolders || 0} folders
                        </Badge>
                        <Button
                          onClick={handleGenerateZip}
                          disabled={isGenerating || !parsedStructure}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          {isGenerating ? 'Generating...' : 'Download ZIP'}
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      <ScrollArea className="h-[300px] w-full">
                        <div className="space-y-1">
                          {parsedStructure?.tree && renderTreeNode(parsedStructure.tree)}
                        </div>
                      </ScrollArea>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <Card>
            <CardHeader>
              <CardTitle>How to Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Input JSON</h3>
                  <p className="text-sm text-gray-600">
                    Enter your JSON structure where keys represent file/folder names
                  </p>
                </div>
                
                <div className="text-center p-4">
                  <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <span className="text-green-600 font-bold">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Preview Structure</h3>
                  <p className="text-sm text-gray-600">
                    Review the file tree structure before generating
                  </p>
                </div>
                
                <div className="text-center p-4">
                  <div className="bg-purple-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Download ZIP</h3>
                  <p className="text-sm text-gray-600">
                    Generate and download your ZIP file with the created structure
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Home;