const http = require('http');
const https = require('https');
const url = require('url');

const roninApiKey = '4x98szVhMNZNONiyOSNTajVQuxyI60aP'; // Your API Key
const nftContractAddress = '0x87a344111effac64f4fd81bc64c17049da937f74';
const proxyPort = 3001; // Port for this proxy server to listen on
const allowedOrigin = 'http://localhost:8000'; // The origin of your frontend

const server = http.createServer((req, res) => {
    const requestUrl = url.parse(req.url, true);
    const ownerAddress = requestUrl.query.ownerAddress; // Get owner address from query param

    // --- Basic Routing ---
    if (requestUrl.pathname === '/fetch-nfts' && ownerAddress) {
        console.log(`Proxy received request for NFTs for address: ${ownerAddress}`);

        // --- Prepare request to Ronin API ---
        const options = {
            hostname: 'api.roninchain.com',
            // Guessing v2 path and 'asset_contract_address' parameter
            path: `/api/v2/addresses/${ownerAddress}/nfts?asset_contract_address=${nftContractAddress}`,
            method: 'GET',
            headers: {
                'X-API-Key': roninApiKey,
                'Accept': 'application/json',
                'User-Agent': 'Node.js-Proxy-Server' // Good practice to identify your client
            }
        };

        // --- Make the actual API call ---
        const apiReq = https.request(options, (apiRes) => {
            let data = '';

            apiRes.on('data', (chunk) => {
                data += chunk;
            });

            apiRes.on('end', () => {
                console.log(`Ronin API responded with status: ${apiRes.statusCode}`);
                // --- Send response back to frontend ---
                // IMPORTANT: Add CORS header to allow frontend access
                res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(apiRes.statusCode); // Use the status code from Ronin API
                res.end(data); // Send the raw data received from Ronin API
            });
        });

        apiReq.on('error', (error) => {
            console.error('Error calling Ronin API:', error);
            // --- Send error response back to frontend ---
            res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to fetch from Ronin API', details: error.message }));
        });

        apiReq.end(); // Send the request

    } else {
        // --- Handle unknown paths ---
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin); // Still need CORS for errors
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

server.listen(proxyPort, () => {
    console.log(`NFT Proxy Server listening on http://localhost:${proxyPort}`);
    console.log(`Accepting requests from ${allowedOrigin}`);
    console.log(`Forwarding requests to api.roninchain.com with contract ${nftContractAddress}`);
});

server.on('error', (error) => {
    console.error('Proxy Server Error:', error);
});
