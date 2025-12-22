# FRACTAL »» CHAOS SHOOTER

**% GEOMETRIC VIOLENCE MEETS BOSS BATTLES IN YOUR BROWSER %**

---

## #! WHAT IS THIS

Brutal top-down arena shooter built with raw JavaScript & Canvas API. No frameworks. No mercy. No BS.

**Wave-based mayhem** // **Epic boss fights** // **Reality-warping abilities** // **Inventory management** // **Death by geometry**

## $$ CONTROLS

### MOVEMENT & COMBAT

- **WASD / ARROWS** » move your existence
- **DOUBLE-TAP WASD** » DASH with invincibility frames!
- **MOUSE CLICK** » shoot projectiles (hold to auto-fire)
- **RIGHT CLICK** » use inventory items (bombs/crystals/stars)
- **F / F11** » toggle fullscreen
- **P / ESC** » pause (coward break)
- **R** » restart after inevitable death

### INVENTORY SELECTION + EXTRAS

- **1-3** » select inventory slot (bombs, crystals, or stars)
- **9** » test spawn Mage boss
- **7** » test spawn Nova boss
- **K** » toggle Nova pause (debug)
- **F2** » screenshot -> saves to `documents/FRACTAL/scrennshots`

## !? ENEMY TYPES

Rectangle-based terror. All unique. All deadly.

- **DUMB** » walks straight. Zero brain cells.
- **MEDIUM** » shoots projectiles at you
- **SMART** (yellow center) » dodges your shots & fires back
- **TELEPORT** (cyan center) » blinks across the map

## !! BOSS BATTLES

### MAGE BOSS (Purple Magic)

- **800 HP** with invulnerability shield
- **Teleportation** across arena
- **Wall summoning** (2-4 walls per cast, max 12 on screen)
- **Push/pull forces** yanking you around
- **Purple projectile spam**
- Spawns at **level 8**, then **every 6 levels**
- Drops **Shock Crystal** on defeat
- **Stars deal 150 damage** (bypass shield)

### NOVA BOSS (Chaos Incarnate)

- **800 HP** ultra-hard challenge
- **Lightning lasers** that vaporize everything
- **Player teleportation** - she moves YOU with a little hand!!
- **Enemy summoning** mid-fight
- **Color inversion** glitch effect
- **UI scrambling** with random symbols
- **Glitch areas** distorting reality
- **Disappear/reappear** (comes back 2 levels later with saved health)
- **Stars break her shield** and deal 150 damage
- **Key 7** to spawn, **K** to pause

## & INVENTORY SYSTEM (3 SLOTS, STACKABLE)

### BOMBS

- Dropped by dumb enemies (10% chance)
- Dropped by medium/smart enemies (30% chance)
- **Stack up to 8** per slot
- **Right-click** to place (3 max at once)
- Explode after 2 seconds
- **Fire bombs** create long-lasting fire patches (~15 seconds)
- **Destroy walls** (only bombs can!)

### SHOCK CRYSTALS

- Dropped by **Mage boss** on death
- **Right-click** to trigger **screen-wide shockwave**
- Kills ALL enemies instantly
- Particle explosion madness

### STARS

- **Purchase from Star Orbs** (80 XP cost)
- **Right-click** to throw bouncing projectile
- Bounces off screen borders
- **Kills enemies instantly**
- **Damages bosses** (150 HP, breaks Nova's shield)
- Lasts 6 seconds (shrinks & fades)
- Rotates & leaves trail particles
- **Force-buy with key 8** (spawns orb instantly)

## % POWER-UPS & COLLECTIBLES

**Yellow squares** = health restoration  
**Magenta squares** = triple-shot (3 projectiles, 5 seconds)  
**Green orbs** = XP (5/10 points, collect 80 for star)  
**Cyan crystals** = shock wave from Mage  
**Yellow stars** = bouncing killer projectile  
**Cyan hourglass** = TIME WARP (slows everything except you for 8 seconds!)
**White circle** = pushpull - pushes enemies, pulls xp orbs, makes you invencible for 10s

## @ GAME FEATURES

```
» VHS glitch effects & chromatic aberration
» Screen shake on every kill
» Dynamic lighting system with shadows
» Particle explosions with performance optimization
» Level transition animations
» Death animation that shows your shame
» Accuracy tracking (hits vs shots fired)
» Progressive difficulty scaling
» Boss-specific mechanics
» Dynamic cursor (changes per item type)
» Boss health bars scale with HP
» Auto-shoot when holding click
```

## >> SPECIAL MECHANICS

### Death Messages

- **Context-aware algorithm** analyzes how you died
- Boss-specific roasts
- Accuracy-based mockery
- Level-dependent shame
- Enemy swarm detection
- Over **100 unique messages** like:
  - "Skill issue"
  - "Nova scrambled your existence into pixels"
  - "Rectangles: 1, You: 0"
  - "Your ancestors are disappointed"

### Wall Mechanics

- Summoned by Mage boss
- **Block projectiles** (no pass-through)
- **Only destroyed by bombs** (not shots)
- Strategic obstacles

**Requirements:** ES6+ browser. No ancient relics.

## >> CODE STRUCTURE

```
source/
├── index.html          (Entry point)
├── root.css            (VHS-style UI)
└── classes/
    ├── Game.js         (3000+ lines - main orchestrator)
    ├── index.js        (Initialization)
    ├── bosses/         (Mage, Nova)
    ├── entities/       (Player, Enemy, Wall)
    ├── projectiles/    (Player, Enemy, NovaLaser)
    ├── items/          (7 types - bombs, stars, crystals, XP)
    ├── effects/        (Particles, ScreenShake, Lights, Fire)
    ├── systems/        (InputHandler, Cursor)
    └── utils/          (DeathMessages - 100+ roasts)
```

## // TECH STACK

- **Vanilla JavaScript (ES6+)** - Pure chaos, zero dependencies
- **HTML5 Canvas API** - Raw pixel manipulation
- **Modular ES6 Classes** - 23 files, organized by category
- **Custom particle systems** - Explosions, trails, glitch aura
- **State machines** - Boss AI behaviors
- **No frameworks** - Just skill and canvas methods

---

## $ PROGRESSION

**Levels 1-7:** Enemy waves, collect XP, buy stars  
**Level 8+:** Mage boss spawns (every 6 levels)  
**Each 10 levels** Nova spawns (if killed)
**Each 2 levels** Nova comes back (if not killed)
**Death:** Read hilarious message, press R, try not to cry

## !! TIPS

- Dodge > aim (especially at low accuracy)
- Save shock crystals for boss fights
- Stars break Nova's shield - use them wisely
- Bombs destroy walls (projectiles don't)
- Hold click for auto-fire
- Nova inverts colors randomly (it's intentional)
- "Skill issue" is a diagnosis, not an insult

---

**#! FRACTAL »»**

_"Died of cringe" - Death Messages Algorithm, 2025_
