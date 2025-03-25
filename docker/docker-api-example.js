/**
 * Docker API Example Usage
 * Demonstrates how to use the DockerApiClient
 */

const DockerApiClient = require('./docker-api-client');

// Create a client instance
const docker = new DockerApiClient({
  // For Windows, use TCP
  useSocket: false,
  host: 'localhost',
  port: 2375
  // For Unix systems, use socket
  // useSocket: true,
  // socketPath: '/var/run/docker.sock'
});

// Example 1: Get Docker version
async function getDockerVersion() {
  try {
    const version = await docker.getVersion();
    console.log('Docker Version:', version);
  } catch (error) {
    console.error('Error getting Docker version:', error.message);
  }
}

// Example 2: List running containers
async function listRunningContainers() {
  try {
    const containers = await docker.listContainers();
    console.log('Running Containers:', containers.length);
    containers.forEach(container => {
      console.log(`- ${container.Id.substring(0, 12)}: ${container.Image} (${container.Status})`);
    });
  } catch (error) {
    console.error('Error listing containers:', error.message);
  }
}

// Example 3: List available images
async function listImages() {
  try {
    const images = await docker.listImages();
    console.log('Available Images:', images.length);
    images.forEach(image => {
      const tags = image.RepoTags || ['<none>:<none>'];
      console.log(`- ${image.Id.substring(0, 12)}: ${tags.join(', ')}`);
    });
  } catch (error) {
    console.error('Error listing images:', error.message);
  }
}

// Example 4: Get system information
async function getSystemInfo() {
  try {
    const info = await docker.getSystemInfo();
    console.log('Docker System Info:');
    console.log(`- Containers: ${info.Containers} (running: ${info.ContainersRunning}, paused: ${info.ContainersPaused}, stopped: ${info.ContainersStopped})`);
    console.log(`- Images: ${info.Images}`);
    console.log(`- Docker Root Dir: ${info.DockerRootDir}`);
    console.log(`- Operating System: ${info.OperatingSystem}`);
  } catch (error) {
    console.error('Error getting system info:', error.message);
  }
}

// Example 5: Create and start a new container
async function createAndStartContainer() {
  try {
    // Create a new container using the nginx image
    const container = await docker.createContainer({
      Image: 'nginx:latest',
      ExposedPorts: {
        '80/tcp': {}
      },
      HostConfig: {
        PortBindings: {
          '80/tcp': [{ HostPort: '8080' }]
        }
      }
    }, 'naga-nginx-example');
    
    console.log(`Container created with ID: ${container.Id}`);
    
    // Start the container
    await docker.startContainer(container.Id);
    console.log(`Container ${container.Id} started successfully`);
    
    return container.Id;
  } catch (error) {
    console.error('Error creating/starting container:', error.message);
  }
}

// Example 6: Stop and remove a container
async function stopAndRemoveContainer(containerId) {
  try {
    await docker.stopContainer(containerId);
    console.log(`Container ${containerId} stopped successfully`);
    
    await docker.removeContainer(containerId);
    console.log(`Container ${containerId} removed successfully`);
  } catch (error) {
    console.error('Error stopping/removing container:', error.message);
  }
}

// Run examples
async function runExamples() {
  console.log('DOCKER API EXAMPLES');
  console.log('-------------------');
  
  await getDockerVersion();
  console.log('-------------------');
  
  await listRunningContainers();
  console.log('-------------------');
  
  await listImages();
  console.log('-------------------');
  
  await getSystemInfo();
  console.log('-------------------');
  
  // Uncomment to run container creation example
  /*
  const containerId = await createAndStartContainer();
  console.log('-------------------');
  
  if (containerId) {
    console.log('Waiting 10 seconds before stopping container...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    await stopAndRemoveContainer(containerId);
    console.log('-------------------');
  }
  */
}

// Run all examples
runExamples().catch(console.error);