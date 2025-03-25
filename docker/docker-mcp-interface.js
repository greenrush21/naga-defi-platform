/**
 * Docker MCP Interface
 * Main interface for the Docker MCP integration
 */

const DockerMcpConnector = require('./docker-mcp-connect');

// Create MCP connector instance
const connector = new DockerMcpConnector({
  host: 'localhost',
  port: 2375,
  autoReconnect: true
});

// Main function to demonstrate Docker MCP interface
async function main() {
  console.log('DOCKER MCP INTERFACE');
  console.log('--------------------');
  
  // Connect to Docker MCP
  const connected = await connector.connect();
  
  if (!connected) {
    console.error('Failed to establish Docker MCP connection');
    process.exit(1);
  }
  
  // Display connection information
  const connectionInfo = connector.getConnectionInfo();
  console.log('\nDocker MCP Connection Information:');
  console.log(JSON.stringify(connectionInfo, null, 2));
  
  // Get Docker client and fetch system information
  try {
    const dockerClient = connector.getClient();
    
    // Display system information
    const systemInfo = await dockerClient.getSystemInfo();
    console.log('\nDocker System Information:');
    console.log(`- Containers: ${systemInfo.Containers}`);
    console.log(`- Running: ${systemInfo.ContainersRunning}`);
    console.log(`- Paused: ${systemInfo.ContainersPaused}`);
    console.log(`- Stopped: ${systemInfo.ContainersStopped}`);
    console.log(`- Images: ${systemInfo.Images}`);
    console.log(`- Driver: ${systemInfo.Driver}`);
    console.log(`- Operating System: ${systemInfo.OperatingSystem}`);
    console.log(`- Architecture: ${systemInfo.Architecture}`);
    console.log(`- Kernel Version: ${systemInfo.KernelVersion}`);
    
    // List running containers
    const containers = await dockerClient.listContainers();
    console.log('\nRunning Containers:');
    if (containers.length === 0) {
      console.log('No containers currently running');
    } else {
      containers.forEach((container, index) => {
        console.log(`${index + 1}. ${container.Names[0]} (${container.Image})`);
        console.log(`   ID: ${container.Id.substring(0, 12)}`);
        console.log(`   Status: ${container.Status}`);
        console.log(`   Ports: ${formatPorts(container.Ports)}`);
        console.log(`   Created: ${new Date(container.Created * 1000).toLocaleString()}`);
      });
    }
    
    // Keep connection active for demonstration purposes
    console.log('\nConnection to Docker MCP is active.');
    console.log('Press Ctrl+C to disconnect and exit.');
    
    // Set up cleanup on exit
    process.on('SIGINT', () => {
      console.log('\nReceived exit signal. Disconnecting from Docker MCP...');
      connector.disconnect();
      process.exit(0);
    });
    
  } catch (error) {
    console.error(`Error while interacting with Docker MCP: ${error.message}`);
    connector.disconnect();
    process.exit(1);
  }
}

/**
 * Format container ports for display
 * @param {Array} ports - Array of port objects
 * @returns {string} - Formatted ports string
 */
function formatPorts(ports) {
  if (!ports || ports.length === 0) {
    return 'None';
  }
  
  return ports.map(port => {
    const publicPort = port.PublicPort ? `${port.PublicPort}->` : '';
    const privatePort = port.PrivatePort || '';
    const type = port.Type || 'tcp';
    return `${publicPort}${privatePort}/${type}`;
  }).join(', ');
}

// Run the main function
main().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});