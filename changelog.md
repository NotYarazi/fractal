# 0.8.0 - Code Revolution, Enemies confusion (22rd december)
- DISCORD INTEGRATION ADDED!! (it's supa cool)
- Files organized (no more +3000 line game.js ahh)
- EASY CONFIG FILE!!!!! omgomg, all in: `classes/config/GameConfig.js`
- DASH MECHANIC!!!! double-tap any wasd key and dash (become immortal while dashing!)
- Time warp! - everything else moves 30% speed but you.
- UI CHANGE! The powerup's container is now more compact :3
- Now multishot powerup goes all the way to x7 bullets (random. fate.)
- Nova spawns every 10 levels - if killed.
- BAM! "pushpull" powerup is here. Push enemies, pull xp orbs while immune to any attack - for 10s! enjoy.
- F2 to screenshot. (saved to `documents/FRACTAL/screenshots`)
- All orbs are attracted to you when you pick up life-powerup.
- Removed `force_buy_stars` key.
- MORE DEATH MESSAGES - more cruel than ever.
- NOVA grabs u :3 instead of just.. teleporting whatever
- NOVA'S laser indicator is soo much visible, impossible to miss.
- COMBO SYSTEM IS HERE! Violently apears, violently desapears.
- Bullets are slightly more larger
- NOVA lasts longer in the fight before desapearing (30s)

# 0.7.0 - More speed, More Mechanics to more fates! (22rd december)
- Stars are HUGE!
- Max particles - from 500 to 120
- Now when leveled up, some enemies explode and some stay (it's called fate - 50%)
- More death messages!
- Auto shoot is here! Just keep your finger pressing the mouse button.
- Nerfed the explosion particles count to prevent lag.
- The particles queue instead of spawning all at once.
- Inventory System Remade! 3 slots for 3 items, stacks up to 9 each, use what you selected!
- Max walls on screen: 12 (new)
- Walls check for other walls before spawning, so it doesnt stack walls inside walls, that is a visual skill issue sign.
- Click "F" to switch fullscreen -> windowed
- Mage has now more health.
- Star buff: Deals damage to Mage and breaks nova's shield.
- Nova now re-apears 2 levels later.
- Firebombs now spread even more FIRE!
- CURSORS!!!! funny. They shape.
- Now bossbars scale (width) depending on the value.

# 0.6.0 - Um... technicly.. (16th december)
- Optimized particle limit
- Color inversion reduced
- Nova lazer: from line to BEAM
- START SEQUENCE!!!! insert card
- WINDOW/GAME!!!
- accuracy -> playerStyleTrack (defence/attack)
- BETTER GAME OVER SCREEN!

# 0.5.0 - BOOM AND PLUH! (15th december)
- Skiped a few versions.
- full screen
- vhs effects
- new type of enemy: medium (smart + dumb)
- accuracy counter
- level transition animations
- bomb. and firebombs
- Mage - teleports, attacks, glitches, is purple and drops a shockwave crystal.
- NOVA - the glitch, destroys, inverts, shoots lazer, moves player, spawns enemies and just goes away.
- funny death message

Controls: buy star (8), spawn mage (9), spawn nova (7), pause nova (k)

# 0.2.0 - YEAHHHHH (15th december)
## Level System
- Start at Level 1, progress by killing enemies
- Each level requires more kills (10, then 15, 20, etc.)
- Difficulty increases: spawn rate gets faster each level
- Level displayed in UI with kill progress tracker
## Three Enemy Types (same red sprite, tiny color indicators):
- Dumb (no dot) - Walks straight toward you (Level 1+)
- Smart (yellow dot) - Dodges your projectiles and shoots at you! (Level 2+)
- Teleport (cyan dot) - Fades out and teleports near you (Level 3+)
## Level Transition Animation
- Screen fades with colorful celebration particles
- "LEVEL X - GET READY!" message
- 3-second transition between levels
- All enemies/projectiles cleared
## Death Animation
- Massive explosion of 50+ particles
- Ultra-intense screen shake (30 intensity, 40 frames)
- Player sprite disappears
- 2-second dramatic death sequence before game over
## Smart Enemy AI
- Detects nearby projectiles and dodges perpendicular
- Maintains distance from player (150px)
- Shoots red projectiles every 2 seconds
- More health (40 HP vs 30)
## Teleport Enemy Mechanics
- Fades to transparent before teleporting
- Reappears near player (100-250px away)
- Teleports every 3 seconds
- Less health (25 HP) to balance
# Enhanced UI
- Level number
- Kill progress (X/Y enemies)
- Final level shown on game over

# 0.1.0 - Initial Release (15th december)