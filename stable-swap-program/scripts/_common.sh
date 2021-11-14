setup_solana_cluster() {
    if [ -f "../.env" ]; then
        source ../.env
    elif [[ $CLUSTER == "localnet" ]]; then
        echo "Warning: .env does not exist. A new keypair for the upgrade authority will be generated."
    elif [ -z "$UPGRADE_AUTHORITY_KEYPAIR" ]; then
        echo "UPGRADE_AUTHORITY_KEYPAIR required."
        exit 1
    fi

    export CLUSTER=$1
    if [ -z "$CLUSTER" ]; then
        echo "No cluster specified."
        exit 1
    fi

    # Set up the network config
    SOLANA_ENDPOINT=$CLUSTER
    if [[ $CLUSTER == "localnet" ]]; then
        SOLANA_ENDPOINT="localhost"
    fi
    solana config set --url $SOLANA_ENDPOINT || {
        echo "Invalid cluster $CLUSTER"
        exit 1
    }
    solana config set --commitment confirmed

    export ALL_DEPLOYMENTS_DIR=$HOME/stableswap_deployments
    export CLUSTER_DEPLOYMENT_DIR=$ALL_DEPLOYMENTS_DIR/$CLUSTER
    mkdir -p $CLUSTER_DEPLOYMENT_DIR
    mkdir -p $ALL_DEPLOYMENTS_DIR/program_ids/

    # Get the program ID
    CLUSTER_PROGRAM_INFO=$CLUSTER_DEPLOYMENT_DIR/program.json
    if [ -f "$CLUSTER_PROGRAM_INFO" ]; then
        export SWAP_PROGRAM_ID=$(cat $CLUSTER_PROGRAM_INFO | jq -r .programId)
    else
        if [[ $CLUSTER == "localnet" ]]; then
            mkdir -p tmp
            TMP_SWAP_PROGRAM_ID_PATH=tmp/localnet-programid-$RANDOM.json
            solana-keygen new --no-passphrase --outfile $TMP_SWAP_PROGRAM_ID_PATH
            export SWAP_PROGRAM_ID=$(solana address --keypair $TMP_SWAP_PROGRAM_ID_PATH)
            mv $TMP_SWAP_PROGRAM_ID_PATH $ALL_DEPLOYMENTS_DIR/program_ids/$SWAP_PROGRAM_ID.json
            echo "On localnet and keyfile not found; generated new program id $SWAP_PROGRAM_ID."
        else
            echo "Previous program deployment not found. Reading from deployment_config.json."
            export SWAP_PROGRAM_ID=$(cat ./deployment_config.json | jq -r .program_id)
        fi
    fi
    export SWAP_PROGRAM_ID_PATH=$ALL_DEPLOYMENTS_DIR/program_ids/$SWAP_PROGRAM_ID.json

    # Set up the deployer key
    export DEPLOYER_KP=$CLUSTER_DEPLOYMENT_DIR/deployer.keypair.json
    if [ ! -f "$DEPLOYER_KP" ]; then
        echo "Generating a keypair for this deploy..."
        solana-keygen new --no-passphrase --outfile $DEPLOYER_KP
    fi
    export DEPLOYER_ADDRESS=$(solana address --keypair $DEPLOYER_KP)
    echo "Deployer address: $DEPLOYER_ADDRESS"

    solana config set --keypair $DEPLOYER_KP

    export SWAP_ADMIN_ACCOUNT=$(cat ./deployment_config.json | jq -r .admin_account)
    export UPGRADE_AUTHORITY=$(cat ./deployment_config.json | jq -r .upgrade_authority)

    if [ ! -f "$DEPLOYER_KP" ]; then
        echo "Deployer keypair $DEPLOYER_KP does not exist. Exiting."
        exit 1
    fi
}
