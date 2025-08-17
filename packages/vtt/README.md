# Shattered Wilds - Foundry VTT System

A **WIP** Foundry VTT system implementation for the Shattered Wilds and D12 RPG System.

## Requirements

- **Foundry VTT**: Version 13 or later
- **Optional Modules**:
  - **Dice So Nice!** - For 3D dice animations
  - **Bar Brawl** - Necessary for the 3 token bars

## Installation

### Automatic (Recommended)

1. Open Foundry VTT
2. Go to "Game Systems" tab
3. Click "Install System"
4. Search for "Shattered Wilds"
5. Click Install

### Manual Installation

1. Download the latest [system.json](https://github.com/luanpotter/shattered-wilds/releases/latest/download/system.json)
2. In Foundry, go to "Game Systems" → "Install System"
3. Paste this URL in "Manifest URL":

   ```text
   https://github.com/luanpotter/shattered-wilds/releases/latest/download/system.json
   ```

4. Click "Install"

### Direct Download

1. Download [shattered-wilds.zip](https://github.com/luanpotter/shattered-wilds/releases/latest/download/shattered-wilds.zip)
2. Extract to your Foundry `Data/systems/` folder
3. Restart Foundry

## Development

This system is part of the larger [Shattered Wilds project](https://github.com/luanpotter/shattered-wilds) monorepo.

### Building

```bash
cd packages/vtt
bun install
bun run build
```

### Releasing

```bash
./scripts/release.sh 0.1.0
```

## Links

- **Project Repository**: <https://github.com/luanpotter/shattered-wilds>
- **Shattered Wilds Rules**: <https://d12.nexus>
- **Character Simulator**: <https://d12.nexus/simulator>
- **Issue Tracker**: <https://github.com/luanpotter/shattered-wilds/issues>
