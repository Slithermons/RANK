document.addEventListener('DOMContentLoaded', () => {
    // Homepage elements
    const homepageContainer = document.querySelector('.container');
    const connectWalletBtn = document.getElementById('connectWalletBtn');

    // Dashboard elements
    const fullDashboard = document.getElementById('full-dashboard');
    const walletAddressDashSpan = document.getElementById('walletAddressDash');
    const ronBalanceDashSpan = document.getElementById('ronBalanceDash');
    const walletAddressDashCardSpan = document.getElementById('walletAddressDashCard'); // In the stat card
    const ronBalanceDashCardSpan = document.getElementById('ronBalanceDashCard'); // In the stat card
    const disconnectBtn = document.getElementById('disconnectBtn');
    const dashboardNavLinks = document.querySelectorAll('.dashboard-nav a');
    const dashboardTabContents = document.querySelectorAll('.dashboard-tab-content');
    const nftDisplayArea = document.getElementById('nft-display-area');
    const nftLoadingMessage = document.getElementById('nft-loading-message');
    const nftDetailModal = document.getElementById('nft-detail-modal');
    const modalCloseBtn = nftDetailModal.querySelector('.modal-close-btn');
    const modalNftName = document.getElementById('modal-nft-name');
    const modalNftImage = document.getElementById('modal-nft-image');
    const modalNftId = document.getElementById('modal-nft-id');
    const modalNftDescription = document.getElementById('modal-nft-description');
    const modalNftAttributesList = nftDetailModal.querySelector('#modal-nft-attributes ul');

    // Game Alert Modal elements
    const gameAlertModal = document.getElementById('game-alert-modal');
    const gameAlertCloseBtns = gameAlertModal.querySelectorAll('.game-alert-close');
    const goToDiscordBtn = document.getElementById('goToDiscordBtn');


    // Store original button text & wallet address
    const originalButtonText = connectWalletBtn.textContent; // "CONNECT WALLET"
    let currentWalletAddress = null; // Store connected address
    const nftContractAddress = '0x87a344111effac64f4fd81bc64c17049da937f74'; // The specific contract
    const roninApiKey = '4x98szVhMNZNONiyOSNTajVQuxyI60aP'; // Your API Key

    // --- Dummy NFT Data (Keep as fallback/reference) ---
    const dummyNfts = [
        {
            id: 101,
            name: 'Cyber Ronin #101',
            image: 'https://via.placeholder.com/150/00ff88/000000?text=NFT+101',
            description: 'A skilled warrior from the digital frontier.',
            attributes: [ { trait_type: 'Class', value: 'Warrior' }, { trait_type: 'Element', value: 'Lightning' }, { trait_type: 'Level', value: 5 } ]
        },
        {
            id: 234,
            name: 'Mecha Beast #234',
            image: 'https://via.placeholder.com/150/ffaa00/000000?text=NFT+234',
            description: 'Mechanical guardian of the ancient ruins.',
            attributes: [ { trait_type: 'Class', value: 'Tank' }, { trait_type: 'Material', value: 'Titanium' }, { trait_type: 'Power', value: 8 } ]
        },
        {
            id: 555,
            name: 'Pixel Pal #555',
            image: 'https://via.placeholder.com/150/00aaff/000000?text=NFT+555',
            description: 'A friendly companion from the 8-bit era.',
            attributes: [ { trait_type: 'Type', value: 'Companion' }, { trait_type: 'Color', value: 'Blue' }, { trait_type: 'Rarity', value: 'Common' } ]
        },
         {
            id: 707,
            name: 'Shadow Agent #707',
            image: 'https://via.placeholder.com/150/8800ff/000000?text=NFT+707',
            description: 'Operates in the darkness, unseen and unheard.',
            attributes: [ { trait_type: 'Class', value: 'Assassin' }, { trait_type: 'Stealth', value: 10 }, { trait_type: 'Faction', value: 'Syndicate' } ]
        }
    ];
    // --- End Dummy Data ---


    function initializeApp() {
        // Check if Ronin Wallet (Tanto) is installed
        if (typeof window.ronin === 'undefined' || !window.ronin.provider) {
            console.log('Ronin Wallet not detected initially.');
            // Wait a bit and check again, as the extension might inject late
            setTimeout(() => {
                if (typeof window.ronin === 'undefined' || !window.ronin.provider) {
                    console.log('Ronin Wallet still not detected after delay.');
                    connectWalletBtn.textContent = 'INSTALL WALLET'; // Update button text
                    connectWalletBtn.disabled = false; // Enable button
                    connectWalletBtn.onclick = () => {
                        window.open('https://wallet.roninchain.com/', '_blank'); // Link to Ronin Wallet download
                    };
                } else {
                    console.log('Ronin Wallet detected after delay.');
                    setupWalletConnection();
                }
            }, 500); // Wait 500ms
        } else {
            console.log('Ronin Wallet detected immediately.');
            setupWalletConnection();
        }
    }

    function setupWalletConnection() {
        const provider = window.ronin.provider;
        connectWalletBtn.textContent = originalButtonText; // Restore original text ('CONNECT WALLET')
        connectWalletBtn.disabled = false; // Ensure button is enabled

        connectWalletBtn.onclick = async () => {
            try {
                // Request account access
                const accounts = await provider.request({ method: 'eth_requestAccounts' });
                if (accounts && accounts.length > 0) {
                    const address = accounts[0];
                    // Populate dashboard elements
                    walletAddressDashSpan.textContent = address;
                    walletAddressDashCardSpan.textContent = address; // Also in the card

                    // Fetch RON balance
                    const balanceWei = await provider.request({
                        method: 'eth_getBalance',
                        params: [address, 'latest']
                    });

                    currentWalletAddress = address; // Store the address

                    // Convert balance from Wei to RON (1 RON = 10^18 Wei)
                    const balanceRon = (BigInt(balanceWei) / BigInt('1000000000000000000')).toString();
                    ronBalanceDashSpan.textContent = balanceRon; // Just the number
                    ronBalanceDashCardSpan.textContent = balanceRon; // Also in the card

                    // Hide homepage, show dashboard
                    homepageContainer.style.display = 'none';
                    fullDashboard.style.display = 'flex'; // Use flex as defined in CSS

                    // Fetch NFTs for the connected wallet
                    fetchAndDisplayNFTs(currentWalletAddress);

                    // Update connect button state (optional, as it's hidden now)
                    // connectWalletBtn.textContent = 'CONNECTED';
                    // connectWalletBtn.disabled = true;
                } else {
                    alert('No accounts found. Please ensure your Ronin Wallet is unlocked and connected.');
                    connectWalletBtn.disabled = false; // Re-enable if connection failed or cancelled
                }
            } catch (error) {
                console.error('Error connecting to Ronin Wallet:', error);
                alert(`Failed to connect Ronin Wallet: ${error.message || error}`);
                connectWalletBtn.disabled = false; // Re-enable on error
            }
        };
    }

    // Disconnect logic
    disconnectBtn.addEventListener('click', () => {
        // Hide dashboard, show homepage
        fullDashboard.style.display = 'none';
        homepageContainer.style.display = 'grid'; // Restore original display type

        // Reset connect button (important!)
        connectWalletBtn.textContent = originalButtonText;
        connectWalletBtn.disabled = false;

        // Clear displayed data (optional)
        walletAddressDashSpan.textContent = '';
        ronBalanceDashSpan.textContent = '';
        walletAddressDashCardSpan.textContent = '';
        ronBalanceDashCardSpan.textContent = '';

        // Note: This doesn't truly "disconnect" from the wallet provider perspective,
        // it just resets the UI state. A full disconnect might involve more complex
        // state management if needed for security reasons.
        currentWalletAddress = null; // Clear stored address
    });

    // Tab Switching Logic
    dashboardNavLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default anchor behavior
            const targetTab = link.getAttribute('data-tab');

            // Update active link style
            dashboardNavLinks.forEach(navLink => navLink.classList.remove('active'));
            link.classList.add('active');

            // Show/Hide tab content
            dashboardTabContents.forEach(content => {
                if (content.id === `tab-${targetTab}`) {
                    content.style.display = 'block';
                    content.classList.add('active'); // Keep track using class as well
                } else {
                    content.style.display = 'none';
                    content.classList.remove('active');
                }
            });

            // Optional: Re-fetch NFTs if the NFT tab is clicked again?
            // if (targetTab === 'nft' && currentWalletAddress) {
            //    fetchAndDisplayNFTs(currentWalletAddress);
            // }
        });
    });

    // Function to fetch and display NFTs
    async function fetchAndDisplayNFTs(ownerAddress) {
        if (!ownerAddress) return;

        nftDisplayArea.innerHTML = ''; // Clear previous NFTs
        nftLoadingMessage.style.display = 'block'; // Show loading message
        nftLoadingMessage.textContent = 'Loading your NFTs...';
        nftLoadingMessage.style.color = 'var(--text-muted)'; // Reset color

        // --- Actual API Call ---
        // Using the official base URL and assuming standard practices
        // --- Call the Local Proxy Server ---
        // The proxy server will handle the actual call to the Ronin API and add the API key.
        const proxyUrl = `http://localhost:3001/fetch-nfts?ownerAddress=${ownerAddress}`; // Send owner address as query param
        console.log(`Attempting to fetch NFTs from proxy: ${proxyUrl}`); // <-- ADDED LOGGING

        try {
            // No API key needed here; the proxy adds it.
            const response = await fetch(proxyUrl);
            console.log(`Proxy response status: ${response.status}`); // <-- ADDED LOGGING

            if (!response.ok) {
                // Attempt to get error message from response body (sent by proxy)
                let errorBody = '';
                try {
                    errorBody = await response.text();
                } catch (_) { /* Ignore if body cannot be read */ }
                throw new Error(`API Error: ${response.status} ${response.statusText}. ${errorBody}`);
            }

            const data = await response.json();

            // --- Process the response ---
            // Adjust based on the ACTUAL structure returned by the API.
            // Common structures: data.result.items, data.nfts, data.tokens, data directly being an array
            const nfts = data?.result?.items || data?.nfts || data?.tokens || (Array.isArray(data) ? data : []);

            if (nfts && nfts.length > 0) {
                nftLoadingMessage.style.display = 'none'; // Hide loading message

                nfts.forEach(nft => {
                    // Extract details - **ADJUST PROPERTY NAMES BASED ON ACTUAL API RESPONSE**
                    const nftId = nft.id || nft.token_id || nft.tokenId; // Common variations
                    const nftName = nft.name || nft.metadata?.name || `NFT #${nftId}`; // Check metadata object
                    let nftImageUrl = nft.image || nft.metadata?.image || nft.image_url || 'https://via.placeholder.com/150/333/a8ff00?text=NFT'; // Check metadata
                    const nftDescription = nft.description || nft.metadata?.description || 'No description available.';
                    const nftAttributes = nft.attributes || nft.metadata?.attributes || []; // Check metadata

                    // Handle potential IPFS URLs
                    if (nftImageUrl && nftImageUrl.startsWith('ipfs://')) {
                         nftImageUrl = `https://ipfs.io/ipfs/${nftImageUrl.split('ipfs://')[1]}`;
                         // Consider using a dedicated gateway if available/faster e.g., Ronin's IPFS gateway
                    }

                    const card = document.createElement('div');
                card.className = 'nft-card';
                // Store data on the element for easy access later
                card.dataset.nftId = nft.id;
                card.dataset.nftName = nft.name;
                    card.dataset.nftId = nftId;
                    card.dataset.nftName = nftName;
                    card.dataset.nftImage = nftImageUrl;
                    card.dataset.nftDescription = nftDescription;
                    // Store attributes as JSON string
                    card.dataset.nftAttributes = JSON.stringify(nftAttributes);

                    card.innerHTML = `
                        <img src="${nftImageUrl}" alt="${nftName}" loading="lazy">
                        <h4>${nftName}</h4>
                        <p>ID: ${nftId}</p>
                `;

                // Add click listener to each card
                card.addEventListener('click', () => {
                    showNftDetails(card.dataset);
                });

                nftDisplayArea.appendChild(card);
            });

            } else {
                nftLoadingMessage.textContent = 'No NFTs found for this contract address.';
            }

        } catch (error) {
            console.error('Error fetching NFTs:', error);
            nftLoadingMessage.textContent = `Error loading NFTs: ${error.message}`;
            nftLoadingMessage.style.color = 'red'; // Indicate error
        }
        // --- End Actual API Call ---
    }

    // Function to show NFT details in modal
    function showNftDetails(nftData) {
        modalNftName.textContent = nftData.nftName;
        modalNftImage.src = nftData.nftImage;
        modalNftImage.alt = nftData.nftName;
        modalNftId.textContent = nftData.nftId;
        modalNftDescription.textContent = nftData.nftDescription || 'No description available.';

        // Populate attributes
        modalNftAttributesList.innerHTML = ''; // Clear previous attributes
        try {
            const attributes = JSON.parse(nftData.nftAttributes);
            if (attributes && attributes.length > 0) {
                attributes.forEach(attr => {
                    const li = document.createElement('li');
                    // Adjust based on actual attribute structure (e.g., trait_type, value)
                    li.innerHTML = `<strong>${attr.trait_type || 'Attribute'}:</strong> ${attr.value || 'N/A'}`;
                    modalNftAttributesList.appendChild(li);
                });
                 modalNftAttributesList.parentElement.style.display = 'block'; // Show attributes section
            } else {
                 modalNftAttributesList.parentElement.style.display = 'none'; // Hide if no attributes
            }
        } catch (e) {
            console.error("Error parsing NFT attributes", e);
             modalNftAttributesList.parentElement.style.display = 'none'; // Hide on error
        }


        nftDetailModal.style.display = 'block'; // Show the modal
    }

    // Function to close the modal
    function closeModal() {
        nftDetailModal.style.display = 'none';
    }

    // Event listeners for closing the modal
    modalCloseBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        // Close if clicked outside the modal content
        if (event.target === nftDetailModal) {
            closeModal();
        }
    });

    // --- Game Alert Modal Logic ---
    function openGameAlertModal() {
        if (gameAlertModal) {
            gameAlertModal.style.display = 'block';
        }
    }

    function closeGameAlertModal() {
        if (gameAlertModal) {
            gameAlertModal.style.display = 'none';
        }
    }

    // Add listeners to all close buttons/elements for the game alert modal
    gameAlertCloseBtns.forEach(btn => {
        btn.addEventListener('click', closeGameAlertModal);
    });

    // Listener for the "Go to Discord" button
    if (goToDiscordBtn) {
        goToDiscordBtn.addEventListener('click', () => {
            window.open('https://discord.gg/RgPhJQS2', '_blank'); // Open Discord link in new tab
            closeGameAlertModal(); // Close the modal after clicking
        });
    }

    // Close game alert modal if clicked outside
    window.addEventListener('click', (event) => {
        if (event.target === gameAlertModal) {
            closeGameAlertModal();
        }
    });

    // --- Modify Click Listener for Game Launch Image Button ---
    const gameLaunchBtn = document.querySelector('.game-launch-image-btn');
    if (gameLaunchBtn) {
        gameLaunchBtn.addEventListener('click', () => {
            console.log('Game Launch Image Button Clicked!');
            openGameAlertModal(); // Show the custom alert modal instead of default alert
        });
    }
    // --- End Game Launch Listener ---


    // Initially disable the button until check is complete
    connectWalletBtn.disabled = true;
    connectWalletBtn.textContent = 'CHECKING...'; // Shorter text for button

    // Start the initialization process
    initializeApp();

    // Add a note about the storage error potential cause
    console.log("Developer Note: If you see 'Access to storage is not allowed' errors, try serving index.html using a local web server (e.g., VS Code Live Server) instead of opening the file directly. Wallet SDKs often require an http/https context.");

});
