# DISCORD RICH PRESENCE SETUP

**% SHOW YOUR FRACTAL STATUS ON DISCORD %**

---

## #! OVERVIEW

FRACTAL includes Discord Rich Presence integration that displays your current game state directly in your Discord profile. This guide explains how to set up your own Discord application for Rich Presence if you're forking or modifying the project.

## $$ PREREQUISITES

- Discord account
- Discord Desktop app installed and running
- Node.js and npm (already required for FRACTAL)

## !! SETUP STEPS

### 1. CREATE DISCORD APPLICATION

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**
3. Name it (e.g., "FRACTAL" or your game name)
4. Click **Create**
5. Copy your **Application ID** from the General Information page

### 2. UPLOAD RICH PRESENCE ASSETS

Discord Rich Presence uses image assets that must be uploaded to your application.

1. In your Discord application page, navigate to **Rich Presence** > **Art Assets**
2. Upload the following images (create or use existing game assets):

**Required Assets:**

- **fractal_logo** - Main game logo (displayed when paused or starting)
- **death** - Death screen image
- **boss_mage** - Mage boss image
- **boss_nova** - Nova boss image
- **enemy_idle** - Enemy idle frame (animation frame 1)
- **enemy_jump** - Enemy jump frame (animation frame 2)
- **star** - Star icon (small image for combat indicator)
- **pause** - Pause icon (small image)
- **idle** - Idle player icon (small image)
- **combat** - Combat icon (small image)
- **storm** - Enemy storm icon (small image for 10+ enemies)

**Asset Requirements:**

- Minimum size: 512x512 pixels
- Maximum size: 4096x4096 pixels
- Format: PNG, JPG, or GIF
- File size: under 5MB per image

3. Name each asset exactly as listed above (case-sensitive)
4. Wait a few minutes for assets to process

### 3. UPDATE CLIENT ID

1. Open `src/rpc.js` in your project
2. Replace the **CLIENT_ID** constant with your Application ID (clientID):

```javascript
const CLIENT_ID = "YOUR_APPLICATION_ID_HERE";
```

### 4. TEST THE INTEGRATION

1. Make sure Discord Desktop is running
2. Start FRACTAL:

```bash
npm run start
```

3. Check your Discord profile - you should see your Rich Presence activity
4. Console will show connection status:

```
[Discord RPC] Connected as `YourUsername`
```

## & RICH PRESENCE FEATURES

### DISPLAYED INFORMATION

- **Current Level** - Shows player progression
- **Activity State** - Idle, Fighting, Boss Battle, Paused, Dead
- **Enemy Count** - Displays number of active enemies
- **Boss Fights** - Special display for Mage and Nova battles
- **Death Messages** - Shows cause of death
- **Animated Enemies** - Enemy images alternate every 800ms
- **Session Time** - Elapsed time since game start

### ACTIVITY STATES

**Starting** - Shows logo and "booting up..." message

**Playing** - Displays current level and activity:

- Idle state when standing still
- Combat state with enemy count
- Enemy storm warning for 10+ enemies

**Boss Fight** - Special display with boss name and image:

- "BOSS FIGHT - Level X"
- Boss-specific large image
- Combat indicator

**Paused** - Shows pause icon and "Taking a break..." message

**Dead** - Death screen with cause:

- Shows level or boss that killed you
- Displays death message
- Death icon as large image

### BUTTON

Rich Presence includes a **Get FRACTAL** button that links to the GitHub repository. Update this URL in `src/rpc.js` if you fork the project:

```javascript
buttons: [
  {
    label: "Get FRACTAL",
    url: "https://github.com/YOUR_USERNAME/YOUR_REPO",
  },
],
```

## !? TROUBLESHOOTING

### CONNECTION ISSUES

**Discord RPC not connecting:**

- Ensure Discord Desktop app is running (web version does not support RPC)
- Check that your Application ID is correct in `rpc.js`
- Verify `discord-rpc` package is installed: `npm install`
- Restart both Discord and FRACTAL

**Assets not showing:**

- Verify asset names match exactly (case-sensitive)
- Wait 5-10 minutes after uploading for Discord to process assets
- Check asset dimensions meet requirements (512x512 minimum)
- Re-upload assets and clear Discord cache if needed

**Console errors:**

```
[Discord RPC] Failed to connect: Could not connect
```

- Discord is not running or IPC is unavailable
- Try restarting Discord

```
[Discord RPC] Failed to update presence
```

- Application ID is invalid
- Assets are not properly configured

### DEVELOPMENT MODE

If you're testing frequently, Discord may rate-limit presence updates. This is normal and temporary.

## % CUSTOMIZATION

### MODIFYING PRESENCE LOGIC

The Rich Presence logic is in `src/rpc.js`. Key methods:

**updateState(state)** - Called from game to update presence data

**getActivityDetails()** - Determines what to display based on game state

**updatePresence()** - Sends activity to Discord

### ADDING NEW STATES

To add custom game states:

1. Update the state object in `getActivityDetails()`
2. Add corresponding image assets to Discord application
3. Call `updateState()` from game code with new state

### ANIMATION TIMING

Enemy image animation cycles every 800ms. Adjust in `startAnimation()`:

```javascript
this.animationInterval = setInterval(() => {
  // Change 800 to desired milliseconds
}, 800);
```

## !! DISTRIBUTION

If distributing your fork:

1. Users must create their own Discord application
2. Provide instructions for setting up CLIENT_ID
3. Include asset files in repository or provide templates
4. Document any custom states or features you've added

**Note:** Do not commit your Application ID to public repositories if you want to keep your application private.

---

**OPEN-SOURCE RPC** // **NO FRAMEWORKS** // **RAW IPC CONNECTION**
