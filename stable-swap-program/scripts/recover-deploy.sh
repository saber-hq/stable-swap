#!/usr/bin/env bash
set -ex

cd $(dirname $0)/..

CLUSTER=$1
solana config set --url $CLUSTER || {
    echo "Unsupported network: $CLUSTER"
    exit 1
}

if [ ! -d "./target/deploy" ]; then
    echo "StableSwap binary not found."
    exit 1
fi

echo "Starting deploy recovery"
mkdir -p $HOME/stableswap_deployments/$CLUSTER/
RECOVERY_FILE_PATH="$HOME/stableswap_deployments/$CLUSTER/recovery.json"
solana-keygen recover -o $RECOVERY_FILE_PATH $2

STABLE_SWAP_ID="$(solana deploy target/deploy/stable_swap.so $RECOVERY_FILE_PATH --output json | jq .programId -r)"

if [ -z "$STABLE_SWAP_ID" ]; then
    echo "Error deploying program"
    exit 1
fi

echo "StableSwap ProgramID: $STABLE_SWAP_ID"

jq -n --arg CLUSTER ${CLUSTER} --arg STABLE_SWAP_ID ${STABLE_SWAP_ID} \
    '{clusterUrl: $CLUSTER, "swapProgramID": $STABLE_SWAP_ID}' > "$HOME/stableswap_deployments/$CLUSTER/program.json"
