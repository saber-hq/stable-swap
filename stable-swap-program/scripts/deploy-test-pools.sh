#!/usr/bin/env bash
set -ex

cd $(dirname $0)
source _common.sh

setup_solana_cluster $1

echo "Deploying test pools to Solana cluster $CLUSTER with program $SWAP_PROGRAM_ID and admin $SWAP_ADMIN_ACCOUNT"
./stableswap deploy-pool \
    --cluster $CLUSTER \
    --admin_account $SWAP_ADMIN_ACCOUNT \
    --program_id $SWAP_PROGRAM_ID ${@:2}
