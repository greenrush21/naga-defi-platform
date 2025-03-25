/**
 * Docker API Client
 * A lightweight client for interacting with the Docker Engine API
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class DockerApiClient {
  constructor(options = {}) {
    this.socketPath = options.socketPath || '/var/run/docker.sock';
    this.host = options.host || 'localhost';
    this.port = options.port || 2375;
    this.useSocket = options.useSocket !== false;
    this.version = options.version || 'v1.41';
  }

  /**
   * Send a request to the Docker API
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {string} path - API endpoint path
   * @param {object} data - Request body for POST/PUT requests
   * @returns {Promise} - Promise resolving with the response data
   */
  request(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (this.useSocket && process.platform !== 'win32') {
        options.socketPath = this.socketPath;
        options.path = `/${this.version}${path}`;
      } else {
        options.host = this.host;
        options.port = this.port;
        options.path = `/${this.version}${path}`;
      }

      if (data) {
        const payload = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(payload);
      }

      const req = http.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            // Some endpoints may return empty responses
            const result = responseData ? JSON.parse(responseData) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(result);
            } else {
              reject(new Error(`Docker API Error: ${res.statusCode} ${JSON.stringify(result)}`))
            }
          } catch (e) {
            reject(new Error(`Failed to parse Docker API response: ${e.message}. Raw data: ${responseData}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Docker API request failed: ${error.message}`));
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  /**
   * Get list of containers
   * @param {object} filters - Filters to apply to the list
   * @returns {Promise} - Promise resolving with the list of containers
   */
  async listContainers(filters = {}) {
    const queryParams = Object.keys(filters).length ? 
      `?filters=${encodeURIComponent(JSON.stringify(filters))}` : '';
    return this.request('GET', `/containers/json${queryParams}`);
  }

  /**
   * Get container information
   * @param {string} id - Container ID or name
   * @returns {Promise} - Promise resolving with the container info
   */
  async getContainer(id) {
    return this.request('GET', `/containers/${id}/json`);
  }

  /**
   * Start a container
   * @param {string} id - Container ID or name
   * @returns {Promise} - Promise resolving when the container starts
   */
  async startContainer(id) {
    return this.request('POST', `/containers/${id}/start`);
  }

  /**
   * Stop a container
   * @param {string} id - Container ID or name
   * @param {number} timeout - Timeout in seconds before killing the container
   * @returns {Promise} - Promise resolving when the container stops
   */
  async stopContainer(id, timeout = 10) {
    return this.request('POST', `/containers/${id}/stop?t=${timeout}`);
  }

  /**
   * Remove a container
   * @param {string} id - Container ID or name
   * @param {object} options - Remove options (v, force, link)
   * @returns {Promise} - Promise resolving when the container is removed
   */
  async removeContainer(id, options = { v: false, force: false, link: false }) {
    const queryParams = Object.entries(options)
      .filter(([_, value]) => value)
      .map(([key, _]) => `${key}=1`)
      .join('&');
    
    const endpoint = `/containers/${id}${queryParams ? `?${queryParams}` : ''}`;
    return this.request('DELETE', endpoint);
  }

  /**
   * Get list of images
   * @param {object} filters - Filters to apply to the list
   * @returns {Promise} - Promise resolving with the list of images
   */
  async listImages(filters = {}) {
    const queryParams = Object.keys(filters).length ? 
      `?filters=${encodeURIComponent(JSON.stringify(filters))}` : '';
    return this.request('GET', `/images/json${queryParams}`);
  }

  /**
   * Pull an image from the registry
   * @param {string} name - Image name
   * @param {string} tag - Image tag
   * @returns {Promise} - Promise resolving when the image is pulled
   */
  async pullImage(name, tag = 'latest') {
    return this.request('POST', `/images/create?fromImage=${name}&tag=${tag}`);
  }

  /**
   * Create a container
   * @param {object} config - Container configuration
   * @param {string} name - Container name
   * @returns {Promise} - Promise resolving with the created container
   */
  async createContainer(config, name = null) {
    const queryParams = name ? `?name=${name}` : '';
    return this.request('POST', `/containers/create${queryParams}`, config);
  }

  /**
   * Get system information
   * @returns {Promise} - Promise resolving with system info
   */
  async getSystemInfo() {
    return this.request('GET', '/info');
  }

  /**
   * Get Docker version information
   * @returns {Promise} - Promise resolving with version info
   */
  async getVersion() {
    return this.request('GET', '/version');
  }

  /**
   * Ping the Docker API
   * @returns {Promise} - Promise resolving with OK if Docker is responding
   */
  async ping() {
    return this.request('GET', '/_ping');
  }

  /**
   * Get container logs
   * @param {string} id - Container ID or name
   * @param {object} options - Log options (follow, stdout, stderr, since, until, timestamps, tail)
   * @returns {Promise} - Promise resolving with container logs
   */
  async getContainerLogs(id, options = { stdout: true, stderr: true }) {
    const queryParams = Object.entries(options)
      .map(([key, value]) => {
        if (typeof value === 'boolean') {
          return value ? `${key}=1` : '';
        }
        return `${key}=${value}`;
      })
      .filter(Boolean)
      .join('&');
    
    const endpoint = `/containers/${id}/logs${queryParams ? `?${queryParams}` : ''}`;
    return this.request('GET', endpoint);
  }

  /**
   * List Docker networks
   * @param {object} filters - Filters to apply to the list
   * @returns {Promise} - Promise resolving with the list of networks
   */
  async listNetworks(filters = {}) {
    const queryParams = Object.keys(filters).length ? 
      `?filters=${encodeURIComponent(JSON.stringify(filters))}` : '';
    return this.request('GET', `/networks${queryParams}`);
  }

  /**
   * List Docker volumes
   * @param {object} filters - Filters to apply to the list
   * @returns {Promise} - Promise resolving with the list of volumes
   */
  async listVolumes(filters = {}) {
    const queryParams = Object.keys(filters).length ? 
      `?filters=${encodeURIComponent(JSON.stringify(filters))}` : '';
    return this.request('GET', `/volumes${queryParams}`);
  }
}

module.exports = DockerApiClient;