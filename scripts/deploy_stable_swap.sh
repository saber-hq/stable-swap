set -e

if [ ! -d "./target/bpfel-unknown-unknown" ]; then
    ./do.sh build
fi

if ! hash solana 2>/dev/null; then
    echo Installing Solana tool suite ...
    curl -sSf https://raw.githubusercontent.com/solana-labs/solana/v1.3.15/install/solana-install-init.sh | sh -s - v1.3.15
    export PATH="/home/runner/.local/share/solana/install/active_release/bin:$PATH"
    echo Generating keypair ...
    solana-keygen new -o ~/.config/solana/id.json --no-passphrase --silent
fi

CLUSTER_URL=""
if [[ $1 == "localnet" ]]; then
    CLUSTER_URL="http://localhost:8899" 
elif [[ $1 == "devnet" ]]; then
    CLUSTER_URL="https://devnet.solana.com"
elif [[ $1 == "testnet" ]]; then
    CLUSTER_URL="https://testnet.solana.com" 
else
    echo "Unsupported network: $1"
    exit 1
fi

echo "Deploying stableswap to $1"
solana config set --url $CLUSTER_URL
sleep 1
solana airdrop 10 
STABLE_SWAP_ID="$(solana deploy target/bpfel-unknown-unknown/release/stable_swap.so | jq .programId -r)"
echo "StableSwap ProgramID:" $STABLE_SWAP_ID
jq -n --arg CLUSTER_URL ${CLUSTER_URL} --arg STABLE_SWAP_ID ${STABLE_SWAP_ID} \
    '{clusterUrl: $CLUSTER_URL, "swapProgramId": $STABLE_SWAP_ID}' > last-deploy.json
