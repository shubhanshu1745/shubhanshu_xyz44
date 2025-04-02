// Barebones bootstrapper that opens port 3000 immediately and then runs the main app
import http from 'http';
import { spawn } from 'child_process';

console.log('Starting bootstrap server to open port 3000 quickly...');

// Create and start simple server that responds to all requests
http.createServer((_, res) => {
  res.end('Server is starting...');
}).listen(3000, '0.0.0.0', () => {
  console.log('Port 3000 opened - sending ready signal');
  
  // Start the app with a delay to ensure port 3000 is detected
  setTimeout(() => {
    console.log('Starting main application...');
    spawn('npm', ['run', 'dev:actual'], {
      stdio: 'inherit',
      shell: true
    });
  }, 500);
});