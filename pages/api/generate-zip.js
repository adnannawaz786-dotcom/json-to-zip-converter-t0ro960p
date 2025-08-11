/* EXPORTS: default (API handler) */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jsonData, zipName } = req.body;

    if (!jsonData) {
      return res.status(400).json({ error: 'JSON data is required' });
    }

    // Dynamic import of JSZip for server-side usage
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Recursive function to process JSON structure and create files/folders
    function processJsonStructure(obj, currentPath = '') {
      if (Array.isArray(obj)) {
        // Handle arrays - create numbered files or folders
        obj.forEach((item, index) => {
          const itemPath = currentPath ? `${currentPath}/item_${index}` : `item_${index}`;
          
          if (typeof item === 'object' && item !== null) {
            processJsonStructure(item, itemPath);
          } else {
            // Create file with primitive value
            const fileName = `${itemPath}.txt`;
            zip.file(fileName, String(item));
          }
        });
      } else if (typeof obj === 'object' && obj !== null) {
        // Handle objects - create folders and files
        Object.entries(obj).forEach(([key, value]) => {
          const sanitizedKey = key.replace(/[<>:"/\\|?*]/g, '_'); // Sanitize filename
          const itemPath = currentPath ? `${currentPath}/${sanitizedKey}` : sanitizedKey;
          
          if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value) && value.length === 0) {
              // Empty array - create empty folder
              zip.folder(itemPath);
            } else if (!Array.isArray(value) && Object.keys(value).length === 0) {
              // Empty object - create empty folder
              zip.folder(itemPath);
            } else {
              // Non-empty object/array - process recursively
              processJsonStructure(value, itemPath);
            }
          } else {
            // Primitive value - create file
            const fileExtension = typeof value === 'string' ? '.txt' : '.json';
            const fileName = `${itemPath}${fileExtension}`;
            const fileContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
            zip.file(fileName, fileContent);
          }
        });
      } else {
        // Handle primitive values at root level
        const fileName = currentPath || 'data.txt';
        zip.file(fileName, String(obj));
      }
    }

    // Process the JSON structure
    processJsonStructure(jsonData);

    // Add a metadata file with generation info
    const metadata = {
      generatedAt: new Date().toISOString(),
      originalStructure: jsonData,
      fileCount: Object.keys(zip.files).length
    };
    zip.file('_metadata.json', JSON.stringify(metadata, null, 2));

    // Generate the ZIP file
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    });

    // Set response headers for file download
    const fileName = zipName || 'converted-json-structure.zip';
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', zipBuffer.length);

    // Send the ZIP file
    res.status(200).send(zipBuffer);

  } catch (error) {
    console.error('Error generating ZIP:', error);
    res.status(500).json({ 
      error: 'Failed to generate ZIP file',
      details: error.message 
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '50mb',
  },
};