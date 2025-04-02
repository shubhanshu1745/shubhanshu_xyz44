// Barebones HTTP server with absolute minimal overhead to open port 5000
const http = require('http');

// Create the most basic server possible
const server = http.createServer((_, res) => {
  res.end('OK');
});

// Listen immediately with minimal logging
server.listen(5000, '0.0.0.0', () => {
  console.log('Port 5000 open');
});

// Simple signal handler for clean shutdown
process.on('SIGINT', () => {
  server.close();
  process.exit(0);
});