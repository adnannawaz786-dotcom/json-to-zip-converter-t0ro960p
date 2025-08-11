import crypto from 'crypto';

const R2_CONFIG = {
  accessKeyId: 'fe8eef83ba234ad316bd666b54439889',
  secretAccessKey: 'ccd1072dddc6b1b71af2b1eefa7b3d89b507270c844d613272c210dec0202918',
  endpoint: 'https://9cb00fa4689fceb7543968fcfbed5040.r2.cloudflarestorage.com',
  region: 'auto',
  bucketName: 'my-files'
};

function getSigningKey(key, dateStamp, regionName, serviceName) {
  const kDate = crypto.createHmac('sha256', `AWS4${key}`).update(dateStamp).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(regionName).digest();
  const kService = crypto.createHmac('sha256', kRegion).update(serviceName).digest();
  const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
  return kSigning;
}

function createPresignedUrl(key, contentType) {
  const method = 'PUT';
  const host = R2_CONFIG.endpoint.replace('https://', '');
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const datetime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  
  // Create canonical request
  const canonicalUri = `/${R2_CONFIG.bucketName}/${key}`;
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:${datetime}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const payloadHash = 'UNSIGNED-PAYLOAD';
  
  const canonicalRequest = [
    method,
    canonicalUri,
    '', // query string (empty for presigned URLs)
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');
  
  // Create string to sign
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${date}/${R2_CONFIG.region}/s3/aws4_request`;
  const stringToSign = [
    algorithm,
    datetime,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex')
  ].join('\n');
  
  // Calculate signature
  const signingKey = getSigningKey(R2_CONFIG.secretAccessKey, date, R2_CONFIG.region, 's3');
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  
  // Build presigned URL
  const credential = `${R2_CONFIG.accessKeyId}/${credentialScope}`;
  const queryParams = new URLSearchParams({
    'X-Amz-Algorithm': algorithm,
    'X-Amz-Credential': credential,
    'X-Amz-Date': datetime,
    'X-Amz-Expires': '3600',
    'X-Amz-SignedHeaders': signedHeaders,
    'X-Amz-Signature': signature
  });
  
  return `${R2_CONFIG.endpoint}${canonicalUri}?${queryParams.toString()}`;
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { filename, contentType } = req.body;
    
    if (!filename) {
      return res.status(400).json({ success: false, error: 'Filename is required' });
    }

    console.log('Generating presigned URL for:', filename);
    
    // Sanitize filename
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `uploads/${Date.now()}-${sanitizedFilename}`;
    
    // Generate presigned URL using AWS Signature V4
    const presignedUrl = createPresignedUrl(key, contentType || 'application/octet-stream');
    
    const publicUrl = `${R2_CONFIG.endpoint}/${R2_CONFIG.bucketName}/${key}`;
    
    console.log('Generated presigned URL successfully');
    
    return res.status(200).json({
      success: true,
      uploadUrl: presignedUrl,
      publicUrl: publicUrl,
      key: key,
      expiresIn: 3600 // 1 hour
    });
    
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
