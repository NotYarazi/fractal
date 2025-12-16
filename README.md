# FRACTAL »» CHAOS SHOOTER

**% GEOMETRIC VIOLENCE MEETS BOSS BATTLES IN YOUR BROWSER %**

---

## #! WHAT IS THIS

Brutal top-down arena shooter built with raw JavaScript & Canvas API. No frameworks. No mercy. No BS.

**Wave-based mayhem** // **Epic boss fights** // **Reality-warping abilities** // **Inventory management** // **Death by geometry**

## $$ CONTROLS

### MOVEMENT & COMBAT

-   **WASD / ARROWS** » move your existence
-   **MOUSE CLICK** » shoot projectiles
-   **RIGHT CLICK** » use inventory items (bombs/crystals/stars)
-   **P / ESC** » pause (coward break)
-   **R** » restart after inevitable death

### INVENTORY SELECTION

-   **1-3** » select inventory slot (bombs, crystals, or stars)
-   **8** » force-buy star (-80 XP, instant spawn)
-   **9** » test spawn Mage boss
-   **7** » test spawn Nova boss
-   **K** » toggle Nova pause (debug)

## !? ENEMY TYPES

Rectangle-based terror. All unique. All deadly.

-   **DUMB** » walks straight. Zero brain cells.
-   **MEDIUM** » shoots projectiles at you
-   **SMART** (yellow center) » dodges your shots & fires back
-   **TELEPORT** (cyan center) » blinks across the map

## !! BOSS BATTLES

### MAGE BOSS (Purple Magic)

-   **800 HP** with invulnerability shield
-   **Teleportation** across arena
-   **Wall summoning** to trap you
-   **Push/pull forces** yanking you around
-   **Purple projectile spam**
-   Spawns at **level 8**, then **every 6 levels**
-   Drops **Shock Crystal** on defeat

### NOVA BOSS (Chaos Incarnate)

-   **800 HP** ultra-hard challenge
-   **Lightning lasers** that vaporize everything
-   **Player teleportation** - she moves YOU
-   **Enemy summoning** mid-fight
-   **Color inversion** glitch effect
-   **UI scrambling** with random symbols
-   **Glitch areas** distorting reality
-   **Random disappear/reappear** with health saved
-   **Key 7** to spawn, **K** to pause

## & INVENTORY SYSTEM (3 SLOTS MAX)

### BOMBS

-   Dropped by dumb enemies (10% chance)
-   Dropped by medium/smart enemies (30% chance)
-   **Right-click** to place (3 max at once)
-   Explode after 2 seconds
-   Create fire patches
-   **Destroy walls** (only bombs can!)

### SHOCK CRYSTALS

-   Dropped by **Mage boss** on death
-   **Right-click** to trigger **screen-wide shockwave**
-   Kills ALL enemies instantly
-   Particle explosion madness

### STARS

-   **Purchase from Star Orbs** (80 XP cost)
-   **Right-click** to throw bouncing projectile
-   Bounces off screen borders
-   **Kills everything** it touches
-   Lasts 6 seconds (shrinks & fades)
-   Rotates & leaves trail particles
-   **Force-buy with key 8** (spawns orb instantly)

## % POWER-UPS & COLLECTIBLES

**Yellow squares** = health restoration  
**Magenta squares** = triple-shot (3 projectiles, 5 seconds)  
**Green orbs** = XP (5/10 points, collect 80 for star)  
**Cyan crystals** = shock wave from Mage  
**Yellow stars** = bouncing killer projectile

## @ GAME FEATURES

```
» VHS glitch effects & chromatic aberration
» Screen shake on every kill
» Dynamic lighting system with shadows
» Particle explosions (50-150 per event)
» Level transition animations
» Death animation that shows your shame
» Accuracy tracking (hits vs shots fired)
» Progressive difficulty scaling
» Boss-specific mechanics
» Inventory priority system
» Reality-warping Nova effects
```

## >> SPECIAL MECHANICS

### Accuracy System

-   Tracks every shot fired
-   Counts hits on ANY enemy (not just kills)
-   Displayed with snarky phrases:
    -   95%+ = "GODLIKE"
    -   69% = "NICE"
    -   <20% = "pathetic"

### Death Messages

-   **Context-aware algorithm** analyzes how you died
-   Boss-specific roasts
-   Accuracy-based mockery
-   Level-dependent shame
-   Enemy swarm detection
-   Over **100 unique messages** like:
    -   "Skill issue"
    -   "Nova scrambled your existence into pixels"
    -   "Rectangles: 1, You: 0"
    -   "Your ancestors are disappointed"

### Wall Mechanics

-   Summoned by Mage boss
-   **Block projectiles** (no pass-through)
-   **Only destroyed by bombs** (not shots)
-   Strategic obstacles

**Requirements:** ES6+ browser. No ancient relics.

## >> CODE STRUCTURE

```
source/
├── index.html          (Entry point)
├── root.css            (VHS-style UI)
└── classes/
    ├── Game.js         (2096 lines - main orchestrator)
    ├── index.js        (Initialization)
    ├── bosses/         (Mage, Nova)
    ├── entities/       (Player, Enemy, Wall)
    ├── projectiles/    (Player, Enemy, NovaLaser)
    ├── items/          (7 types - bombs, stars, crystals, XP)
    ├── effects/        (Particles, ScreenShake, Lights, Fire)
    ├── systems/        (InputHandler)
    └── utils/          (DeathMessages - 100+ roasts)
```

## // TECH STACK

-   **Vanilla JavaScript (ES6+)** - Pure chaos, zero dependencies
-   **HTML5 Canvas API** - Raw pixel manipulation
-   **Modular ES6 Classes** - 23 files, organized by category
-   **Custom particle systems** - Explosions, trails, glitch aura
-   **State machines** - Boss AI behaviors
-   **No frameworks** - Just skill and canvas methods

---

## $ PROGRESSION

**Levels 1-7:** Enemy waves, collect XP, buy stars  
**Level 8+:** Mage boss spawns (every 6 levels)  
**Anytime:** Spawn Nova with key 7 (chaos mode)  
**Death:** Read hilarious message, press R, try not to cry

## !! TIPS

-   Dodge > aim (especially at low accuracy)
-   Save shock crystals for boss fights
-   Stars are OP but cost 80 XP
-   Bombs destroy walls (projectiles don't)
-   Nova inverts colors randomly (it's intentional)
-   "Skill issue" is a diagnosis, not an insult
-   The rectangles ARE trying to help you

---

**#! FRACTAL »»**

_"Died of cringe" - Death Messages Algorithm, 2025_
