// Absolute minimal server that just opens a port with no dependencies
import http from 'http';

// Create and start immediately
http.createServer((req, res) => {
  res.end('OK');
}).listen(5000, '0.0.0.0', () => {
  console.log('Port 5000 open');
});