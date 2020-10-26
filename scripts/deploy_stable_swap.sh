set -e

if [ ! -d "./target/bpfel-unknown-unknown" ]; then
    ./do.sh build
fi

docker-compose up -d
if ! hash solana 2>/dev/null; then
    echo Installing Solana tool suite ...
    curl -sSf https://raw.githubusercontent.com/solana-labs/solana/v1.3.15/install/solana-install-init.sh | sh -s - v1.3.15
    export PATH="/home/runner/.local/share/solana/install/active_release/bin:$PATH"
    echo Generating keypair ...
    solana-keygen new -o ~/.config/solana/id.json --no-passphrase --silent
fi
solana config set --url "http://localhost:8899"
# solana config set --url "https://devnet.solana.com/"
sleep 1
solana airdrop 10 
STABLE_SWAP_ID="$(solana deploy target/bpfel-unknown-unknown/release/stable_swap.so | jq .programId -r)"
echo "StableSwap ProgramID:" $STABLE_SWAP_ID
