const http = require('http');

const makeRequest = (method, path, body = null) => {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {}
    };

    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', err => reject(err));
    if (body) {
      req.write(postData);
    }
    req.end();
  });
};

async function runTests() {
  try {
    console.log('--- Running GET /bfhl ---');
    const getRes = await makeRequest('GET', '/bfhl');
    console.log('GET Status:', getRes.statusCode);
    console.log('GET Response:', getRes.data);

    console.log('\n--- Running POST /bfhl with empty file_b64 ---');
    const postRes1 = await makeRequest('POST', '/bfhl', {
      data: ["M", "1", "334", "4", "B", "Z", "a", "7"],
      file_b64: ""
    });
    console.log('POST Status:', postRes1.statusCode);
    console.log('POST Response:', postRes1.data);

    console.log('\n--- Running POST /bfhl with invalid file_b64 ---');
    const postRes2 = await makeRequest('POST', '/bfhl', {
      data: ["M", "1", "334", "4", "B", "Z", "a", "7"],
      file_b64: "invalid_b64_string_with_symbols!!!"
    });
    console.log('POST Status:', postRes2.statusCode);
    console.log('POST Response:', postRes2.data);

    console.log('\n--- Running POST /bfhl with valid file_b64 (no data URI) ---');
    const postRes3 = await makeRequest('POST', '/bfhl', {
      data: ["2", "4", "5", "92"],
      file_b64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    });
    console.log('POST Status:', postRes3.statusCode);
    console.log('POST Response:', postRes3.data);

    console.log('\n--- Running POST /bfhl with valid file_b64 (with data URI) ---');
    const postRes4 = await makeRequest('POST', '/bfhl', {
      data: ["A", "C", "Z", "c", "i"],
      file_b64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    });
    console.log('POST Status:', postRes4.statusCode);
    console.log('POST Response:', postRes4.data);

  } catch (err) {
    console.error('Error running tests:', err.message);
  }
}

runTests();