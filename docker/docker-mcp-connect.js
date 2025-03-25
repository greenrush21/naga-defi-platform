/**
 * Docker MCP Connection Utility
 * This script establishes and manages a connection to Docker MCP
 */

const DockerApiClient = require('./docker-api-client');
const fs = require('fs');
const path = require('path');

class DockerMcpConnector {
  constructor(options = {}) {
    this.configPath = options.configPath || path.join(process.cwd(), 'docker-mcp-config.json');
    this.docker = new DockerApiClient({
      useSocket: process.platform !== 'win32',
      host: options.host || 'localhost',
      port: options.port || 2375
    });
    this.connected = false;
    this.connectionInfo = null;
    this.reconnectInterval = options.reconnectInterval || 5000; // 5 seconds
    this.maxRetries = options.maxRetries || 10;
    this.retryCount = 0;
    this.autoReconnect = options.autoReconnect !== false;
  }

  /**
   * Load configuration from file
   * @returns {object} - Configuration object
   */
  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        console.log(`Loaded configuration from ${this.configPath}`);
        return config;
      }
    } catch (error) {
      console.error(`Failed to load configuration: ${error.message}`);
    }
    return {};
  }

  /**
   * Save configuration to file
   * @param {object} config - Configuration object to save
   */
  saveConfig(config) {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      console.log(`Configuration saved to ${this.configPath}`);
    } catch (error) {
      console.error(`Failed to save configuration: ${error.message}`);
    }
  }

  /**
   * Connect to Docker MCP
   * @returns {Promise<boolean>} - True if connection is successful
   */
  async connect() {
    try {
      console.log('Attempting to connect to Docker MCP...');
      
      // Test Docker API connection
      const pingResponse = await this.docker.ping();
      console.log('Docker API ping response:', pingResponse);
      
      // Get Docker version to verify connection
      const versionInfo = await this.docker.getVersion();
      
      this.connected = true;
      this.connectionInfo = {
        version: versionInfo.Version,
        apiVersion: versionInfo.ApiVersion,
        platform: versionInfo.Platform,
        connectedAt: new Date().toISOString()
      };
      
      // Save connection info to config
      const config = this.loadConfig();
      config.lastConnection = this.connectionInfo;
      this.saveConfig(config);
      
      console.log('Successfully connected to Docker MCP');
      console.log(`Docker Engine: ${versionInfo.Version}, API: ${versionInfo.ApiVersion}`);
      
      this.retryCount = 0;
      return true;
    } catch (error) {
      console.error(`Failed to connect to Docker MCP: ${error.message}`);
      
      if (this.autoReconnect && this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Retrying connection (${this.retryCount}/${this.maxRetries}) in ${this.reconnectInterval/1000} seconds...`);
        
        setTimeout(() => this.connect(), this.reconnectInterval);
      } else if (this.retryCount >= this.maxRetries) {
        console.error(`Maximum retry attempts (${this.maxRetries}) reached. Giving up.`);
      }
      
      return false;
    }
  }

  /**
   * Disconnect from Docker MCP
   */
  disconnect() {
    if (this.connected) {
      console.log('Disconnecting from Docker MCP...');
      this.connected = false;
      this.connectionInfo = null;
      console.log('Disconnected from Docker MCP');
    }
  }

  /**
   * Check connection status
   * @returns {Promise<boolean>} - True if connection is active
   */
  async checkConnection() {
    if (!this.connected) {
      return false;
    }
    
    try {
      await this.docker.ping();
      return true;
    } catch (error) {
      console.error(`Connection check failed: ${error.message}`);
      this.connected = false;
      
      if (this.autoReconnect) {
        console.log('Attempting to reconnect...');
        return this.connect();
      }
      
      return false;
    }
  }

  /**
   * Get connection information
   * @returns {object|null} - Connection information or null if not connected
   */
  getConnectionInfo() {
    return this.connectionInfo;
  }

  /**
   * Get Docker API client instance
   * @returns {DockerApiClient} - Docker API client instance
   */
  getClient() {
    if (!this.connected) {
      throw new Error('Not connected to Docker MCP');
    }
    return this.docker;
  }
}

module.exports = DockerMcpConnector;