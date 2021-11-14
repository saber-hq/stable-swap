#!/usr/bin/env bash
set -ex

# Program deployer script.

cd $(dirname $0)
source _common.sh

CLUSTER=$1

# reset on localnet
if [[ $CLUSTER == "localnet" ]]; then
    echo "On localnet, clearing old program deploy."
    rm -fr $HOME/stableswap_deployments/localnet/
fi

setup_solana_cluster $CLUSTER

if [ ! -f "$SWAP_PROGRAM_ID_PATH" ]; then
    echo "Swap program ID path $SWAP_PROGRAM_ID_PATH does not exist. Cannot deploy."
    exit 1
fi

if solana program show $SWAP_PROGRAM_ID; then
    echo "Program already deployed at $SWAP_PROGRAM_ID. Did you mean to upgrade?"
    exit 1
fi

SOL_BALANCE=$(solana balance $DEPLOYER_KP --lamports | awk '{ print $1 }')

# We need about 8 SOL for a successful deploy
MIN_SOL_BALANCE_LAMPORTS=8000000000
if [[ "$SOL_BALANCE" -lt "$MIN_SOL_BALANCE_LAMPORTS" ]]; then
    if [[ $CLUSTER == "localnet" ]]; then
        echo "On localnet. Requesting SOL airdrop."
        solana airdrop 10 $DEPLOYER_ADDRESS
    elif [[ $CLUSTER != "mainnet-beta" ]]; then
        echo "Not on mainnet. Requesting SOL airdrop."
        for i in {1..8}; do
            solana airdrop 1 $DEPLOYER_ADDRESS
        done
    else
        echo "Not enough SOL in the deployer. Need 8 SOL to deploy."
        echo "Deployer address:"
        solana address
        exit 1
    fi
fi

echo "Deploying program to $SWAP_PROGRAM_ID..."
solana program deploy \
    --program-id $SWAP_PROGRAM_ID_PATH \
    ../target/deploy/stable_swap.so

echo "StableSwap deployed to ProgramID: $SWAP_PROGRAM_ID"

echo "Changing upgrade authority to $UPGRADE_AUTHORITY"
solana program set-upgrade-authority $SWAP_PROGRAM_ID --new-upgrade-authority $UPGRADE_AUTHORITY

echo "Program deploy complete. Saving deployment result."
OUTFILE=$CLUSTER_DEPLOYMENT_DIR/program.json
solana program show $SWAP_PROGRAM_ID --output json > $OUTFILE
cat $OUTFILE | jq .
