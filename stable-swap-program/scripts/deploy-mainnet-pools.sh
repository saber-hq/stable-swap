#!/usr/bin/env bash

cd $(dirname $0)
source _common.sh
setup_solana_cluster mainnet-beta

echo "Using admin $SWAP_ADMIN_ACCOUNT"

# Check to see if all mints exist
USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
USDT_MINT=Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB
WUSDC_MINT=FVsXUnbhifqJ4LiXQEbpUtXVdB8T5ADLKqSs5t1oc54F
WUSDT_MINT=9w97GdWUYYaamGwdKMKZgGzPduZJkiFizq4rz5CPXRv2

MINTS=(
    $USDC_MINT
    $USDT_MINT
    $WUSDC_MINT
    $WUSDT_MINT
)

# Ensure we have enough of each token
for MINT in $MINTS; do
    spl-token account-info
done

# Deploy the pools
deploy_pool() {
    echo "Deploying $1"
    ./stableswap deploy-pool \
        --cluster mainnet-beta \
        --admin_account $SWAP_ADMIN_ACCOUNT \
        --program_id $SWAP_PROGRAM_ID \
        "${@:2}"
}

deploy_pool "2pool (USDC-USDT)" \
    --token_a_mint $USDC_MINT \
    --token_b_mint $USDT_MINT

deploy_pool "WUSDC" \
    --token_a_mint $USDC_MINT \
    --token_b_mint $WUSDC_MINT

deploy_pool "WUSDT" \
    --token_a_mint $USDT_MINT \
    --token_b_mint $WUSDT_MINT
