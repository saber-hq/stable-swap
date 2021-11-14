{ pkgs }:
pkgs.mkShell { buildInputs = [ (import ./env.nix { inherit pkgs; }) ]; }
