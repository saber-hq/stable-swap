#!/usr/bin/env bash

set -ex
cd "$(dirname "$0")"

solana_version="1.8.11"
export PATH="$HOME"/.local/share/solana/install/active_release/bin:"$PATH"

usage() {
    cat <<EOF
Usage: do.sh <action> <action specific arguments>
Supported actions:
    build
    clean
    e2e-test
    test
    update
EOF
}

perform_action() {
    case "$1" in
    build)
        (
            cargo build-bpf --manifest-path program/Cargo.toml
        )
        ;;
    clean)
        (
            rm -rf scripts/tmp
            cargo clean
            yarn --cwd sdk clean
        )
        ;;
    e2e-test)
        (
            solana-test-validator --quiet &
            rm -rf scripts/tmp
            ./do.sh build
            yarn --cwd sdk install
            # Possible race condition here if the validator isn't up
            ./scripts/deploy-program.sh localnet
            yarn --cwd sdk test-int ${@:2}
        )
        ;;
    help)
        usage
        exit
        ;;
    test)
        cargo test-bpf --manifest-path program/Cargo.toml -- --test-threads 1 ${@:2}
        ;;
    update)
        (
            exit_code=0
            which solana-install || exit_code=$?
            if [ "$exit_code" -eq 1 ]; then
                echo Installing Solana tool suite ...
                sh -c "$(curl -sSfL https://release.solana.com/v${solana_version}/install)"
            fi
            solana-install update
        )
        ;;
    *)
        echo "Error: Unknown command"
        usage
        exit
        ;;
    esac
}

if [[ $1 == "update" ]]; then
    perform_action "$1"
    exit
else
    if [[ "$#" -lt 1 ]]; then
        usage
        exit
    fi
    if ! hash solana 2>/dev/null; then
        ./do.sh update
    fi
fi

perform_action "$1" "${@:2}"
