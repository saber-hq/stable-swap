#!/usr/bin/env bash

sudo apt install libssl-dev libudev-dev openssl
source $HOME/.cargo/env
sh -c "$(curl -sSfL https://release.solana.com/v1.6.6/install)"
