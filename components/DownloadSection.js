/* EXPORTS: DownloadSection (default) */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileArchive, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const DownloadSection = ({ 
  jsonData, 
  fileName, 
  isGenerating, 
  onDownload, 
  downloadStatus,
  downloadProgress = 0 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDownload = () => {
    if (!jsonData || isGenerating) return;
    onDownload();
  };

  const getStatusIcon = () => {
    switch (downloadStatus) {
      case 'generating':
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Download className="w-5 h-5" />;
    }
  };

  const getStatusText = () => {
    switch (downloadStatus) {
      case 'generating':
        return 'Generating ZIP file...';
      case 'success':
        return 'Download completed successfully!';
      case 'error':
        return 'Download failed. Please try again.';
      default:
        return 'Ready to download';
    }
  };

  const isDisabled = !jsonData || isGenerating || downloadStatus === 'generating';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-2xl mx-auto mt-8"
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileArchive className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Download ZIP File
              </h3>
              <p className="text-sm text-gray-600">
                Convert your JSON structure to a downloadable ZIP archive
              </p>
            </div>
          </div>
        </div>

        {/* File Name Display */}
        {fileName && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">File name:</span>
              <code className="text-sm bg-white px-2 py-1 rounded border text-gray-800">
                {fileName}.zip
              </code>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <AnimatePresence>
          {downloadStatus === 'generating' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-blue-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${downloadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Processing...</span>
                <span>{downloadProgress}%</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Message */}
        <div className="flex items-center space-x-2 mb-6">
          {getStatusIcon()}
          <span className={`text-sm ${
            downloadStatus === 'success' ? 'text-green-600' :
            downloadStatus === 'error' ? 'text-red-600' :
            downloadStatus === 'generating' ? 'text-blue-600' :
            'text-gray-600'
          }`}>
            {getStatusText()}
          </span>
        </div>

        {/* Download Button */}
        <motion.button
          onClick={handleDownload}
          disabled={isDisabled}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          whileHover={!isDisabled ? { scale: 1.02 } : {}}
          whileTap={!isDisabled ? { scale: 0.98 } : {}}
          className={`
            w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg
            font-medium text-white transition-all duration-200
            ${isDisabled 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
            }
          `}
        >
          <motion.div
            animate={isHovered && !isDisabled ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 0.3 }}
          >
            {getStatusIcon()}
          </motion.div>
          <span>
            {downloadStatus === 'generating' ? 'Generating ZIP...' : 'Download ZIP File'}
          </span>
        </motion.button>

        {/* Help Text */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>
            The ZIP file will contain folders and files based on your JSON structure.
            {!jsonData && ' Please provide valid JSON data to enable download.'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default DownloadSection;