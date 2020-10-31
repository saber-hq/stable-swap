#!/usr/bin/env bash

cd "$(dirname "$0")"

usage() {
    cat <<EOF
Usage: do.sh <action> <action specific arguments>
Supported actions:
    build
    build-lib
    clean
    clippy
    doc
    dump
    fmt
    test
    e2e-test
    update
EOF
}

sdkParentDir=bin
sdkDir="$sdkParentDir"/bpf-sdk
profile=bpfel-unknown-unknown/release

perform_action() {
    set -e
    projectDir="$PWD"
    targetDir=target
    case "$1" in
    build)
        if [[ -f "$projectDir"/Xargo.toml ]]; then
          "$sdkDir"/rust/build.sh "$projectDir"

          so_path="$targetDir/$profile"
          so_name="stable_swap"
          cp "$so_path/${so_name}.so" "$so_path/${so_name}_debug.so"
          "$sdkDir"/dependencies/llvm-native/bin/llvm-objcopy --strip-all "$so_path/${so_name}.so" "$so_path/$so_name.so"
        else
            echo "$projectDir does not contain a program, skipping"
        fi
        ;;
    build-lib)
        (
            echo "build $projectDir"
            export RUSTFLAGS="${@:2}"
            cargo build
        )
        ;;
    clean)
            "$sdkDir"/rust/clean.sh $PWD
            rm -rf lib/client/lib
        ;;
    clippy)
        (
            cargo +nightly clippy  --features=program ${@:2}
        )
        ;;
    e2e-test)
        (
            docker-compose up -d
            ./scripts/deploy_stable_swap.sh
            yarn --cwd lib/client install
            yarn --cwd lib/client test
            docker-compose down
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
        # - greadelf
        # - rustfilt
        (
            pwd
            "$0" build "$2"

            so_path="$targetDir/$profile"
            so_name="${2//\-/_}"
            so="$so_path/${so_name}_debug.so"
            dump="$so_path/${so_name}_dump"

            echo $so_path
            echo $so_name
            echo $so
            echo $dump

            if [ -f "$so" ]; then
                ls \
                    -la \
                    "$so" \
                    >"${dump}_mangled.txt"
                greadelf \
                    -aW \
                    "$so" \
                    >>"${dump}_mangled.txt"
                "$sdkDir/dependencies/llvm-native/bin/llvm-objdump" \
                    -print-imm-hex \
                    --source \
                    --disassemble \
                    "$so" \
                    >>"${dump}_mangled.txt"
                sed \
                    s/://g \
                    <"${dump}_mangled.txt" |
                    rustfilt \
                        >"${dump}.txt"
            else
                echo "Warning: No dump created, cannot find: $so"
            fi
        )
        ;;
    fmt)
        (
            cargo fmt ${@:2}
        )
        ;;
    help)
            usage
            exit
        ;;
    test)
        (
            cargo test --features=program ${@:2}
        )
        ;;
    update)
            mkdir -p $sdkParentDir
            ./scripts/bpf-sdk-install.sh $sdkParentDir
        ;;
    *)
        echo "Error: Unknown command"
        usage
        exit
        ;;
    esac
}

set -e
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
