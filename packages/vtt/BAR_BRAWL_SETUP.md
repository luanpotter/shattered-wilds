# Bar Brawl Setup for Shattered Wilds

This document explains how Bar Brawl displays VP, FP, and SP as bars on tokens.

## Prerequisites

1. Install and enable the Bar Brawl module in Foundry VTT
2. Have the Shattered Wilds system installed and active

## ✨ **AUTOMATIC CONFIGURATION** ✨

### 🎯 **No Manual Setup Required!**

The Shattered Wilds system **automatically configures VP, FP, and SP bars** for all characters! Here's what happens automatically:

- **When opening a character sheet**: Bars are configured on the prototype token
- **When importing a character**: Bars are set up automatically  
- **When creating new tokens**: They inherit the configured bars
- **Resource updates**: Values sync in real-time

### 🎨 **Default Bar Configuration**

The system automatically sets up these bars in order (top to bottom):

1. **VP (Vitality Points)**: Red (#ff0000) → Green (#00ff00)
2. **FP (Focus Points)**: Dark Blue (#000080) → Light Blue (#87ceeb)  
3. **SP (Spirit Points)**: Purple (#800080) → Gold (#ffd700)

**Position**: Bottom-inner of token
**Visibility**: Always visible to everyone

### 🔄 **Automatic Resource Syncing**

The system exposes these resources for Bar Brawl:

- **HP** (Heroism Points): `system.resources.hp`
- **VP** (Vitality Points): `system.resources.vp`
- **FP** (Focus Points): `system.resources.fp`  
- **SP** (Spirit Points): `system.resources.sp`
- **AP** (Action Points): `system.resources.ap`

## Manual Customization (Optional)

If you want to customize the default bars:

### Setting Up Token Bars Manually

1. **Open Prototype Token Configuration**:
   - Go to Actors Directory
   - Right-click on actor → "Configure Token"

2. **Modify Resource Bars**:
   - Go to the "Resources" tab (Bar Brawl interface)
   - Edit existing bars or add new ones

3. **Alternative Bar Configurations**:

   **For VP (Vitality Points)**:
   - Attribute: `system.resources.vp.value`
   - Max Value: `system.resources.vp.max`
   - Color: Red (#ff0000) to Green (#00ff00)

   **For FP (Focus Points)**:
   - Attribute: `system.resources.fp.value`
   - Max Value: `system.resources.fp.max`
   - Color: Dark Blue (#000080) to Light Blue (#87ceeb)

   **For SP (Spirit Points)**:
   - Attribute: `system.resources.sp.value`
   - Max Value: `system.resources.sp.max`
   - Color: Purple (#800080) to Gold (#ffd700)

4. **Alternative Positioning**:
   - Try "top-inner", "bottom-outer", etc.
   - Adjust order for different stacking

### Bar Appearance Tips

- **Position**: "Bottom" works well for hex tokens
- **Visibility**: "Always" for player characters, "Owner Hover" for NPCs
- **Style**: "Rounded" or "Standard" both work well
- **Height**: Default or slightly increased for better visibility

## Notes

- Resource values update automatically when changed in the character sheet
- Bars will reflect current/max values calculated by the system
- Colors and positioning can be customized per your preference
- Bar Brawl settings can be configured globally for all tokens if desired

## Troubleshooting

If bars don't appear:

1. Ensure Bar Brawl is enabled and active
2. Verify the token is linked to an actor with character data
3. Check that the actor has imported character props (use Import/Export feature)
4. Refresh the token or re-open token configuration
5. Check browser console for any errors
