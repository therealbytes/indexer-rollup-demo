document.addEventListener('DOMContentLoaded', async function () {

    const utils = ethers.utils;

    // Define constants
    const RPC_URL_L1 = 'http://localhost:9545';
    const RPC_URL_INDEXER = 'http://localhost:10545';
    const L1_CONTRACT_ADDRESS = '0xe1Aa25618fA0c7A1CFDab5d6B456af611873b629';
    const INDEXER_CONTRACT_ADDRESS = '0x1100000000000000000000000000000000000011'
    const L1_CONTRACT_ABI = '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"addr","type":"address"},{"indexed":false,"internalType":"bytes32","name":"storageRoot","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"NewValue","type":"event"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"},{"internalType":"address","name":"","type":"address"}],"name":"gasUsed","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"storageRoot","type":"bytes32"},{"internalType":"address","name":"addr","type":"address"}],"name":"getGasUsed","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"addr","type":"address"}],"name":"getLastGasUsed","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"addr","type":"address"}],"name":"getLastStorageRoot","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"storageRoot","type":"bytes32"}],"name":"getTotalProvenGas","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"lastStorageRoot","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"totalProvenGas","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"storageRoot","type":"bytes32"},{"internalType":"address","name":"addr","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes[]","name":"proof","type":"bytes[]"}],"name":"verifyAndSetGasUsed","outputs":[],"stateMutability":"nonpayable","type":"function"}]';
    const PRIVATE_KEY = "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6";

    // Create providers for each RPC using ethers.js
    const providerL1 = new ethers.providers.JsonRpcProvider(RPC_URL_L1);
    const providerIndexer = new ethers.providers.JsonRpcProvider(RPC_URL_INDEXER);

    // Create a Wallet instance with the private key and connect it to the provider
    const walletL1 = new ethers.Wallet(PRIVATE_KEY, providerL1);
    const contractL1 = new ethers.Contract(L1_CONTRACT_ADDRESS, L1_CONTRACT_ABI, walletL1);

    let targetAddress = "0x0000000000000000000000000000000000000000";
    let chart;

    const urlAddr = getURLParameter('address');
    if (ethers.utils.isAddress(urlAddr)) {
        setAddress(urlAddr);
    }

    function getURLParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    // Function to update the three text boxes
    function setData(l1Value, indexerValue, deltaValue) {
        console.log("Setting data: ", l1Value, indexerValue, deltaValue);
        document.getElementById('textbox-l1').textContent = l1Value;
        document.getElementById('textbox-index').textContent = indexerValue;
        document.getElementById('textbox-delta').textContent = deltaValue;
    }

    // Function to set the address textbox
    function setAddress(address) {
        targetAddress = address;
        const addressBox = document.getElementById('textbox-address');
        addressBox.textContent = address;
    }

    function getAddress() {
        return targetAddress;
    }

    function storageKey(address) {
        // Convert the address to its bytes form
        const addressBytes = utils.arrayify(address);

        // Ensure the address is 20 bytes long (this should always be true for Ethereum addresses)
        if (addressBytes.length !== 20) {
            throw new Error('Address has an unexpected byte length');
        }

        // Create a 32-byte version of the address by left-padding with zeros
        const paddedAddress = utils.zeroPad(addressBytes, 32);

        // Create a bytes32 representation of zero
        const zeroBytes32 = utils.hexZeroPad('0x0', 32);

        // Concatenate the padded address and zeroBytes32
        const concatenatedBytes = utils.concat([paddedAddress, zeroBytes32]);

        // Compute the keccak256 hash
        const hash = utils.keccak256(concatenatedBytes);

        return hash;
    }

    async function getGasUsedAtBlock(address, blockNumber) {
        const key = storageKey(address);
        const proofIdx = await providerIndexer.send('eth_getProof', [INDEXER_CONTRACT_ADDRESS, [key], blockNumber]);
        const gasIdxHex = proofIdx.storageProof[0].value;
        const gasIdxBigNumber = ethers.BigNumber.from(gasIdxHex);
        return gasIdxBigNumber;
    }

    async function updateData(address) {
        const gasIdxBigNumber = await getGasUsedAtBlock(address, 'latest');
        const gasL1Hex = await contractL1.getLastGasUsed(address);
        const gasL1BigNumber = ethers.BigNumber.from(gasL1Hex);
        const gasIdxMM = gasIdxBigNumber.div(1000).toNumber() / 1000;
        const gasL1MM = gasL1BigNumber.div(1000).toNumber() / 1000;
        const deltaMM = gasIdxBigNumber.sub(gasL1BigNumber).div(1000).toNumber() / 1000;
        setData(gasL1MM + " M", gasIdxMM + " M", "+" + deltaMM + " M");
    }

    async function sendProof(address) {
        const key = storageKey(address);
        const proofIdx = await providerIndexer.send('eth_getProof', [INDEXER_CONTRACT_ADDRESS, [key], 'latest']);

        if (proofIdx.storageProof[0].value === "0x0") {
            alert("No value found for address: " + address);
            return;
        }

        console.log("Sending proof for address: ", address);
        console.log("Storage key: ", key);
        console.log("Proof: ", proofIdx);

        try {
            // Call a function that might revert
            const txResponse = await contractL1.verifyAndSetGasUsed(
                proofIdx.storageHash,
                address,
                proofIdx.storageProof[0].value,
                proofIdx.storageProof[0].proof,
            )
            console.log("Transaction Hash:", txResponse.hash);

            // Wait for the transaction to be mined
            const receipt = await txResponse.wait();
            console.log("Transaction Receipt:", receipt);

            if (receipt.status === 0) {
                console.error('Transaction failed');
            } else {
                console.log('Transaction successful', receipt);
            }

        } catch (error) {
            // Check for error code to handle different types of errors
            if (error.code === 'CALL_EXCEPTION') {
                console.error('Transaction failed:', error.reason); // This will display the revert reason
            } else {
                console.error('Error:', error);
            }
        }

        updateData(address);
    }

    async function updateChart(address) {
        let blockNumber = await providerIndexer.getBlockNumber();
        let blockNumbers = [];
        while (blockNumber > 10 && blockNumbers.length < 10) {
            blockNumbers.push(blockNumber);
            blockNumber -= 10;
        }
        blockNumbers = blockNumbers.reverse();
        console.log("Block numbers: ", blockNumbers);
        let gasUsed = [];
        for (let i = 0; i < blockNumbers.length; i++) {
            // TODO: wait in parallel
            gasUsed.push(await getGasUsedAtBlock(address, '0x' + blockNumbers[i].toString(16)));
        }
        gasUsed = gasUsed.map((x) => x.div(100000).toNumber() / 10);
        console.log("Gas used: ", gasUsed);

        if (!chart) {
            const chartData = {
                labels: blockNumbers,
                datasets: [{
                    // label: 'Total Gas Used',
                    borderColor: '#10b981',
                    data: gasUsed,
                    fill: false,
                }]
            };

            const config = {
                type: 'line',
                data: chartData,
                options: {
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Block Number'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Million Gas'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            };

            chart = new Chart(document.getElementById('chart'), config);
        } else {
            chart.data.labels = blockNumbers;
            chart.data.datasets[0].data = gasUsed;
            chart.update();
        }
    }

    // Form submission event
    document.getElementById('search-form').addEventListener('submit', function (event) {
        event.preventDefault();  // Prevent the default form submission behavior

        // Get the search box element
        const searchBox = document.querySelector('input[placeholder="Search..."]');

        let address = searchBox.value.trim();

        // Validate Ethereum address using ethers.js
        if (ethers.utils.isAddress(address)) {
            console.log('Valid Ethereum address:', address);
            // Further processing for valid addresses if required
            if (!address.startsWith('0x')) {
                address = '0x' + address;
            }
        } else {
            console.error('Invalid Ethereum address:', address);
            // Handle invalid address input, perhaps by showing an error to the user
            alert("Enter a valid Ethereum address");
            return;
        }

        // Clear the content of the search box
        searchBox.value = '';

        // Any other actions you want on form submission
        setAddress(address);
        updateData(address);
        updateChart(address);
    });

    // Update button
    document.getElementById('update-button').addEventListener('click', function () {
        sendProof(getAddress());
    });

    // Example: Update the text boxes
    updateData(getAddress());
    updateChart(getAddress());

    providerIndexer.on('block', (blockNumber) => {
        if (blockNumber % 1 === 0) {
            updateData(getAddress());
        }
        if (blockNumber % 10 === 0) {
            updateChart(getAddress());
        }
    });
});