/* EXPORTS: JsonInput (default) */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { AlertCircle, CheckCircle2, Code2, FileText } from 'lucide-react';

const JsonInput = ({ onJsonChange, onValidationChange }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [isValid, setIsValid] = useState(null);
  const [error, setError] = useState('');
  const [formatted, setFormatted] = useState(false);

  const validateJson = useCallback((input) => {
    if (!input.trim()) {
      setIsValid(null);
      setError('');
      onValidationChange?.(false);
      onJsonChange?.(null);
      return;
    }

    try {
      const parsed = JSON.parse(input);
      setIsValid(true);
      setError('');
      onValidationChange?.(true);
      onJsonChange?.(parsed);
    } catch (err) {
      setIsValid(false);
      setError(err.message);
      onValidationChange?.(false);
      onJsonChange?.(null);
    }
  }, [onJsonChange, onValidationChange]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setJsonInput(value);
    setFormatted(false);
    validateJson(value);
  };

  const formatJson = () => {
    if (isValid && jsonInput.trim()) {
      try {
        const parsed = JSON.parse(jsonInput);
        const formatted = JSON.stringify(parsed, null, 2);
        setJsonInput(formatted);
        setFormatted(true);
      } catch (err) {
        // Should not happen since we already validated
      }
    }
  };

  const clearInput = () => {
    setJsonInput('');
    setIsValid(null);
    setError('');
    setFormatted(false);
    onValidationChange?.(false);
    onJsonChange?.(null);
  };

  const loadExample = () => {
    const exampleJson = {
      "project": {
        "name": "my-app",
        "src": {
          "components": {
            "Header.js": "// Header component code",
            "Footer.js": "// Footer component code"
          },
          "pages": {
            "index.js": "// Home page code",
            "about.js": "// About page code"
          },
          "styles": {
            "globals.css": "/* Global styles */",
            "components.css": "/* Component styles */"
          }
        },
        "public": {
          "favicon.ico": "[binary]",
          "logo.png": "[binary]"
        },
        "package.json": "{ \"name\": \"my-app\" }",
        "README.md": "# My App\n\nDescription here"
      }
    };
    
    const formattedExample = JSON.stringify(exampleJson, null, 2);
    setJsonInput(formattedExample);
    setFormatted(true);
    validateJson(formattedExample);
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">JSON Input</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            {isValid === true && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1 text-green-600"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">Valid JSON</span>
              </motion.div>
            )}
            
            {isValid === false && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1 text-red-600"
              >
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Invalid JSON</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <textarea
            value={jsonInput}
            onChange={handleInputChange}
            placeholder="Paste your JSON structure here... or click 'Load Example' to see how it works"
            className={`w-full h-64 p-4 border rounded-lg font-mono text-sm resize-y focus:outline-none focus:ring-2 transition-colors ${
              isValid === true
                ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                : isValid === false
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
          />
          
          {jsonInput && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded border"
            >
              {jsonInput.length} chars
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">JSON Syntax Error</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={formatJson}
            disabled={!isValid}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {formatted ? 'Formatted' : 'Format JSON'}
          </Button>
          
          <Button
            onClick={loadExample}
            variant="outline"
            size="sm"
          >
            Load Example
          </Button>
          
          <Button
            onClick={clearInput}
            variant="outline"
            size="sm"
            disabled={!jsonInput}
          >
            Clear
          </Button>
        </div>
      </div>

      {jsonInput && (
        <div className="text-xs text-gray-500 border-t pt-3">
          <p>
            💡 <strong>Tip:</strong> Your JSON structure will be converted to files and folders. 
            Objects become folders, and string values become file contents.
          </p>
        </div>
      )}
    </Card>
  );
};

export default JsonInput;