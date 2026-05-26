import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));


const isPrime = (num) => {
  if (num <= 1) return false;
  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) return false;
  }
  return true;
};



const getMimeType = (buffer) => {
  const hex = buffer.toString('hex', 0, 4).toUpperCase();
  if (hex.startsWith('89504E47')) return 'image/png';
  if (hex.startsWith('FFD8FF')) return 'image/jpeg';
  if (hex.startsWith('25504446')) return 'application/pdf';
  
  return 'application/octet-stream';
};

/**
 * Validates and extracts metadata from a base64 encoded file string.
 */
const processFile = (fileB64) => {
  const defaultResult = {
    file_valid: false,
    file_mime_type: null,
    file_size_kb: null
  };

  if (!fileB64 || typeof fileB64 !== 'string') {
    return defaultResult;
  }

  try {
    let base64String = fileB64;
    let mimeType = null;

    // Check and strip Data URI prefix if present
    const dataUriMatch = fileB64.match(/^data:(.+);base64,(.+)$/);
    if (dataUriMatch) {
      mimeType = dataUriMatch[1];
      base64String = dataUriMatch[2];
    }

    // Strict validation check for base64 structure
    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2,3})?$/;
    if (!base64Regex.test(base64String)) {
      return defaultResult;
    }

    const buffer = Buffer.from(base64String, 'base64');
    if (buffer.length === 0) {
      return defaultResult;
    }

    return {
      file_valid: true,
      file_mime_type: mimeType || getMimeType(buffer),
      file_size_kb: parseFloat((buffer.length / 1024).toFixed(2))
    };
  } catch (error) {
    return defaultResult;
  }
};

/**
 * Processes input data array to separate alphabets/numbers and check for primes.
 */
const processInputData = (data) => {
  const numbers = [];
  const alphabets = [];
  let isPrimeFound = false;

  if (!Array.isArray(data)) {
    return { numbers, alphabets, isPrimeFound };
  }

  for (const item of data) {
    const itemStr = String(item);

    if (/^\d+$/.test(itemStr)) {
      numbers.push(itemStr);
      if (isPrime(parseInt(itemStr, 10))) {
        isPrimeFound = true;
      }
    } else if (/^[a-zA-Z]$/.test(itemStr)) {
      alphabets.push(itemStr);
    }
  }

  return { numbers, alphabets, isPrimeFound };
};

/**
 * Finds the highest lowercase alphabet from the extracted alphabets.
 */
const getHighestLowercaseAlphabet = (alphabets) => {
  const lowercaseAlphabets = alphabets.filter(char => /^[a-z]$/.test(char));
  if (lowercaseAlphabets.length === 0) {
    return [];
  }

  lowercaseAlphabets.sort();
  return [lowercaseAlphabets[lowercaseAlphabets.length - 1]];
};

// GET Route: returns fixed operations code
app.get('/bfhl', (req, res) => {
  res.status(200).json({ operation_code: 1 });
});

// POST Route: processes user request body
app.post('/bfhl', (req, res) => {
  try {
    const { data = [], file_b64 } = req.body;

    const { numbers, alphabets, isPrimeFound } = processInputData(data);
    const highestLowercaseAlphabet = getHighestLowercaseAlphabet(alphabets);
    const fileResult = processFile(file_b64);

    res.status(200).json({
      is_success: true,
      user_id: "himanshu_satpute_0827AL231056",
      email: "himanshusatpute231233@acropolis.in",
      roll_number: "0827AL231056",
      numbers,
      alphabets,
      highest_lowercase_alphabet: highestLowercaseAlphabet,
      is_prime_found: isPrimeFound,
      ...fileResult
    });
  } catch (error) {
    res.status(500).json({ is_success: false, message: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});