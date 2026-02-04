/**
 * OAuth Handler for MCP Servers
 * Manages OAuth 2.0 authentication flows
 * 
 * Built by Toki for OpenClaw
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const crypto = require('crypto');

class OAuthHandler {
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.authUrl = config.authUrl;
    this.tokenUrl = config.tokenUrl;
    this.redirectUri = config.redirectUri || 'http://localhost:3000/oauth/callback';
    this.scopes = config.scopes || [];
    
    this.tokens = {};
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state) {
    const url = new URL(this.authUrl);
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('redirect_uri', this.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', this.scopes.join(' '));
    url.searchParams.set('state', state || this.generateState());
    
    return url.toString();
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code) {
    const url = new URL(this.tokenUrl);
    const postData = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      client_secret: this.clientSecret
    }).toString();

    return new Promise((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const tokens = JSON.parse(data);
            this.tokens = tokens;
            resolve(tokens);
          } catch (e) {
            reject(new Error(`Token exchange failed: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  /**
   * Refresh access token
   */
  async refreshToken() {
    if (!this.tokens.refresh_token) {
      throw new Error('No refresh token available');
    }

    const url = new URL(this.tokenUrl);
    const postData = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.tokens.refresh_token,
      client_id: this.clientId,
      client_secret: this.clientSecret
    }).toString();

    return new Promise((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const tokens = JSON.parse(data);
            this.tokens = { ...this.tokens, ...tokens };
            resolve(this.tokens);
          } catch (e) {
            reject(new Error(`Token refresh failed: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  /**
   * Get current access token
   */
  getAccessToken() {
    return this.tokens.access_token;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired() {
    if (!this.tokens.expires_at) {
      return false;
    }
    return Date.now() >= this.tokens.expires_at;
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidToken() {
    if (this.isTokenExpired() && this.tokens.refresh_token) {
      await this.refreshToken();
    }
    return this.getAccessToken();
  }

  /**
   * Generate random state for CSRF protection
   */
  generateState() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Start local OAuth callback server
   */
  startCallbackServer(port = 3000) {
    return new Promise((resolve, reject) => {
      const server = http.createServer(async (req, res) => {
        const url = new URL(req.url, `http://localhost:${port}`);
        
        if (url.pathname === '/oauth/callback') {
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`<h1>Authorization Failed</h1><p>${error}</p>`);
            server.close();
            reject(new Error(`OAuth error: ${error}`));
            return;
          }

          if (code) {
            try {
              const tokens = await this.exchangeCodeForToken(code);
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end('<h1>Success!</h1><p>You can close this window and return to OpenClaw.</p>');
              server.close();
              resolve(tokens);
            } catch (e) {
              res.writeHead(500, { 'Content-Type': 'text/html' });
              res.end(`<h1>Token Exchange Failed</h1><p>${e.message}</p>`);
              server.close();
              reject(e);
            }
          }
        }
      });

      server.listen(port, () => {
        console.log(`[OAuth] Callback server listening on port ${port}`);
      });

      server.on('error', reject);
    });
  }
}

module.exports = OAuthHandler;
