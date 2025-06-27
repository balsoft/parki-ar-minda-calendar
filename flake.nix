{
  inputs.nixpkgs.url = "github:nixos/nixpkgs";

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system: with nixpkgs.legacyPackages.${system}; {
        devShells.default = mkShell {
          packages = [
            webdav
            typescript
            typescript-language-server
            vscode-langservers-extracted
            prettier
          ];
        };
      }
    );
}
