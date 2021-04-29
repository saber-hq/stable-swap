#!/usr/bin/env bash

set -ex
cd "$(dirname "$0")"

solana_version="1.5.1"
export PATH="$HOME"/.local/share/solana/install/active_release/bin:"$PATH"

usage() {
    cat <<EOF
Usage: do.sh <action> <action specific arguments>
Supported actions:
    build
    build-lib
    deploy
    clean
    clippy
    doc
    dump
    new-swap
    fmt
    test
    e2e-test
    update
EOF
}

perform_action() {
    set -ex
    case "$1" in
    build)
        (
            cargo build-bpf
        )
        ;;
    build-lib)
        (
            export RUSTFLAGS="${@:2}"
            cargo build
        )
        ;;
    clean)
        (
            cargo clean
            rm -rf lib/client/lib
        )
        ;;
    clippy)
        (
            cargo +nightly clippy ${@:2}
        )
        ;;
    e2e-test)
        (
            docker-compose up -d
            ./scripts/deploy-stable-swap.sh localnet
            yarn --cwd sdk install
            yarn --cwd sdk test-int ${@:2}
            docker-compose down
        )
    ;;
    deploy)
        (
            ./scripts/deploy-stable-swap.sh $2
            ./do.sh new-swap
        )
    ;;
    doc)
        (
            echo "generating docs ..."
            cargo doc ${@:2}
        )
        ;;
    dump)
        # Dump depends on tools that are not installed by default and must be installed manually
        # - rustfilt
            cargo build-bpf --dump ${@:2}
        ;;
    fmt)
            cargo fmt ${@:2}
        ;;
    help)
            usage
            exit
        ;;
    new-swap)
            yarn --cwd lib/client install
            yarn --cwd lib/client new-swap
        ;;
    test)
            cargo test-bpf ${@:2}
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
    if [[ ! -d "$sdkDir" ]]; then
        ./do.sh update
    fi
fi

perform_action "$1" "${@:2}"
