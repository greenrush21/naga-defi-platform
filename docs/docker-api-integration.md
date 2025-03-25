# Docker API Integration for Naga DeFi Platform

This document provides a comprehensive guide to the Docker API integration in the Naga DeFi platform.

## Overview

The Naga DeFi platform utilizes Docker for containerization and orchestration of its services. The Docker API integration allows the platform to programmatically interact with Docker to manage containers, images, networks, and volumes.

## Architecture

The Docker API integration consists of several components:

1. **DockerApiClient** - A lightweight client for interacting with the Docker Engine API
2. **DockerMcpConnector** - Manages connections to Docker MCP
3. **Docker API Interface** - Provides high-level functions for interacting with Docker

![Docker API Integration Architecture](./images/docker-api-architecture.png)

## Configuration

### Docker Engine API Setup

To use the Docker API integration, you need to ensure that the Docker Engine API is exposed:

#### Windows
1. Open Docker Desktop
2. Go to Settings > General
3. Check "Expose daemon on tcp://localhost:2375 without TLS"
4. Click "Apply & Restart"

#### Linux
1. Configure Docker to listen on a TCP socket:
   ```bash
   # Edit the Docker daemon configuration
   sudo vim /etc/docker/daemon.json
   
   # Add the following:
   {
     "hosts": ["unix:///var/run/docker.sock", "tcp://0.0.0.0:2375"]
   }
   
   # Restart Docker
   sudo systemctl restart docker
   ```

2. Configure appropriate firewall rules to secure the API access

### Security Considerations

The Docker API provides full control over the Docker daemon, which has significant system access. Therefore, consider the following security measures:

1. **Use TLS** - In production environments, always use TLS to encrypt communications
2. **Restrict Access** - Limit access to the Docker API using firewalls and network policies
3. **Use Authentication** - Implement proper authentication mechanisms
4. **Follow Principle of Least Privilege** - Only grant the necessary permissions to containers

## Usage

### Basic Usage

```javascript
const DockerApiClient = require('./docker/docker-api-client');

// Create a client instance
const docker = new DockerApiClient({
  // For Windows
  useSocket: false,
  host: 'localhost',
  port: 2375
  // For Unix systems
  // useSocket: true,
  // socketPath: '/var/run/docker.sock'
});

// Get Docker version
async function getDockerVersion() {
  try {
    const version = await docker.getVersion();
    console.log('Docker Version:', version);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getDockerVersion();
```

### Using the MCP Connector

```javascript
const DockerMcpConnector = require('./docker/docker-mcp-connect');

// Create connector instance
const connector = new DockerMcpConnector({
  host: 'localhost',
  port: 2375,
  autoReconnect: true
});

// Connect to Docker MCP
async function connect() {
  const connected = await connector.connect();
  
  if (connected) {
    console.log('Connected to Docker MCP');
    
    // Get Docker client
    const dockerClient = connector.getClient();
    
    // Use the client
    const containers = await dockerClient.listContainers();
    console.log('Running containers:', containers.length);
  }
}

connect();
```

## API Reference

### DockerApiClient

#### Constructor

```javascript
const client = new DockerApiClient(options);
```

Options:
- `useSocket` (boolean): Whether to use a Unix socket (default: true)
- `socketPath` (string): Path to the Docker socket (default: /var/run/docker.sock)
- `host` (string): Docker API host (default: localhost)
- `port` (number): Docker API port (default: 2375)
- `version` (string): Docker API version (default: v1.41)

#### Methods

##### Container Operations

- `listContainers(filters)`: List containers
- `getContainer(id)`: Get container details
- `createContainer(config, name)`: Create a new container
- `startContainer(id)`: Start a container
- `stopContainer(id, timeout)`: Stop a container
- `removeContainer(id, options)`: Remove a container
- `getContainerLogs(id, options)`: Get container logs

##### Image Operations

- `listImages(filters)`: List images
- `pullImage(name, tag)`: Pull an image from registry

##### System Operations

- `getSystemInfo()`: Get system information
- `getVersion()`: Get Docker version information
- `ping()`: Ping the Docker API

##### Network Operations

- `listNetworks(filters)`: List Docker networks

##### Volume Operations

- `listVolumes(filters)`: List Docker volumes

### DockerMcpConnector

#### Constructor

```javascript
const connector = new DockerMcpConnector(options);
```

Options:
- `host` (string): Docker API host (default: localhost)
- `port` (number): Docker API port (default: 2375)
- `configPath` (string): Path to config file (default: ./docker-mcp-config.json)
- `autoReconnect` (boolean): Whether to auto-reconnect (default: true)
- `reconnectInterval` (number): Reconnect interval in ms (default: 5000)
- `maxRetries` (number): Maximum retry attempts (default: 10)

#### Methods

- `connect()`: Connect to Docker MCP
- `disconnect()`: Disconnect from Docker MCP
- `checkConnection()`: Check connection status
- `getConnectionInfo()`: Get connection information
- `getClient()`: Get DockerApiClient instance
- `loadConfig()`: Load configuration from file
- `saveConfig(config)`: Save configuration to file

## Troubleshooting

### Connection Issues

If you're having trouble connecting to the Docker API:

1. Verify Docker is running
   ```bash
   docker version
   ```

2. Test the API connection
   ```bash
   # Windows (PowerShell)
   .\scripts\docker-api-test.ps1
   
   # Linux/macOS
   curl -X GET http://localhost:2375/v1.41/_ping
   ```

3. Check Docker Desktop settings to ensure the API is exposed

4. Restart Docker after changing settings

### Error Handling

The Docker API client includes comprehensive error handling to help diagnose issues:

```javascript
try {
  await docker.ping();
  console.log('Docker API is accessible');
} catch (error) {
  console.error('Docker API error:', error.message);
  
  // Check if Docker is running
  console.log('Make sure Docker is running and the API is exposed');
}
```

## Future Improvements

1. **TLS Support** - Add support for TLS encryption
2. **Authentication** - Implement Docker API authentication
3. **Streaming Support** - Add support for streaming logs and events
4. **Rate Limiting** - Implement rate limiting for API requests
5. **Monitoring** - Add monitoring and metrics collection