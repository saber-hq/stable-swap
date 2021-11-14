{
  description = "StableSwap development environment.";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    nixpkgs-stableswap.url = "github:stableswap/nixpkgs-stableswap";
    nixpkgs-stableswap.inputs.nixpkgs.follows = "nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, nixpkgs-stableswap, flake-utils }:
    flake-utils.lib.eachSystem [
      "aarch64-darwin"
      "x86_64-darwin"
      "x86_64-linux"
    ] (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ nixpkgs-stableswap.overlay ];
        };
        env = import ./env.nix { inherit pkgs; };
      in {
        devShell = import ./shell.nix { inherit pkgs; };
        defaultPackage = env;
      });
}
