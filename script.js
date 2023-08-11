document.addEventListener('DOMContentLoaded', async function () {

    const utils = ethers.utils;

    // Define the RPC URLs as constants
    const RPC_URL_L2 = 'http://localhost:8545';
    const RPC_URL_INDEXER = 'http://localhost:8545';
    const L2_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';
    const INDEXER_CONTRACT_ADDRESS = '0x1100000000000000000000000000000000000011'

    // Create providers for each RPC using ethers.js
    const providerL2 = new ethers.providers.JsonRpcProvider(RPC_URL_L2);
    const providerIndexer = new ethers.providers.JsonRpcProvider(RPC_URL_INDEXER);

    // Function to update the three text boxes
    function setData(l2Value, indexerValue, deltaValue) {
        document.getElementById('textbox-l2').textContent = l2Value;
        document.getElementById('textbox-index').textContent = indexerValue;
        document.getElementById('textbox-delta').textContent = deltaValue;
    }

    // Function to set the address textbox
    function setAddress(address) {
        const addressBox = document.getElementById('textbox-address');
        addressBox.textContent = address;
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

    async function updateData(address) {
        setAddress(address);
        console.log("Storage key: ", storageKey(address));
        const gasIdxHex = await providerL2.getStorageAt(INDEXER_CONTRACT_ADDRESS, storageKey(address));
        const gasIdxBigNumber = ethers.BigNumber.from(gasIdxHex);
        // const gasIdxNumber = gasIdxBigNumber.toNumber();
        const gasIdxMM = gasIdxBigNumber.div(1000000).toNumber();
        setData("0", gasIdxMM, "+" + gasIdxMM);
    }

    // Placeholder hooks for button clicks

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
        updateData(address);
    });

    // Update button
    document.getElementById('update-button').addEventListener('click', function () {
        console.log('Update button clicked!');
        // Add any additional functionality you want for this button click here
    });

    // Example: Update the text boxes
    setAddress("0x0000000000000000000000000000000000000000");

});