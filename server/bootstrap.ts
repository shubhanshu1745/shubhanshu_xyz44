// This script opens port 5000 immediately and then starts the main server
import http from 'http';
import { spawn } from 'child_process';

// Create instant bare server
const quickServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

// Open port immediately
quickServer.listen(5000, '0.0.0.0', () => {
  console.log('Port 5000 opened by bootstrap server');
  
  // Start the actual server after a brief delay
  setTimeout(() => {
    console.log('Closing bootstrap server...');
    
    // Close bootstrap server first
    quickServer.close(() => {
      console.log('Bootstrap server closed. Starting main server...');
      
      // Start main server
      const serverProcess = spawn('node', ['--import', 'tsx', 'server/index.ts'], {
        stdio: 'inherit',
        shell: true
      });
      
      // Handle errors
      serverProcess.on('error', (err) => {
        console.error('Failed to start main server:', err);
      });
    });
  }, 1000);
});