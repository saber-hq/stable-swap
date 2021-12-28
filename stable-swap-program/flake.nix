{
  description = "StableSwap development environment.";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    saber-overlay.url = "github:saber-hq/saber-overlay";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, saber-overlay, flake-utils }:
    flake-utils.lib.eachSystem [
      "aarch64-darwin"
      "x86_64-darwin"
      "x86_64-linux"
    ] (system:
      let
        pkgs = import nixpkgs { inherit system; }
          // saber-overlay.packages.${system};
        env = import ./env.nix { inherit pkgs; };
      in {
        devShell = pkgs.mkShell { buildInputs = [ env ]; };
        packages.ci = env;
        defaultPackage = env;
      });
}
