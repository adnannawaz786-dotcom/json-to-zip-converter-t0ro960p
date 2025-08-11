/* EXPORTS: FileNamingOptions (default) */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Info, Plus, X, FileText } from 'lucide-react';

const FileNamingOptions = ({ onConfigChange, jsonStructure }) => {
  const [config, setConfig] = useState({
    useCustomPrefix: false,
    customPrefix: '',
    useTimestamp: true,
    timestampFormat: 'iso',
    useIndexing: false,
    indexFormat: 'numeric',
    preserveOriginalNames: true,
    fileExtension: 'auto',
    customRules: []
  });

  const [newRule, setNewRule] = useState({
    pattern: '',
    replacement: '',
    applyTo: 'all'
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const timestampFormats = [
    { value: 'iso', label: 'ISO Format (2024-01-01T12:00:00Z)' },
    { value: 'date', label: 'Date Only (2024-01-01)' },
    { value: 'unix', label: 'Unix Timestamp (1704110400)' },
    { value: 'readable', label: 'Readable (Jan-01-2024)' }
  ];

  const indexFormats = [
    { value: 'numeric', label: 'Numeric (001, 002, 003)' },
    { value: 'alpha', label: 'Alphabetic (a, b, c)' },
    { value: 'roman', label: 'Roman (i, ii, iii)' }
  ];

  const fileExtensions = [
    { value: 'auto', label: 'Auto-detect from content' },
    { value: '.json', label: 'Force .json' },
    { value: '.txt', label: 'Force .txt' },
    { value: '.js', label: 'Force .js' },
    { value: 'none', label: 'No extension' }
  ];

  const updateConfig = (updates) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const addCustomRule = () => {
    if (newRule.pattern.trim()) {
      const updatedRules = [...config.customRules, { ...newRule, id: Date.now() }];
      updateConfig({ customRules: updatedRules });
      setNewRule({ pattern: '', replacement: '', applyTo: 'all' });
    }
  };

  const removeCustomRule = (ruleId) => {
    const updatedRules = config.customRules.filter(rule => rule.id !== ruleId);
    updateConfig({ customRules: updatedRules });
  };

  const generatePreview = () => {
    if (!jsonStructure) return 'example-file.json';
    
    let preview = '';
    
    if (config.useCustomPrefix && config.customPrefix) {
      preview += config.customPrefix + '_';
    }
    
    preview += 'data';
    
    if (config.useIndexing) {
      switch (config.indexFormat) {
        case 'numeric':
          preview += '_001';
          break;
        case 'alpha':
          preview += '_a';
          break;
        case 'roman':
          preview += '_i';
          break;
      }
    }
    
    if (config.useTimestamp) {
      switch (config.timestampFormat) {
        case 'iso':
          preview += '_2024-01-01T12-00-00Z';
          break;
        case 'date':
          preview += '_2024-01-01';
          break;
        case 'unix':
          preview += '_1704110400';
          break;
        case 'readable':
          preview += '_Jan-01-2024';
          break;
      }
    }
    
    if (config.fileExtension === 'auto') {
      preview += '.json';
    } else if (config.fileExtension !== 'none') {
      preview += config.fileExtension;
    }
    
    return preview;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          File Naming Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preview */}
        <div className="p-3 bg-muted rounded-lg">
          <Label className="text-sm font-medium">Preview:</Label>
          <div className="mt-1 font-mono text-sm text-foreground">
            {generatePreview()}
          </div>
        </div>

        {/* Basic Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="custom-prefix"
                checked={config.useCustomPrefix}
                onCheckedChange={(checked) => updateConfig({ useCustomPrefix: checked })}
              />
              <Label htmlFor="custom-prefix">Custom Prefix</Label>
            </div>
            <AnimatePresence>
              {config.useCustomPrefix && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Input
                    placeholder="Enter prefix..."
                    value={config.customPrefix}
                    onChange={(e) => updateConfig({ customPrefix: e.target.value })}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="timestamp"
                checked={config.useTimestamp}
                onCheckedChange={(checked) => updateConfig({ useTimestamp: checked })}
              />
              <Label htmlFor="timestamp">Include Timestamp</Label>
            </div>
            <AnimatePresence>
              {config.useTimestamp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Select
                    value={config.timestampFormat}
                    onValueChange={(value) => updateConfig({ timestampFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timestampFormats.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Indexing Options */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="indexing"
              checked={config.useIndexing}
              onCheckedChange={(checked) => updateConfig({ useIndexing: checked })}
            />
            <Label htmlFor="indexing">Auto-indexing for Multiple Files</Label>
          </div>
          <AnimatePresence>
            {config.useIndexing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="ml-6"
              >
                <Select
                  value={config.indexFormat}
                  onValueChange={(value) => updateConfig({ indexFormat: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {indexFormats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* File Extension */}
        <div className="space-y-2">
          <Label>File Extension</Label>
          <Select
            value={config.fileExtension}
            onValueChange={(value) => updateConfig({ fileExtension: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fileExtensions.map((ext) => (
                <SelectItem key={ext.value} value={ext.value}>
                  {ext.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Options Toggle */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2"
          >
            <Info className="h-4 w-4" />
            Advanced Options
          </Button>
        </div>

        {/* Advanced Options */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 border-t pt-4"
            >
              <div className="flex items-center space-x-2">
                <Switch
                  id="preserve-names"
                  checked={config.preserveOriginalNames}
                  onCheckedChange={(checked) => updateConfig({ preserveOriginalNames: checked })}
                />
                <Label htmlFor="preserve-names">Preserve Original Key Names</Label>
              </div>

              {/* Custom Rules */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Custom Naming Rules</Label>
                
                {config.customRules.length > 0 && (
                  <div className="space-y-2">
                    {config.customRules.map((rule) => (
                      <motion.div
                        key={rule.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-2 p-2 bg-muted rounded-md"
                      >
                        <Badge variant="outline">{rule.applyTo}</Badge>
                        <span className="text-sm font-mono">
                          {rule.pattern} → {rule.replacement}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeCustomRule(rule.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="Pattern (regex)"
                    value={newRule.pattern}
                    onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Replacement"
                    value={newRule.replacement}
                    onChange={(e) => setNewRule({ ...newRule, replacement: e.target.value })}
                    className="flex-1"
                  />
                  <Select
                    value={newRule.applyTo}
                    onValueChange={(value) => setNewRule({ ...newRule, applyTo: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Files</SelectItem>
                      <SelectItem value="folders">Folders Only</SelectItem>
                      <SelectItem value="files">Files Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addCustomRule} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default FileNamingOptions;