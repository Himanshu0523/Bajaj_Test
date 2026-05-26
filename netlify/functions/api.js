import serverless from 'serverless-http';
import app from '../../backend/index.js';

const handler = serverless(app);

export { handler };
