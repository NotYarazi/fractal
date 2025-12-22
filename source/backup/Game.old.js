// Entities
import Player from "./entities/Player.js";
import Enemy from "./entities/Enemy.js";
import Wall from "./entities/Wall.js";

// Projectiles
import Projectile from "./projectiles/Projectile.js";
import EnemyProjectile from "./projectiles/EnemyProjectile.js";
import NovaLaser from "./projectiles/NovaLaser.js";

// Bosses
import Mage from "./bosses/Mage.js";
import Nova from "./bosses/Nova.js";

// Items & Powerups
import PowerUp from "./items/PowerUp.js";
import Bomb from "./items/Bomb.js";
import XPOrb from "./items/XPOrb.js";
import PlaceableBomb from "./items/PlaceableBomb.js";
import ShockCrystal from "./items/ShockCrystal.js";
import Star from "./items/Star.js";
import StarOrb from "./items/StarOrb.js";

// Effects
import Particle, {
  ExplosionParticle,
  ProjectileTrail,
} from "./effects/Particle.js";
import ScreenShake from "./effects/ScreenShake.js";
import Light, { LightingSystem } from "./effects/Light.js";
import FirePatch from "./effects/FirePatch.js";

// Systems
import InputHandler from "./systems/InputHandler.js";
import Cursor from "./systems/Cursor.js";
import RPCDetector from "./systems/RPCDetector.js";

// Utils
import DeathMessages from "./utils/DeathMessages.js";

export default class Game {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");

    // Make canvas fullscreen
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());

    /* BOOT SEQUENCE */
    this.vhsState = "waiting"; // waiting, booting, ready
    this.vhsBootTimer = 0;
    this.vhsBootDuration = 280;
    this.vhsStatic = [];
    this.vhsBlinkTimer = 0;
    this.vhsLogo = document.getElementById("vhsLogo");

    // Generate static pattern
    for (let i = 0; i < 1000; i++) {
      this.vhsStatic.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        brightness: Math.random(),
      });
    }

    // Click to start VHS boot
    this.canvas.addEventListener(
      "click",
      () => {
        if (this.vhsState === "waiting") {
          this.vhsState = "booting";
          this.vhsBootTimer = 0;
        }
      },
      { once: true }
    );

    // Auto-pause when window loses focus
    window.addEventListener("blur", () => {
      if (this.vhsState === "ready" && !this.gameOver && !this.paused) {
        this.paused = true;
      }
    });

    // Create input handler once in constructor
    this.input = new InputHandler();

    // Create custom cursor
    this.cursor = new Cursor();

    // Create Discord RPC detector
    this.rpcDetector = new RPCDetector(this);

    // Setup mouse listeners once in constructor (not in init to prevent duplicates on reset)
    this.input.setupMouseListeners(
      this.canvas,
      (x, y) => this.shoot(x, y),
      (x, y) => this.placeBomb(x, y)
    );

    this.init();

    // Start game loop
    this.lastTime = 0;
    this.animate(0);
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  init() {
    this.player = new Player(this.width / 2, this.height / 2);
    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.particles = [];
    this.MAX_PARTICLES = 120; // Performance cap
    this.particleQueue = []; // Staggered particle spawning to prevent lag spikes
    this.PARTICLES_PER_FRAME = 5; // Max particles to spawn per frame
    this.powerUps = [];
    this.xpOrbs = [];
    this.shockCrystals = []; // Shock crystals to collect
    this.starOrbs = []; // Star orbs to purchase
    this.stars = []; // Active bouncing stars
    this.mage = null; // Boss mage
    this.nova = null; // Boss nova
    this.novaActive = false; // Nova spawn state
    this.novaReappearLevel = null; // Level at which Nova will reappear
    this.novaLasers = []; // Nova's lightning lasers
    this.walls = []; // Mage summoned walls
    this.screenShake = new ScreenShake();
    this.lightingSystem = new LightingSystem();

    /* GENERAL INFO */
    this.score = 0;
    this.level = 1;
    this.enemiesKilled = 0;
    this.enemiesPerLevel = 16;
    this.gameOver = false;
    this.paused = false;

    /* ANIMATION STUFF */
    this.levelTransition = false;
    this.levelTransitionTimer = 0;
    this.levelTransitionDuration = 120; // 2 seconds
    this.levelTransitionExpandDuration = 30; // 0.5 seconds to expand
    this.levelTransitionHoldDuration = 60; // 1 second hold
    this.levelTransitionShrinkDuration = 30; // 0.5 seconds to shrink
    this.deathAnimation = false;
    this.deathAnimationTimer = 0;
    this.deathAnimationDuration = 120;
    this.deathMessage = "";
    this.deathCause = "";

    /* PLAYSTYLE TRACKING */
    this.damageDealt = 0; // Attack metric
    this.damageTaken = 0; // Defense metric
    this.shotsHit = 0; // Attack metric
    this.timeNearEnemies = 0; // Attack metric
    this.timeFarFromEnemies = 0; // Defense metric
    this.currentPlaystyle = "ATTACK"; // Current playstyle display

    this.enemySpawnTimer = 0;
    this.enemySpawnInterval = 120;
    this.powerUpSpawnTimer = 0;
    this.powerUpSpawnInterval = 600;

    /* POWERUP INFO */
    this.multiShotActive = false;
    this.multiShotTimer = 0;
    this.multiShotDuration = 300;

    /* AUTO-SHOOT SYSTEM */
    this.autoShootCooldown = 8;
    this.autoShootTimer = 0;

    /* VHS EFFECTS */
    this.vhsOffset = 0;
    this.glitchTimer = 0;
    this.glitchActive = false;
    this.glitchIntensity = 0;
    this.glitchSourceX = 0;
    this.glitchSourceY = 0;
    this.glitchRadius = 0;
    this.chromaticAberration = 0;
    this.scanlineOffset = 0;

    /* BOMB SYSTEM */
    this.bombs = [];
    this.bombSpawnTimer = 0;
    this.bombSpawnInterval = 300; // Check every 5 seconds
    this.firePatches = [];

    /* INVENTORY */
    this.placedBombs = []; // Bombs placed by player
    this.selectedSlot = 0; // Currently selected inventory slot (0-2)

    // Player light
    this.playerLight = new Light(
      this.player.getCenterX(),
      this.player.getCenterY(),
      150,
      "rgba(0, 255, 0, 0.3)"
    );
    this.lightingSystem.addLight(this.playerLight);

    // Get VHS logo element
    if (!this.vhsLogo) {
      this.vhsLogo = document.getElementById("vhsLogo");
    }
  }

  reset() {
    this.init();
    // Notify Discord RPC of new game
    if (this.rpcDetector) {
      this.rpcDetector.onNewGame();
    }
  }

  updateUI() {
    // Hide UI during VHS boot sequence
    const hudOverlay = document.querySelector(".hud-overlay");
    const controlsAscii = document.querySelector(".controls-ascii");
    const bombSlots = document.getElementById("bombSlots");
    const crystalSlots = document.getElementById("crystalSlots");
    const starSlots = document.getElementById("starSlots");

    if (this.vhsState !== "ready") {
      if (hudOverlay) hudOverlay.style.display = "none";
      if (controlsAscii) controlsAscii.style.display = "none";
      if (bombSlots) bombSlots.style.display = "none";
      if (crystalSlots) crystalSlots.style.display = "none";
      if (starSlots) starSlots.style.display = "none";
      return;
    }

    // Show UI when game is ready
    if (hudOverlay) hudOverlay.style.display = "block";

    const levelDisplay = document.getElementById("levelDisplay");
    const scoreDisplay = document.getElementById("scoreDisplay");
    const healthBar = document.getElementById("healthBar");
    const killsDisplay = document.getElementById("killsDisplay");
    const accuracyDisplay = document.getElementById("accuracyDisplay");
    const multishotPanel = document.getElementById("multishotPanel");
    const multishotProgress = document.getElementById("multishotProgress");

    // Hide controls after first input + 10 seconds
    if (controlsAscii) {
      controlsAscii.style.display = this.input.shouldShowInstructions()
        ? "block"
        : "none";
    }

    // Update unified inventory bar
    const inventoryBar = document.getElementById("inventoryBar");
    if (inventoryBar) {
      const hasItems = this.player.getTotalItemCount() > 0;
      if (!this.input.shouldShowInstructions() && hasItems) {
        inventoryBar.style.display = "flex";

        // Update each slot
        for (let i = 0; i < 3; i++) {
          const slotEl = document.getElementById(`invSlot${i}`);
          if (slotEl) {
            const slotType = this.player.getSlotType(i);
            const slotCount = this.player.getSlotCount(i);
            const iconEl = slotEl.querySelector(".inv-icon");
            const countEl = slotEl.querySelector(".inv-count");

            // Update classes
            let className = "inv-slot";
            if (i === this.selectedSlot) className += " selected";
            if (slotType) className += " has-item";
            slotEl.className = className;

            // Update icon and count
            if (slotType && iconEl && countEl) {
              const icons = { bomb: "💣", crystal: "💎", star: "⭐" };
              iconEl.textContent = icons[slotType] || "";
              countEl.textContent = slotCount > 1 ? slotCount : "";
            } else if (iconEl && countEl) {
              iconEl.textContent = "";
              countEl.textContent = "";
            }
          }
        }
      } else {
        inventoryBar.style.display = "none";
      }
    }

    // Update cursor based on selected item
    const selectedItemType = this.player.getSlotType(this.selectedSlot);
    this.cursor.setState(selectedItemType || "default");

    // Scramble text if Nova is active (reduced for readability)
    const scrambleText = (text) => {
      if (this.nova && this.nova.isActive && Math.random() > 0.8) {
        const chars = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`";
        return text
          .split("")
          .map((char) =>
            Math.random() > 0.7
              ? chars[Math.floor(Math.random() * chars.length)]
              : char
          )
          .join("");
      }
      return text;
    };

    if (levelDisplay)
      levelDisplay.textContent = scrambleText(`>> LVL ${this.level}`);
    if (scoreDisplay)
      scoreDisplay.textContent = scrambleText(`SCORE: ${this.score}`);
    if (killsDisplay)
      killsDisplay.textContent = scrambleText(
        `KILLS: ${this.enemiesKilled}/${this.enemiesPerLevel}`
      );

    // Health bar
    if (healthBar) {
      const healthPercent = this.player.health / 100;
      healthBar.style.width = `${healthPercent * 100}%`;
      if (healthPercent > 0.6) {
        healthBar.style.background = "#00ff00";
        healthBar.style.boxShadow = "0 0 10px rgba(0, 255, 0, 0.8)";
      } else if (healthPercent > 0.3) {
        healthBar.style.background = "#ffff00";
        healthBar.style.boxShadow = "0 0 10px rgba(255, 255, 0, 0.8)";
      } else {
        healthBar.style.background = "#ff0000";
        healthBar.style.boxShadow = "0 0 10px rgba(255, 0, 0, 0.8)";
      }
    }

    // Playstyle (renamed from accuracy)
    const playstyle = this.getPlaystyle();
    if (accuracyDisplay) accuracyDisplay.textContent = playstyle;

    // Debug: Show particle count (uncomment to enable)
    // if (accuracyDisplay) accuracyDisplay.textContent = `PARTS: ${this.particles.length}/${this.MAX_PARTICLES}`;

    // Multi-shot
    if (multishotPanel && multishotProgress) {
      if (this.multiShotActive) {
        multishotPanel.style.display = "block";
        const progress = (this.multiShotTimer / this.multiShotDuration) * 100;
        multishotProgress.style.width = `${progress}%`;
      } else {
        multishotPanel.style.display = "none";
      }
    }
  }

  getPlaystyle() {
    // Calculate attack score - pure offense metrics
    const attackScore = this.damageDealt + this.shotsHit * 5;

    // Calculate defense score - survival/damage avoidance (inverse of damage taken)
    const survivalBonus = Math.max(0, 500 - this.damageTaken); // High bonus for low damage
    const defenseScore = survivalBonus;

    // Update current playstyle for HUD
    if (attackScore > defenseScore * 1.5) {
      // Bias toward showing ATTACK
      this.currentPlaystyle = "ATTACK";
    } else {
      this.currentPlaystyle = "DEFENCE";
    }

    return this.currentPlaystyle;
  }

  getPlaystylePercentage() {
    // Return percentage for attack vs defense (for death screen)
    const attackScore = this.damageDealt + this.shotsHit * 5;
    const survivalBonus = Math.max(0, 500 - this.damageTaken);
    const defenseScore = survivalBonus;
    const total = attackScore + defenseScore;

    if (total === 0) return { attack: 50, defense: 50 };

    return {
      attack: Math.round((attackScore / total) * 100),
      defense: Math.round((defenseScore / total) * 100),
    };
  }

  easeOutElastic(x) {
    const c4 = (2 * Math.PI) / 3;
    return x === 0
      ? 0
      : x === 1
      ? 1
      : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
  }

  easeInBack(x) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * x * x * x - c1 * x * x;
  }

  drawGameObjects() {
    // Draw fire patches (behind everything)
    this.firePatches.forEach((patch) => patch.draw(this.ctx));

    // Draw particles (behind)
    this.particles.forEach((particle) => particle.draw(this.ctx));

    // Draw bombs
    this.bombs.forEach((bomb) => bomb.draw(this.ctx));

    // Draw placed bombs
    this.placedBombs.forEach((bomb) => bomb.draw(this.ctx));

    // Draw walls
    this.walls.forEach((wall) => wall.draw(this.ctx));

    // Draw projectiles
    this.projectiles.forEach((projectile) => projectile.draw(this.ctx));

    // Draw enemy projectiles
    this.enemyProjectiles.forEach((proj) => proj.draw(this.ctx));

    // Draw enemies with lights
    this.enemies.forEach((enemy) => {
      enemy.draw(this.ctx);

      // Add enemy light
      const enemyLight = new Light(
        enemy.getCenterX(),
        enemy.getCenterY(),
        80,
        "rgba(255, 0, 0, 0.2)"
      );
      enemyLight.draw(this.ctx);
    });

    // Draw Mage boss
    if (this.mage) {
      this.mage.draw(this.ctx);

      // Add mage light
      const mageLight = new Light(
        this.mage.getCenterX(),
        this.mage.getCenterY(),
        150,
        "rgba(136, 0, 255, 0.4)"
      );
      mageLight.draw(this.ctx);

      // Draw Mage health bar (scales with max health)
      const pixelsPerHP = 0.6; // Each HP adds 0.6 pixels to width
      const barWidth = Math.min(
        700,
        Math.max(150, this.mage.maxHealth * pixelsPerHP)
      );
      const barHeight = 30;
      const barX = this.width / 2 - barWidth / 2;
      const barY = this.height - 60;

      // Background
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      this.ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);

      // Border
      this.ctx.strokeStyle = "#8800ff";
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);

      // Health fill
      const healthPercent = Math.min(
        1,
        Math.max(0, this.mage.health / this.mage.maxHealth)
      );
      const healthWidth = barWidth * healthPercent;

      // Gradient health bar
      const gradient = this.ctx.createLinearGradient(
        barX,
        0,
        barX + healthWidth,
        0
      );
      gradient.addColorStop(0, "#ff00ff");
      gradient.addColorStop(1, "#8800ff");
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(barX, barY, healthWidth, barHeight);

      // Text
      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "bold 16px Arial";
      this.ctx.textAlign = "center";
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = "#8800ff";
      this.ctx.fillText(`MAGE BOSS`, this.width / 2, barY - 15);
      this.ctx.fillText(
        `${Math.ceil(this.mage.health)} / ${this.mage.maxHealth}`,
        this.width / 2,
        barY + barHeight / 2 + 5
      );
      this.ctx.shadowBlur = 0;
      this.ctx.textAlign = "left";

      // Invulnerability indicator
      if (!this.mage.isVulnerable) {
        this.ctx.fillStyle = "#ffff00";
        this.ctx.font = "bold 14px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText(
          "DEFEAT ALL ENEMIES FIRST!",
          this.width / 2,
          barY + barHeight + 20
        );
        this.ctx.textAlign = "left";
      }
    }

    // Draw Nova boss
    if (this.nova && this.nova.isActive) {
      this.nova.draw(this.ctx);

      // Add nova light
      const novaLight = new Light(
        this.nova.getCenterX(),
        this.nova.getCenterY(),
        200,
        "rgba(255, 0, 255, 0.5)"
      );
      novaLight.draw(this.ctx);

      // Draw Nova health bar (scales with max health)
      const pixelsPerHPNova = 0.6; // Each HP adds 0.6 pixels to width
      const barWidth = Math.min(
        800,
        Math.max(150, this.nova.maxHealth * pixelsPerHPNova)
      );
      const barHeight = 35;
      const barX = this.width / 2 - barWidth / 2;
      const barY = this.height - 70;

      // Background with glitch
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      this.ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);

      // Glitchy border (reduced frequency)
      this.ctx.strokeStyle = Math.random() > 0.95 ? "#00ffff" : "#ff00ff";
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);

      // Health fill
      const healthPercent = Math.min(
        1,
        Math.max(0, this.nova.health / this.nova.maxHealth)
      );
      const healthWidth = barWidth * healthPercent;

      // Gradient health bar with glitch
      const gradient = this.ctx.createLinearGradient(
        barX,
        0,
        barX + healthWidth,
        0
      );
      gradient.addColorStop(0, "#ff00ff");
      gradient.addColorStop(0.5, "#00ffff");
      gradient.addColorStop(1, "#ff00ff");
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(barX, barY, healthWidth, barHeight);

      // Glitch overlay (reduced frequency and opacity)
      if (Math.random() > 0.9) {
        this.ctx.fillStyle = "rgba(0, 255, 255, 0.15)";
        this.ctx.fillRect(
          barX + Math.random() * healthWidth,
          barY,
          20,
          barHeight
        );
      }

      // Text with glitch (reduced)
      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "bold 18px Arial";
      this.ctx.textAlign = "center";
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = Math.random() > 0.9 ? "#00ffff" : "#ff00ff";
      this.ctx.fillText(`NOVA BOSS`, this.width / 2, barY - 18);
      this.ctx.fillText(
        `${Math.ceil(this.nova.health)} / ${this.nova.maxHealth}`,
        this.width / 2,
        barY + barHeight / 2 + 6
      );
      this.ctx.shadowBlur = 0;
      this.ctx.textAlign = "left";

      // Invulnerability indicator
      if (!this.nova.isVulnerable) {
        this.ctx.fillStyle = "#ffff00";
        this.ctx.font = "bold 16px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText(
          "INVULNERABLE SHIELD!",
          this.width / 2,
          barY + barHeight + 25
        );
        this.ctx.textAlign = "left";
      }
    }

    // Draw power-ups
    this.powerUps.forEach((powerUp) => {
      powerUp.draw(this.ctx);

      // Add power-up light
      const powerUpLight = new Light(
        powerUp.getCenterX(),
        powerUp.getCenterY(),
        100,
        powerUp.type === "health"
          ? "rgba(255, 255, 0, 0.3)"
          : "rgba(255, 0, 255, 0.3)"
      );
      powerUpLight.draw(this.ctx);
    });

    // Draw shock crystals
    this.shockCrystals.forEach((crystal) => {
      crystal.draw(this.ctx);

      // Add crystal light
      const crystalLight = new Light(
        crystal.getCenterX(),
        crystal.getCenterY(),
        80,
        "rgba(0, 255, 255, 0.4)"
      );
      crystalLight.draw(this.ctx);
    });

    // Draw star orbs
    this.starOrbs.forEach((orb) => {
      orb.draw(this.ctx);

      // Add star orb light
      const orbLight = new Light(
        orb.getCenterX(),
        orb.getCenterY(),
        100,
        "rgba(255, 255, 0, 0.4)"
      );
      orbLight.draw(this.ctx);
    });

    // Draw XP orbs
    this.xpOrbs.forEach((orb) => orb.draw(this.ctx));

    // Draw stars
    this.stars.forEach((star) => star.draw(this.ctx));

    // Draw Nova lasers
    this.novaLasers.forEach((laser) => laser.draw(this.ctx));

    // Draw player (unless in death animation)
    if (!this.deathAnimation) {
      this.player.draw(this.ctx);
    }

    // Draw aiming line if player has star
    if (this.player.hasStar() && !this.gameOver && !this.paused) {
      this.ctx.save();
      this.ctx.strokeStyle = "rgba(255, 255, 0, 0.5)";
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([5, 5]);
      this.ctx.beginPath();
      this.ctx.moveTo(this.player.getCenterX(), this.player.getCenterY());
      this.ctx.lineTo(this.input.mouse.x, this.input.mouse.y);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // Draw lighting system
    this.lightingSystem.draw(this.ctx, this.width, this.height);

    // Draw glitch areas if Nova is active
    if (this.nova && this.nova.isActive && Math.random() > 0.5) {
      const glitchCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < glitchCount; i++) {
        const x = Math.random() * this.width;
        const y = Math.random() * this.height;
        const width = Math.random() * 200 + 50;
        const height = Math.random() * 200 + 50;

        this.ctx.save();
        this.ctx.fillStyle = `rgba(${Math.random() * 255}, ${
          Math.random() * 255
        }, ${Math.random() * 255}, 0.2)`;
        this.ctx.fillRect(x, y, width, height);

        // Glitch overlay
        this.ctx.globalCompositeOperation = "difference";
        this.ctx.fillStyle = Math.random() > 0.5 ? "#ff00ff" : "#00ffff";
        this.ctx.fillRect(
          x + Math.random() * 10,
          y + Math.random() * 10,
          width,
          height
        );
        this.ctx.restore();
      }
    }
  }

  // Queue particles to spawn over multiple frames (prevents lag spikes)
  queueParticles(particleArray) {
    this.particleQueue.push(...particleArray);
  }

  // Process queued particles (called in update loop)
  processParticleQueue() {
    const toSpawn = Math.min(
      this.PARTICLES_PER_FRAME,
      this.particleQueue.length
    );
    for (let i = 0; i < toSpawn; i++) {
      if (this.particles.length < this.MAX_PARTICLES) {
        this.particles.push(this.particleQueue.shift());
      } else {
        this.particleQueue.shift(); // Discard if at cap
      }
    }
  }

  shoot(targetX, targetY) {
    if (!this.gameOver && !this.paused) {
      // Trigger cursor shoot animation
      this.cursor.triggerShoot();

      if (this.multiShotActive) {
        // Triple shot
        const angles = [-0.3, 0, 0.3]; // Spread angles
        angles.forEach((angleOffset) => {
          const dx = targetX - this.player.getCenterX();
          const dy = targetY - this.player.getCenterY();
          const angle = Math.atan2(dy, dx) + angleOffset;
          const distance = 500; // arbitrary distance for direction
          const newTargetX =
            this.player.getCenterX() + Math.cos(angle) * distance;
          const newTargetY =
            this.player.getCenterY() + Math.sin(angle) * distance;

          const projectile = new Projectile(
            this.player.getCenterX(),
            this.player.getCenterY(),
            newTargetX,
            newTargetY
          );
          this.projectiles.push(projectile);
          // Removed shotsFired tracking - accuracy now based on hits only
        });
      } else {
        // Normal single shot
        const projectile = new Projectile(
          this.player.getCenterX(),
          this.player.getCenterY(),
          targetX,
          targetY
        );
        this.projectiles.push(projectile);
        // Removed shotsFired tracking - accuracy now based on hits only
      }

      // Muzzle flash particles
      for (let i = 0; i < 3; i++) {
        this.particles.push(
          new Particle(
            this.player.getCenterX(),
            this.player.getCenterY(),
            "#ffff00"
          )
        );
      }
    }
  }

  spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;

    switch (side) {
      case 0: // Top
        x = Math.random() * this.width;
        y = -30;
        break;
      case 1: // Right
        x = this.width + 30;
        y = Math.random() * this.height;
        break;
      case 2: // Bottom
        x = Math.random() * this.width;
        y = this.height + 30;
        break;
      case 3: // Left
        x = -30;
        y = Math.random() * this.height;
        break;
    }

    // Choose enemy type based on level
    let type = "dumb";
    const rand = Math.random();

    if (this.level >= 4) {
      // Level 4+: all types including medium
      if (rand < 0.25) type = "dumb";
      else if (rand < 0.5) type = "medium";
      else if (rand < 0.75) type = "smart";
      else type = "teleport";
    } else if (this.level >= 3) {
      // Level 3: dumb, medium, smart, teleport
      if (rand < 0.3) type = "dumb";
      else if (rand < 0.5) type = "medium";
      else if (rand < 0.75) type = "smart";
      else type = "teleport";
    } else if (this.level >= 2) {
      // Level 2: dumb, medium, smart
      if (rand < 0.4) type = "dumb";
      else if (rand < 0.7) type = "medium";
      else type = "smart";
    }
    // Level 1: only dumb
    this.enemies.push(new Enemy(x, y, 30, 30, type));
  }

  spawnPowerUp() {
    const x = Math.random() * (this.width - 40) + 20;
    const y = Math.random() * (this.height - 40) + 20;
    const type = Math.random() < 0.5 ? "health" : "multishot";
    this.powerUps.push(new PowerUp(x, y, type));
  }

  spawnBomb() {
    const x = Math.random() * (this.width - 100) + 50;
    const bomb = new Bomb(x, -50, this.height - 20);
    this.bombs.push(bomb);
  }

  placeBomb(x, y) {
    if (!this.gameOver && !this.paused) {
      // Use item from currently selected slot
      const itemType = this.player.useItemFromSlot(this.selectedSlot);

      if (itemType === "crystal") {
        // Use shock crystal - trigger shockwave
        this.triggerShockwave();
      } else if (itemType === "star") {
        // Throw star in direction of mouse
        this.throwStar(x, y);
      } else if (itemType === "bomb") {
        // Place bomb at location
        const tooClose = this.placedBombs.some((bomb) => {
          const dx = bomb.x - x;
          const dy = bomb.y - y;
          return Math.sqrt(dx * dx + dy * dy) < 100;
        });

        if (!tooClose) {
          this.placedBombs.push(new PlaceableBomb(x, y));
        } else {
          // Refund if can't place
          this.player.addItem("bomb");
        }
      }
    }
  }

  throwStar(targetX, targetY) {
    // Calculate direction from player to target
    const dx = targetX - this.player.getCenterX();
    const dy = targetY - this.player.getCenterY();
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      const dirX = dx / distance;
      const dirY = dy / distance;

      // Create star
      const star = new Star(
        this.player.getCenterX() - 20,
        this.player.getCenterY() - 20,
        dirX,
        dirY
      );

      this.stars.push(star);

      // Visual feedback
      this.screenShake.shake(10, 15);
      for (let i = 0; i < 10; i++) {
        this.particles.push(
          new Particle(
            this.player.getCenterX(),
            this.player.getCenterY(),
            "#ffff00"
          )
        );
      }
    }
  }

  triggerShockwave() {
    // Create massive shockwave particles
    for (let i = 0; i < 100; i++) {
      this.particles.push(
        new Particle(
          this.player.getCenterX(),
          this.player.getCenterY(),
          "#00ffff"
        )
      );
    }

    // Screen shake
    this.screenShake.shake(50, 60);
    this.triggerGlitch(
      20,
      1.0,
      this.player.getCenterX(),
      this.player.getCenterY(),
      300
    );

    // Kill all enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      // Create explosion particles
      for (let j = 0; j < 50; j++) {
        this.particles.push(
          new ExplosionParticle(enemy.getCenterX(), enemy.getCenterY())
        );
      }

      // Spawn XP orbs
      const orbCount =
        enemy.type === "smart"
          ? 5
          : enemy.type === "medium"
          ? 3
          : enemy.type === "teleport"
          ? 6
          : 2;
      const orbValue =
        enemy.type === "smart"
          ? 10
          : enemy.type === "teleport"
          ? 10
          : enemy.type === "medium"
          ? 5
          : 5;

      for (let k = 0; k < orbCount; k++) {
        this.xpOrbs.push(
          new XPOrb(enemy.getCenterX(), enemy.getCenterY(), orbValue)
        );
      }

      // Add to score
      this.score += 100;
      this.enemiesKilled++;

      // Remove enemy
      this.enemies.splice(i, 1);
    }

    // Check for level up
    if (this.enemiesKilled >= this.enemiesPerLevel) {
      this.level++;
      this.enemiesKilled = 0;
      this.enemiesPerLevel += 5;
      this.startLevelTransition();
    }
  }

  forceBuyStarOrb() {
    if (this.score >= 80 && this.player.canAddItem("star")) {
      this.score -= 80;
      this.player.addStar();

      // Remove any existing star orbs
      this.starOrbs = [];

      // Visual feedback
      for (let i = 0; i < 15; i++) {
        this.particles.push(
          new Particle(
            this.player.getCenterX(),
            this.player.getCenterY(),
            "#ffff00"
          )
        );
      }
      this.screenShake.shake(15, 20);
    }
  }

  spawnMage() {
    const x = this.width / 2 - 25;
    const y = this.height / 2 - 25;
    this.mage = new Mage(x, y, 50, 50);

    // Clear all enemies and enemy projectiles
    this.enemies = [];
    this.enemyProjectiles = [];

    // Mage spawn particles (queued to prevent lag)
    const mageParticles = [];
    for (let i = 0; i < 20; i++) {
      mageParticles.push(
        new ExplosionParticle(this.mage.getCenterX(), this.mage.getCenterY())
      );
    }
    this.queueParticles(mageParticles);

    this.screenShake.shake(20, 25);
    this.triggerGlitch(
      5,
      1.0,
      this.mage.getCenterX(),
      this.mage.getCenterY(),
      150
    );
  }

  spawnNova() {
    const x = this.width / 2 - 25;
    const y = this.height / 2 - 25;
    this.nova = new Nova(x, y, 50, 50);
    this.novaActive = true;

    // Clear all enemies and enemy projectiles
    this.enemies = [];
    this.enemyProjectiles = [];

    // Nova spawn particles (queued to prevent lag)
    const novaParticles = [];
    for (let i = 0; i < 25; i++) {
      novaParticles.push(
        new ExplosionParticle(this.nova.getCenterX(), this.nova.getCenterY())
      );
    }
    this.queueParticles(novaParticles);

    this.screenShake.shake(25, 30);
    this.triggerGlitch(
      6,
      1.0,
      this.nova.getCenterX(),
      this.nova.getCenterY(),
      180
    );
  }

  triggerGlitch(intensity = 5, chance = 0.4, x = null, y = null, radius = 200) {
    // Cooldown: don't trigger if already glitching
    if (this.glitchActive) return;

    if (Math.random() < chance) {
      this.glitchActive = true;
      this.glitchIntensity = Math.min(intensity, 10); // Cap intensity
      this.glitchSourceX = x !== null ? x : this.width / 2;
      this.glitchSourceY = y !== null ? y : this.height / 2;
      this.glitchRadius = Math.min(radius, 200); // Cap radius
      this.chromaticAberration = intensity * 0.2; // Reduced
    }
  }

  startLevelTransition() {
    this.levelTransition = true;
    this.levelTransitionTimer = 0;

    // Process enemies: some explode, some stay
    setTimeout(() => {
      const survivingEnemies = [];

      this.enemies.forEach((enemy) => {
        const fate = Math.random();

        if (fate < 0.5) {
          // 50% chance: Enemy explodes with particles
          for (let i = 0; i < 8; i++) {
            this.particles.push(
              new ExplosionParticle(enemy.getCenterX(), enemy.getCenterY())
            );
          }
        } else {
          // 50% chance: Enemy survives the level transition
          survivingEnemies.push(enemy);
        }
      });

      this.enemies = survivingEnemies;
      this.enemyProjectiles = [];
      // Keep XP orbs so player can collect them during transition
    }, 200);

    // YAY particles
    for (let i = 0; i < 20; i++) {
      this.particles.push(
        new Particle(
          this.width / 2,
          this.height / 2,
          ["#ffff00", "#00ff00", "#00ffff", "#ff00ff"][
            Math.floor(Math.random() * 4)
          ]
        )
      );
    }
  }

  startDeathAnimation() {
    this.deathAnimation = true;
    this.deathAnimationTimer = 0;
    this.deathMessage = DeathMessages.getDeathMessage(this);
    this.deathCause = DeathMessages.getDeathCause(this);

    // Notify Discord RPC of death
    if (this.rpcDetector) {
      this.rpcDetector.onDeath(this.deathMessage);
    }

    // Death explosion particles
    for (let i = 0; i < 15; i++) {
      this.particles.push(
        new ExplosionParticle(
          this.player.getCenterX(),
          this.player.getCenterY()
        )
      );
    }

    this.screenShake.shake(30, 40);
  }

  update() {
    // VHS boot sequence
    if (this.vhsState === "waiting") {
      this.vhsBlinkTimer++;
      return; // Don't update game while waiting
    }

    if (this.vhsState === "booting") {
      this.vhsBootTimer++;
      if (this.vhsBootTimer >= this.vhsBootDuration) {
        this.vhsState = "ready";
      }
      return; // Don't update game during boot
    }

    // Check for reset
    if (this.input.consumeResetPress()) {
      this.reset();
      return;
    }

    // Check for pause
    if (this.input.consumePausePress()) {
      this.paused = !this.paused;
    }

    // Handle inventory slot selection (1-3)
    if (this.input.keys.has("1")) {
      this.selectedSlot = 0;
      this.input.keys.delete("1");
    }
    if (this.input.keys.has("2")) {
      this.selectedSlot = 1;
      this.input.keys.delete("2");
    }
    if (this.input.keys.has("3")) {
      this.selectedSlot = 2;
      this.input.keys.delete("3");
    }

    if (this.paused) return;

    // Death animation
    if (this.deathAnimation) {
      this.deathAnimationTimer++;
      this.screenShake.update();
      this.particles.forEach((particle) => particle.update());
      this.particles = this.particles.filter((particle) => !particle.isDead());

      if (this.deathAnimationTimer >= this.deathAnimationDuration) {
        this.gameOver = true;
        this.deathAnimation = false;
      }
      return;
    }

    // Level transition (game continues in background)
    if (this.levelTransition) {
      this.levelTransitionTimer++;

      if (this.levelTransitionTimer >= this.levelTransitionDuration) {
        this.levelTransition = false;
        // Increase difficulty
        this.enemySpawnInterval = Math.max(40, this.enemySpawnInterval - 10);
      }
    }

    if (this.gameOver) return;

    // SCREEN SHAKE!!!!
    this.screenShake.update();

    // VHS Effects
    this.scanlineOffset += 0.5;
    if (this.scanlineOffset > 4) this.scanlineOffset = 0;

    // Glitch decay
    if (this.glitchActive) {
      this.glitchIntensity *= 0.8;
      this.chromaticAberration *= 0.8;
      if (this.glitchIntensity < 0.1) this.glitchActive = false;
    }
    this.vhsOffset = Math.sin(Date.now() * 0.001) * 2;

    // player updates
    this.player.update(this.input, this.width, this.height);

    // Auto-shoot when holding left mouse button
    if (this.input.mouseDown && !this.gameOver && !this.paused) {
      this.autoShootTimer++;
      if (this.autoShootTimer >= this.autoShootCooldown) {
        this.shoot(this.input.mouse.x, this.input.mouse.y);
        this.autoShootTimer = 0;
      }
    } else {
      this.autoShootTimer = this.autoShootCooldown; // Ready to fire immediately on next click
    }

    // player light updates
    this.playerLight.update(this.player.getCenterX(), this.player.getCenterY());

    // bleh enemy updates
    this.enemies.forEach((enemy) => {
      enemy.update(
        this.player.getCenterX(),
        this.player.getCenterY(),
        this.projectiles,
        this.bombs
      );

      // Smart and medium enemies shoot
      if (enemy.shouldShoot()) {
        const enemyProj = new EnemyProjectile(
          enemy.getCenterX(),
          enemy.getCenterY(),
          this.player.getCenterX(),
          this.player.getCenterY()
        );
        this.enemyProjectiles.push(enemyProj);
      }

      // Check collision with player
      if (enemy.checkCollision(this.player)) {
        this.damageTaken += enemy.damage;
        if (this.player.takeDamage(enemy.damage)) {
          this.startDeathAnimation();
        }
      }
    });

    // Mage boss updates
    if (this.mage) {
      this.mage.update(
        this.player.getCenterX(),
        this.player.getCenterY(),
        this.projectiles,
        this.enemies.length,
        this.width,
        this.height
      );

      // Mage shooting
      if (this.mage.shouldShoot()) {
        const mageProj = new EnemyProjectile(
          this.mage.getCenterX(),
          this.mage.getCenterY(),
          this.player.getCenterX(),
          this.player.getCenterY()
        );
        mageProj.color = "#8800ff"; // Purple projectiles
        this.enemyProjectiles.push(mageProj);
      }

      // Mage teleport
      this.mage.shouldTeleport();

      // Mage wall summoning
      if (this.mage.shouldSummonWall()) {
        // Summon 2-4 walls around player
        const wallCount = Math.floor(Math.random() * 3) + 2;
        for (let i = 0; i < wallCount; i++) {
          const angle = (Math.PI * 2 * i) / wallCount + Math.random() * 0.5;
          const distance = 100 + Math.random() * 100;
          const wallX =
            this.player.getCenterX() + Math.cos(angle) * distance - 20;
          const wallY =
            this.player.getCenterY() + Math.sin(angle) * distance - 30;

          // Check if new wall overlaps existing walls
          const overlaps = this.walls.some((wall) => {
            return (
              Math.abs(wall.x - wallX) < 50 && Math.abs(wall.y - wallY) < 70
            );
          });

          // Only spawn if no overlap and under wall limit
          if (!overlaps && this.walls.length < 12) {
            this.walls.push(new Wall(wallX, wallY));
          }
        }

        this.screenShake.shake(10, 15);
      }

      // Mage push/pull
      const pushPull = this.mage.shouldPushPull();
      if (pushPull) {
        const dx = this.player.getCenterX() - this.mage.getCenterX();
        const dy = this.player.getCenterY() - this.mage.getCenterY();
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          const force = pushPull === "push" ? -15 : 15;
          const forceX = (dx / distance) * force;
          const forceY = (dy / distance) * force;

          // Apply force to player
          this.player.x += forceX;
          this.player.y += forceY;

          // Clamp to screen
          this.player.x = Math.max(
            0,
            Math.min(this.width - this.player.width, this.player.x)
          );
          this.player.y = Math.max(
            0,
            Math.min(this.height - this.player.height, this.player.y)
          );

          this.screenShake.shake(10, 15);

          // Visual effect
          for (let i = 0; i < 10; i++) {
            this.particles.push(
              new Particle(
                this.player.getCenterX(),
                this.player.getCenterY(),
                pushPull === "push" ? "#ff0000" : "#0000ff"
              )
            );
          }
        }
      }

      // Check collision with player
      if (this.mage.checkCollision(this.player)) {
        this.damageTaken += this.mage.damage;
        if (this.player.takeDamage(this.mage.damage)) {
          this.startDeathAnimation();
        }
      }
    }

    // Nova boss updates
    if (this.nova && this.nova.isActive) {
      this.nova.update(
        this.player.getCenterX(),
        this.player.getCenterY(),
        this.projectiles,
        this.enemies.length,
        this.width,
        this.height
      );

      // Nova laser shooting
      if (this.nova.shouldShootLaser()) {
        const angle = Math.atan2(
          this.player.getCenterY() - this.nova.getCenterY(),
          this.player.getCenterX() - this.nova.getCenterX()
        );
        const directionX = Math.cos(angle);
        const directionY = Math.sin(angle);

        this.novaLasers.push(
          new NovaLaser(
            this.nova.getCenterX(),
            this.nova.getCenterY(),
            directionX,
            directionY
          )
        );

        this.screenShake.shake(8, 12);
      }

      // Nova teleport
      this.nova.shouldTeleport();

      // Nova teleports player
      if (this.nova.shouldTeleportPlayer()) {
        const newX = Math.random() * (this.width - this.player.width);
        const newY = Math.random() * (this.height - this.player.height);

        // Visual effect at old position
        for (let i = 0; i < 25; i++) {
          this.particles.push(
            new ExplosionParticle(
              this.player.getCenterX(),
              this.player.getCenterY()
            )
          );
        }

        this.player.x = newX;
        this.player.y = newY;

        // Visual effect at new position
        for (let i = 0; i < 25; i++) {
          this.particles.push(
            new ExplosionParticle(
              this.player.getCenterX(),
              this.player.getCenterY()
            )
          );
        }

        this.screenShake.shake(20, 25);
        this.triggerGlitch(
          12,
          1.0,
          this.player.getCenterX(),
          this.player.getCenterY(),
          250
        );
      }

      // Nova summons enemies
      if (this.nova.shouldSummonEnemies()) {
        const enemyCount = Math.floor(Math.random() * 2) + 2; // 2-3 enemies
        for (let i = 0; i < enemyCount; i++) {
          const angle = (Math.PI * 2 * i) / enemyCount;
          const distance = 100 + Math.random() * 50;
          const x = this.nova.getCenterX() + Math.cos(angle) * distance;
          const y = this.nova.getCenterY() + Math.sin(angle) * distance;

          this.enemies.push(
            new Enemy(
              Math.max(0, Math.min(this.width - 30, x)),
              Math.max(0, Math.min(this.height - 30, y)),
              30,
              30
            )
          );
        }

        this.screenShake.shake(15, 18);
        this.triggerGlitch(
          8,
          0.8,
          this.nova.getCenterX(),
          this.nova.getCenterY(),
          200
        );
      }

      // Nova disappear/reappear
      if (this.nova.shouldDisappear()) {
        this.nova.disappear();
        this.novaReappearLevel = this.level + 2; // Reappear 2 levels later
        this.screenShake.shake(25, 30);
        this.triggerGlitch(
          15,
          1.0,
          this.nova.getCenterX(),
          this.nova.getCenterY(),
          250
        );
      }

      // Nova reappears when level reaches target
      if (
        !this.nova.isActive &&
        this.novaReappearLevel &&
        this.level >= this.novaReappearLevel
      ) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 150 + Math.random() * 100;
        const x = Math.max(
          50,
          Math.min(
            this.width - 50,
            this.player.getCenterX() + Math.cos(angle) * distance
          )
        );
        const y = Math.max(
          50,
          Math.min(
            this.height - 50,
            this.player.getCenterY() + Math.sin(angle) * distance
          )
        );
        this.nova.reappear(x, y);
        this.novaReappearLevel = null;
        this.screenShake.shake(20, 25);
        this.triggerGlitch(10, 1.0, x, y, 200);
      }

      // Check collision with player
      if (this.nova.checkCollision(this.player)) {
        this.damageTaken += this.nova.damage;
        if (this.player.takeDamage(this.nova.damage)) {
          this.startDeathAnimation();
        }
      }
    }

    // Update enemy projectiles
    this.enemyProjectiles = this.enemyProjectiles.filter((proj) => {
      proj.update();

      // Remove if off screen
      if (proj.isOffScreen(this.width, this.height)) {
        return false;
      }

      // Check collision with player
      if (proj.checkCollision(this.player)) {
        this.damageTaken += proj.damage;
        if (this.player.takeDamage(proj.damage)) {
          this.startDeathAnimation();
        }
        return false;
      }

      return true;
    });

    // Update projectiles
    this.projectiles = this.projectiles.filter((projectile) => {
      projectile.update();

      // Add trail particles - skip if too many particles already
      if (
        this.particles.length < this.MAX_PARTICLES * 0.7 &&
        Math.random() < 0.3
      ) {
        this.particles.push(new ProjectileTrail(projectile.x, projectile.y));
      }

      // Remove if off screen
      if (projectile.isOffScreen(this.width, this.height)) {
        return false;
      }

      // Check collision with enemies
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        if (projectile.checkCollision(this.enemies[i])) {
          // Count hit and track damage dealt
          this.shotsHit++;
          this.damageDealt += projectile.damage;

          if (this.enemies[i].takeDamage(projectile.damage)) {
            const enemy = this.enemies[i];

            // Create explosion
            for (let j = 0; j < 20; j++) {
              this.particles.push(
                new ExplosionParticle(enemy.getCenterX(), enemy.getCenterY())
              );
            }

            // Screen shake - MORE INTENSE!
            this.screenShake.shake(20, 25);

            // Trigger VHS glitch effect only on smart enemy kills (25% chance) - localized
            if (enemy.type === "smart") {
              this.triggerGlitch(
                8,
                0.25,
                enemy.getCenterX(),
                enemy.getCenterY(),
                150
              );
            }

            // 10% chance for dumb enemies to spawn bomb on death
            if (enemy.type === "dumb" && Math.random() < 0.1) {
              const bomb = new Bomb(
                enemy.getCenterX(),
                enemy.getCenterY() - 100,
                this.height - 20
              );
              this.bombs.push(bomb);
            }

            // 30% chance for medium/smart enemies to drop placeable bomb
            if (
              (enemy.type === "medium" || enemy.type === "smart") &&
              Math.random() < 0.3
            ) {
              if (this.player.canAddItem("bomb")) {
                this.player.addItem("bomb");
              }
            }

            // Add explosion light
            const explosionLight = new Light(
              enemy.getCenterX(),
              enemy.getCenterY(),
              200,
              "rgba(255, 100, 0, 0.8)"
            );
            this.lightingSystem.addLight(explosionLight);
            setTimeout(() => {
              this.lightingSystem.removeLight(explosionLight);
            }, 300);

            this.enemies.splice(i, 1);

            // Spawn XP orbs based on enemy type - MORE XP!
            const orbCount =
              enemy.type === "smart"
                ? 5
                : enemy.type === "medium"
                ? 3
                : enemy.type === "teleport"
                ? 6
                : 2;
            const orbValue =
              enemy.type === "smart"
                ? 10
                : enemy.type === "teleport"
                ? 10
                : enemy.type === "medium"
                ? 5
                : 5;

            for (let k = 0; k < orbCount; k++) {
              this.xpOrbs.push(
                new XPOrb(enemy.getCenterX(), enemy.getCenterY(), orbValue)
              );
            }

            this.enemiesKilled++;

            // Check for level up
            if (this.enemiesKilled >= this.enemiesPerLevel) {
              this.level++;
              this.enemiesKilled = 0;
              this.enemiesPerLevel += 5; // More enemies needed each level
              this.startLevelTransition();
            }
          }
          return false; // Remove projectile
        }
      }

      // Check collision with Mage
      if (this.mage && projectile.checkCollision(this.mage)) {
        this.damageDealt += projectile.damage;
        if (this.mage.takeDamage(projectile.damage)) {
          // Mage defeated!
          for (let i = 0; i < 60; i++) {
            this.particles.push(
              new ExplosionParticle(
                this.mage.getCenterX(),
                this.mage.getCenterY()
              )
            );
          }

          this.screenShake.shake(40, 50);
          this.triggerGlitch(
            15,
            1.0,
            this.mage.getCenterX(),
            this.mage.getCenterY(),
            300
          );

          // Drop lots of XP
          for (let i = 0; i < 20; i++) {
            this.xpOrbs.push(
              new XPOrb(this.mage.getCenterX(), this.mage.getCenterY(), 10)
            );
          }

          // Drop shock crystal
          this.shockCrystals.push(
            new ShockCrystal(
              this.mage.getCenterX() - 8,
              this.mage.getCenterY() - 8
            )
          );

          this.mage = null;
          this.walls = []; // Remove all walls

          // Level up
          this.level++;
          this.enemiesKilled = 0;
          this.startLevelTransition();
        }
        return false;
      }

      // Check collision with Nova
      if (
        this.nova &&
        this.nova.isActive &&
        projectile.checkCollision(this.nova)
      ) {
        this.damageDealt += projectile.damage;
        if (this.nova.takeDamage(projectile.damage)) {
          // Nova defeated!
          for (let i = 0; i < 100; i++) {
            this.particles.push(
              new ExplosionParticle(
                this.nova.getCenterX(),
                this.nova.getCenterY()
              )
            );
          }

          this.screenShake.shake(50, 60);
          this.triggerGlitch(
            20,
            1.0,
            this.nova.getCenterX(),
            this.nova.getCenterY(),
            400
          );

          // Drop massive XP
          for (let i = 0; i < 30; i++) {
            this.xpOrbs.push(
              new XPOrb(this.nova.getCenterX(), this.nova.getCenterY(), 15)
            );
          }

          this.nova = null;
          this.novaActive = false;
          this.novaLasers = [];

          // Level up
          this.level++;
          this.enemiesKilled = 0;
          this.startLevelTransition();
        }
        return false;
      }

      // Check collision with Walls - walls block projectiles but don't get destroyed
      for (let i = this.walls.length - 1; i >= 0; i--) {
        if (
          this.walls[i].checkCollision({
            x: projectile.x - 2,
            y: projectile.y - 2,
            width: 4,
            height: 4,
          })
        ) {
          // Wall blocks projectile (no destruction)
          return false;
        }
      }

      return true;
    });

    // Process queued particles (staggered spawning)
    this.processParticleQueue();

    // Update particles
    this.particles = this.particles.filter((particle) => {
      particle.update();
      return !particle.isDead();
    });

    // Enforce particle cap - remove oldest particles if exceeded
    if (this.particles.length > this.MAX_PARTICLES) {
      this.particles.splice(0, this.particles.length - this.MAX_PARTICLES);
    }

    // Update power-ups
    this.powerUps.forEach((powerUp) => powerUp.update());

    // Update shock crystals
    this.shockCrystals.forEach((crystal) => crystal.update());

    // Check shock crystal collection
    for (let i = this.shockCrystals.length - 1; i >= 0; i--) {
      if (this.shockCrystals[i].checkCollision(this.player)) {
        this.player.addShockCrystal();

        // Collection particles
        for (let j = 0; j < 12; j++) {
          this.particles.push(
            new Particle(
              this.shockCrystals[i].getCenterX(),
              this.shockCrystals[i].getCenterY(),
              "#00ffff"
            )
          );
        }

        this.screenShake.shake(15, 20);
        this.shockCrystals.splice(i, 1);
      }
    }

    // Update star orbs
    this.starOrbs.forEach((orb) => orb.update());

    // Check star orb collection
    for (let i = this.starOrbs.length - 1; i >= 0; i--) {
      const orb = this.starOrbs[i];

      if (orb.isExpired()) {
        // Remove expired star orb
        this.starOrbs.splice(i, 1);
      } else if (
        orb.checkCollision(this.player) &&
        this.score >= 80 &&
        this.player.canAddItem("star")
      ) {
        // Purchase star orb
        this.score -= 80;
        this.player.addStar();

        // Collection particles
        for (let j = 0; j < 18; j++) {
          this.particles.push(
            new Particle(orb.getCenterX(), orb.getCenterY(), "#ffff00")
          );
        }

        this.screenShake.shake(20, 25);
        this.starOrbs.splice(i, 1);
      }
    }

    // Update stars
    this.stars.forEach((star) => star.update(this.width, this.height));

    // Check star collision with enemies
    for (let i = this.stars.length - 1; i >= 0; i--) {
      const star = this.stars[i];

      if (star.isDead()) {
        this.stars.splice(i, 1);
        continue;
      }

      // Check Mage collision - stars deal damage regardless of shield
      if (this.mage && star.checkCollision(this.mage)) {
        const mageX = this.mage.getCenterX();
        const mageY = this.mage.getCenterY();

        // Deal 150 damage to Mage
        if (this.mage.takeDamage(150, true)) {
          // true = bypass shield
          // Mage defeated
          for (let k = 0; k < 20; k++) {
            this.particles.push(new ExplosionParticle(mageX, mageY));
          }
          this.score += 500;
          this.mage = null;
        } else {
          // Hit effect
          for (let k = 0; k < 8; k++) {
            this.particles.push(new ExplosionParticle(mageX, mageY));
          }
        }
        this.screenShake.shake(15, 20);
        star.die();
        continue;
      }

      // Check Nova collision - stars break shield
      if (this.nova && this.nova.isActive && star.checkCollision(this.nova)) {
        const novaX = this.nova.getCenterX();
        const novaY = this.nova.getCenterY();

        if (!this.nova.isVulnerable) {
          // Break Nova's shield permanently!
          this.nova.shieldBroken = true;
          this.nova.isVulnerable = true;
          // Shield break effect
          for (let k = 0; k < 15; k++) {
            this.particles.push(new Particle(novaX, novaY, "#ffff00"));
          }
          this.screenShake.shake(25, 30);
        } else {
          // Deal 150 damage to Nova
          if (this.nova.takeDamage(150, true)) {
            // true = bypass shield
            // Nova defeated
            for (let k = 0; k < 20; k++) {
              this.particles.push(new ExplosionParticle(novaX, novaY));
            }
            this.score += 750;
            this.nova = null;
            this.novaActive = false;
          } else {
            // Hit effect
            for (let k = 0; k < 8; k++) {
              this.particles.push(new ExplosionParticle(novaX, novaY));
            }
          }
        }
        this.screenShake.shake(15, 20);
        star.die();
        continue;
      }

      // Check enemy collisions
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        if (star.checkCollision(this.enemies[j])) {
          const enemy = this.enemies[j];

          // Kill enemy instantly
          for (let k = 0; k < 15; k++) {
            this.particles.push(
              new ExplosionParticle(enemy.getCenterX(), enemy.getCenterY())
            );
          }

          this.screenShake.shake(10, 15);

          // Drop XP
          const orbCount =
            enemy.type === "smart"
              ? 5
              : enemy.type === "medium"
              ? 3
              : enemy.type === "teleport"
              ? 6
              : 2;
          const orbValue =
            enemy.type === "smart"
              ? 10
              : enemy.type === "teleport"
              ? 10
              : enemy.type === "medium"
              ? 5
              : 5;

          for (let k = 0; k < orbCount; k++) {
            this.xpOrbs.push(
              new XPOrb(enemy.getCenterX(), enemy.getCenterY(), orbValue)
            );
          }

          this.score += 100;
          this.enemiesKilled++;
          this.enemies.splice(j, 1);
        }
      }
    }

    // Remove dead stars
    this.stars = this.stars.filter((star) => !star.isDead());

    // Update Nova lasers
    this.novaLasers.forEach((laser) => laser.update());

    // Check Nova laser collisions
    for (let i = this.novaLasers.length - 1; i >= 0; i--) {
      const laser = this.novaLasers[i];

      // Apply screen shake from laser
      const shakeAmount = laser.getScreenShake();
      if (shakeAmount > 0) {
        this.screenShake.shake(shakeAmount, shakeAmount);
      }

      // Remove if off screen (beam expired)
      if (laser.isOffScreen(this.width, this.height)) {
        this.novaLasers.splice(i, 1);
        continue;
      }

      // Check collision with player
      if (laser.checkCollision(this.player)) {
        this.damageTaken += laser.damage;
        if (this.player.takeDamage(laser.damage)) {
          this.startDeathAnimation();
        }
      }

      // Check collision with enemies (kills them all)
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        if (laser.checkCollision(this.enemies[j])) {
          const enemy = this.enemies[j];

          // Instant kill
          for (let k = 0; k < 15; k++) {
            this.particles.push(
              new ExplosionParticle(enemy.getCenterX(), enemy.getCenterY())
            );
          }

          // Drop XP
          const orbCount =
            enemy.type === "smart"
              ? 5
              : enemy.type === "medium"
              ? 3
              : enemy.type === "teleport"
              ? 6
              : 2;
          const orbValue =
            enemy.type === "smart"
              ? 10
              : enemy.type === "teleport"
              ? 10
              : enemy.type === "medium"
              ? 5
              : 5;

          for (let k = 0; k < orbCount; k++) {
            this.xpOrbs.push(
              new XPOrb(enemy.getCenterX(), enemy.getCenterY(), orbValue)
            );
          }

          this.score += 100;
          this.enemiesKilled++;
          this.enemies.splice(j, 1);
        }
      }
    }

    // Update XP orbs
    this.xpOrbs.forEach((orb) =>
      orb.update(
        this.player.getCenterX(),
        this.player.getCenterY(),
        this.xpOrbs
      )
    );

    // Check XP orb collection
    for (let i = this.xpOrbs.length - 1; i >= 0; i--) {
      if (this.xpOrbs[i].checkCollision(this.player)) {
        this.score += this.xpOrbs[i].value;

        // Collection particles
        for (let j = 0; j < 3; j++) {
          this.particles.push(
            new Particle(
              this.xpOrbs[i].x,
              this.xpOrbs[i].y,
              this.xpOrbs[i].color
            )
          );
        }

        this.xpOrbs.splice(i, 1);
      } else if (this.xpOrbs[i].isExpired()) {
        // Remove expired orbs
        this.xpOrbs.splice(i, 1);
      }
    }

    // Clump nearby XP orbs of same value
    for (let i = this.xpOrbs.length - 1; i >= 0; i--) {
      for (let j = i - 1; j >= 0; j--) {
        const orb1 = this.xpOrbs[i];
        const orb2 = this.xpOrbs[j];

        if (orb1.value === orb2.value) {
          const dx = orb1.x - orb2.x;
          const dy = orb1.y - orb2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 10) {
            // Merge orbs
            orb1.merge(orb2);
            this.xpOrbs.splice(j, 1);
            i--; // Adjust index
            break;
          }
        }
      }
    }

    // Check power-up collisions
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      if (this.powerUps[i].checkCollision(this.player)) {
        const powerUp = this.powerUps[i];

        if (powerUp.type === "health") {
          // Heal player
          this.player.health = Math.min(100, this.player.health + 30);

          // Healing particles
          for (let j = 0; j < 12; j++) {
            this.particles.push(
              new Particle(
                powerUp.getCenterX(),
                powerUp.getCenterY(),
                "#00ff00"
              )
            );
          }
        } else if (powerUp.type === "multishot") {
          // Activate multi-shot
          this.multiShotActive = true;
          this.multiShotTimer = this.multiShotDuration;

          // Power-up particles
          for (let j = 0; j < 12; j++) {
            this.particles.push(
              new Particle(
                powerUp.getCenterX(),
                powerUp.getCenterY(),
                "#ff00ff"
              )
            );
          }
        }

        this.powerUps.splice(i, 1);
      }
    }

    // Update multi-shot timer
    if (this.multiShotActive) {
      this.multiShotTimer--;
      if (this.multiShotTimer <= 0) {
        this.multiShotActive = false;
      }
    }

    // Spawn enemies (only if no mage)
    if (!this.mage) {
      this.enemySpawnTimer++;
      if (this.enemySpawnTimer >= this.enemySpawnInterval) {
        this.spawnEnemy();
        this.enemySpawnTimer = 0;

        // Gradually increase difficulty
        if (this.enemySpawnInterval > 60) {
          this.enemySpawnInterval -= 1;
        }
      }
    }

    // Spawn Mage boss (level 8, then every 6 levels)
    if (
      !this.mage &&
      this.level >= 8 &&
      (this.level - 8) % 6 === 0 &&
      this.enemies.length === 0
    ) {
      // Mage spawn - clear all enemies first
      this.spawnMage();
    }

    // Test spawn mage with key "9"
    if (this.input.keys.has("9") && !this.mage) {
      this.spawnMage();
      this.input.keys.delete("9");
    }

    // Test spawn Nova with key "7"
    if (this.input.keys.has("7") && !this.nova) {
      this.spawnNova();
      this.input.keys.delete("7");
    }

    // Toggle Nova pause with key "K"
    if (this.input.keys.has("k") || this.input.keys.has("K")) {
      if (this.nova) {
        this.nova.isActive = !this.nova.isActive;
      }
      this.input.keys.delete("k");
      this.input.keys.delete("K");
    }

    // Force-buy star orb with key "8"
    if (this.input.keys.has("8")) {
      this.forceBuyStarOrb();
      this.input.keys.delete("8");
    }

    // Auto-spawn star orb if score >= 80 and no star orb exists
    if (
      this.score >= 80 &&
      this.starOrbs.length === 0 &&
      this.player.canAddItem("star")
    ) {
      // Spawn star orb randomly
      const x = Math.random() * (this.width - 100) + 50;
      const y = Math.random() * (this.height - 100) + 50;
      this.starOrbs.push(new StarOrb(x, y));
    }

    // Spawn power-ups
    this.powerUpSpawnTimer++;
    if (this.powerUpSpawnTimer >= this.powerUpSpawnInterval) {
      this.spawnPowerUp();
      this.powerUpSpawnTimer = 0;
    }

    // Spawn bombs (level 3+)
    if (this.level >= 3) {
      this.bombSpawnTimer++;
      if (this.bombSpawnTimer >= this.bombSpawnInterval) {
        if (Math.random() < 0.2) {
          // 20% chance
          this.spawnBomb();
        }
        this.bombSpawnTimer = 0;
      }
    }

    // Update bombs
    this.bombs = this.bombs.filter((bomb) => {
      bomb.update(
        this.player.getCenterX(),
        this.player.getCenterY(),
        this.enemies,
        this.width,
        this.height
      );

      if (bomb.shouldExplode()) {
        // Create explosion (queued to prevent lag)
        const bombParticles = [];
        for (let i = 0; i < 12; i++) {
          bombParticles.push(new ExplosionParticle(bomb.x, bomb.y));
        }
        this.queueParticles(bombParticles);

        // Fire bomb creates fire patches
        if (bomb.isFireBomb) {
          const patches = bomb.createFirePatch(
            this.width,
            this.height,
            this.firePatches
          );
          patches.forEach((patch) => {
            this.firePatches.push(
              new FirePatch(patch.x, patch.y, patch.size, patch.duration)
            );
          });
        } else {
          // Normal bomb damages enemies
          this.enemies.forEach((enemy) => {
            const dx = enemy.getCenterX() - bomb.x;
            const dy = enemy.getCenterY() - bomb.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < bomb.explosionRadius) {
              enemy.takeDamage(50);
            }
          });
        }

        // Bomb destroys walls
        for (let i = this.walls.length - 1; i >= 0; i--) {
          const wall = this.walls[i];
          const dx = wall.getCenterX() - bomb.x;
          const dy = wall.getCenterY() - bomb.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < bomb.explosionRadius) {
            wall.explode(this.particles);
            this.walls.splice(i, 1);
          }
        }

        // Damage player if in radius
        const pdx = this.player.getCenterX() - bomb.x;
        const pdy = this.player.getCenterY() - bomb.y;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
        if (pdist < bomb.explosionRadius) {
          this.damageTaken += 30;
          if (this.player.takeDamage(30)) {
            this.startDeathAnimation();
          }
        }

        // Screen shake and glitch
        this.screenShake.shake(25, 30);
        this.triggerGlitch(
          10,
          1.0,
          bomb.x + bomb.width / 2,
          bomb.y + bomb.height / 2,
          250
        );

        return false;
      }

      return !bomb.exploded;
    });

    // Update fire patches
    this.firePatches = this.firePatches.filter((patch) => {
      patch.update();

      // Spread fire
      if (patch.shouldSpread()) {
        const spreadPatches = patch.createSpreadPatches(
          this.width,
          this.height
        );
        spreadPatches.forEach((sp) => {
          this.firePatches.push(
            new FirePatch(sp.x, sp.y, sp.size, sp.duration)
          );
        });
      }

      // Damage player in fire
      if (patch.checkPlayerCollision(this.player) && patch.shouldDamage()) {
        if (this.player.takeDamage(patch.damage)) {
          this.startDeathAnimation();
        }
      }

      // Transform enemies in fire
      this.enemies.forEach((enemy) => {
        if (patch.checkEnemyCollision(enemy) && !enemy.onFire) {
          enemy.ignite();
        }
      });

      return !patch.isExpired();
    });

    // Enemies on fire leave fire trails
    this.enemies.forEach((enemy) => {
      if (enemy.shouldLeaveFireTrail && enemy.shouldLeaveFireTrail()) {
        this.firePatches.push(
          new FirePatch(
            enemy.getCenterX(),
            enemy.getCenterY(),
            30,
            180 // 3 seconds
          )
        );
      }
    });

    // Update Walls
    this.walls.forEach((wall) => {
      wall.update();

      // Check player collision with walls
      if (wall.checkCollision(this.player)) {
        // Push player out of wall
        const dx = this.player.getCenterX() - wall.getCenterX();
        const dy = this.player.getCenterY() - wall.getCenterY();
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          const pushX = (dx / distance) * 5;
          const pushY = (dy / distance) * 5;
          this.player.x += pushX;
          this.player.y += pushY;
        }
      }
    });

    // Update placed bombs
    this.placedBombs = this.placedBombs.filter((bomb) => {
      bomb.update();

      if (bomb.shouldExplode()) {
        // Create explosion (queued to prevent lag)
        const placedBombParticles = [];
        for (let i = 0; i < 12; i++) {
          placedBombParticles.push(new ExplosionParticle(bomb.x, bomb.y));
        }
        this.queueParticles(placedBombParticles);

        // Damage enemies in radius
        for (let i = this.enemies.length - 1; i >= 0; i--) {
          const enemy = this.enemies[i];
          const dx = enemy.getCenterX() - bomb.x;
          const dy = enemy.getCenterY() - bomb.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < bomb.explosionRadius) {
            if (enemy.takeDamage(70)) {
              // Heavy damage
              // Enemy dies, spawn XP
              const orbCount =
                enemy.type === "smart"
                  ? 5
                  : enemy.type === "medium"
                  ? 3
                  : enemy.type === "teleport"
                  ? 6
                  : 2;
              const orbValue =
                enemy.type === "smart"
                  ? 10
                  : enemy.type === "teleport"
                  ? 10
                  : enemy.type === "medium"
                  ? 5
                  : 5;

              for (let k = 0; k < orbCount; k++) {
                this.xpOrbs.push(
                  new XPOrb(enemy.getCenterX(), enemy.getCenterY(), orbValue)
                );
              }

              this.enemies.splice(i, 1);
              this.score += orbValue * orbCount;
              this.enemiesKilled++;

              if (this.enemiesKilled >= this.enemiesPerLevel) {
                this.level++;
                this.enemiesKilled = 0;
                this.enemiesPerLevel += 5;
                this.startLevelTransition();
              }
            }
          }
        }

        // Damage player if in radius
        const pdx = this.player.getCenterX() - bomb.x;
        const pdy = this.player.getCenterY() - bomb.y;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
        if (pdist < bomb.explosionRadius) {
          if (this.player.takeDamage(20)) {
            this.startDeathAnimation();
          }
        }

        // Screen shake
        this.screenShake.shake(20, 25);

        return false;
      }

      return true;
    });
  }

  draw() {
    // VHS WAITING STATE - "INSERT CARD"
    if (this.vhsState === "waiting") {
      this.ctx.fillStyle = "#000000";
      this.ctx.fillRect(0, 0, this.width, this.height);

      // Blinking "INSERT CARD" text
      const blink = Math.floor(this.vhsBlinkTimer / 30) % 2 === 0;
      if (blink) {
        this.ctx.fillStyle = "#00ff00";
        this.ctx.font = "bold 32px Courier New";
        this.ctx.textAlign = "center";
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = "#00ff00";
        this.ctx.fillText(
          ">>> INSERT CARD <<<",
          this.width / 2,
          this.height / 2
        );
        this.ctx.shadowBlur = 0;

        // Subtle hint
        this.ctx.fillStyle = "#00ff00";
        this.ctx.font = "14px Courier New";
        this.ctx.globalAlpha = 0.5;
        this.ctx.fillText(
          "(click anywhere)",
          this.width / 2,
          this.height / 2 + 40
        );
        this.ctx.globalAlpha = 1;
        this.ctx.textAlign = "left";
      }
      return;
    }

    // VHS BOOT SEQUENCE
    if (this.vhsState === "booting") {
      const progress = this.vhsBootTimer / this.vhsBootDuration;

      this.ctx.fillStyle = "#000000";
      this.ctx.fillRect(0, 0, this.width, this.height);

      // Phase 1: Heavy static (0-30%)
      if (progress < 0.3) {
        const staticIntensity = 1 - progress / 0.3;
        this.vhsStatic.forEach((s) => {
          this.ctx.fillStyle = `rgba(${s.brightness * 255}, ${
            s.brightness * 255
          }, ${s.brightness * 255}, ${staticIntensity})`;
          this.ctx.fillRect(s.x, s.y, 2, 2);
        });

        // Tracking lines
        for (let i = 0; i < 5; i++) {
          const y = (this.vhsBootTimer * 10 + i * 100) % this.height;
          this.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
          this.ctx.fillRect(0, y, this.width, 3);
        }
      }
      // Phase 2: Color bars (30-50%)
      else if (progress < 0.5) {
        const colors = [
          "#ff0000",
          "#00ff00",
          "#0000ff",
          "#ffff00",
          "#ff00ff",
          "#00ffff",
          "#ffffff",
        ];
        const barWidth = this.width / colors.length;
        colors.forEach((color, i) => {
          this.ctx.fillStyle = color;
          this.ctx.fillRect(i * barWidth, 0, barWidth, this.height);
        });

        // Glitch effect
        if (Math.random() > 0.7) {
          this.ctx.fillStyle = "#000000";
          this.ctx.fillRect(
            Math.random() * this.width,
            Math.random() * this.height,
            100,
            50
          );
        }
      }
      // Phase 3: Logo with VHS effects (50-70%)
      else if (progress < 0.7) {
        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Show logo image with effects
        if (this.vhsLogo) {
          this.vhsLogo.style.display = "block";
          this.vhsLogo.style.left = "50%";
          this.vhsLogo.style.top = "50%";

          // Glitch effect on logo
          const glitch = Math.random() > 0.7;
          if (glitch) {
            const offset = (Math.random() - 0.5) * 20;
            this.vhsLogo.style.transform = `translate(calc(-50% + ${offset}px), -50%)`;
            this.vhsLogo.style.filter = `hue-rotate(${
              Math.random() * 360
            }deg) saturate(${1 + Math.random() * 2})`;
          } else {
            this.vhsLogo.style.transform = "translate(-50%, -50%)";
            this.vhsLogo.style.filter = "none";
          }
        }

        // "FRACTAL" text appears below logo
        const textProgress = (progress - 0.5) / 0.2; // 0 to 1 within phase 3
        if (textProgress > 0.3) {
          // Show text after logo has been visible for a bit
          const textGlitch = Math.random() > 0.8;
          const xOffset = textGlitch ? (Math.random() - 0.5) * 15 : 0;

          this.ctx.fillStyle = "#00ff00";
          this.ctx.font = "bold 64px Courier New";
          this.ctx.textAlign = "center";
          this.ctx.shadowBlur = 20;
          this.ctx.shadowColor = "#00ff00";

          // RGB split effect on text
          if (textGlitch) {
            this.ctx.fillStyle = "#ff0000";
            this.ctx.fillText(
              "FRACTAL",
              this.width / 2 + xOffset - 2,
              this.height / 2 + 250
            );
            this.ctx.fillStyle = "#00ff00";
            this.ctx.fillText(
              "FRACTAL",
              this.width / 2 + xOffset,
              this.height / 2 + 250
            );
            this.ctx.fillStyle = "#0000ff";
            this.ctx.fillText(
              "FRACTAL",
              this.width / 2 + xOffset + 2,
              this.height / 2 + 250
            );
          } else {
            this.ctx.fillText(
              "FRACTAL",
              this.width / 2 + xOffset,
              this.height / 2 + 250
            );
          }

          this.ctx.shadowBlur = 0;
          this.ctx.textAlign = "left";
        }

        // Scanlines over logo
        this.ctx.globalAlpha = 0.3;
        for (let y = 0; y < this.height; y += 4) {
          this.ctx.fillStyle = "#000000";
          this.ctx.fillRect(0, y, this.width, 2);
        }
        this.ctx.globalAlpha = 1;

        // Static overlay
        if (Math.random() > 0.8) {
          this.vhsStatic.slice(0, 200).forEach((s) => {
            this.ctx.fillStyle = `rgba(${s.brightness * 255}, ${
              s.brightness * 255
            }, ${s.brightness * 255}, 0.3)`;
            this.ctx.fillRect(s.x, s.y, 2, 2);
          });
        }
      }
      // Phase 4: Fade to game (70-100%)
      else {
        // Hide logo
        if (this.vhsLogo) {
          this.vhsLogo.style.display = "none";
        }
        if (this.vhsLogo) {
          this.vhsLogo.style.display = "none";
        }

        // Draw game normally
        this.drawGame();

        // Fade out overlay
        const fadeProgress = (progress - 0.7) / 0.3;
        this.ctx.fillStyle = `rgba(0, 0, 0, ${1 - fadeProgress})`;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Scanlines fade out
        this.ctx.globalAlpha = 1 - fadeProgress;
        for (let y = 0; y < this.height; y += 4) {
          this.ctx.fillStyle = "#000000";
          this.ctx.fillRect(0, y, this.width, 2);
        }
        this.ctx.globalAlpha = 1;
      }

      return;
    }

    // NORMAL GAME DRAW
    this.drawGame();
  }

  drawGame() {
    // Apply screen shake
    this.ctx.save();
    this.ctx.translate(this.screenShake.x, this.screenShake.y);

    // Removed full-screen color inversion - too epileptic

    // Clear canvas with slight vignette
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(
      -this.screenShake.x,
      -this.screenShake.y,
      this.width,
      this.height
    );

    // VHS chromatic aberration (RGB shift) - only when strong
    if (this.chromaticAberration > 0.5) {
      this.ctx.save();
      this.ctx.globalCompositeOperation = "lighter";
      this.ctx.globalAlpha = 0.1;
      this.ctx.translate(this.chromaticAberration * 0.3, 0);
      // Skip full redraw - just shift current frame
      this.ctx.restore();
    }

    // Normal draw
    this.ctx.globalAlpha = 1;
    this.drawGameObjects();

    // VHS Scanlines
    this.ctx.globalAlpha = 0.1;
    for (let y = this.scanlineOffset; y < this.height; y += 4) {
      this.ctx.fillStyle = "#000000";
      this.ctx.fillRect(-this.screenShake.x, y, this.width, 2);
    }
    this.ctx.globalAlpha = 1;

    // Localized glitch lines (only near source)
    if (this.glitchActive) {
      for (let i = 0; i < 3; i++) {
        // Generate glitch lines within radius of source
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.glitchRadius;
        const glitchX = this.glitchSourceX + Math.cos(angle) * distance;
        const glitchY = this.glitchSourceY + Math.sin(angle) * distance;
        const width = Math.random() * 80 + 30;
        const height = Math.random() * 10 + 3;

        this.ctx.fillStyle = `rgba(${Math.random() * 255}, ${
          Math.random() * 255
        }, ${Math.random() * 255}, 0.15)`;
        this.ctx.fillRect(
          glitchX -
            width / 2 -
            this.screenShake.x +
            Math.random() * this.glitchIntensity,
          glitchY - height / 2,
          width,
          height
        );
      }
    }

    // Vignette effect
    const gradient = this.ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      this.height * 0.3,
      this.width / 2,
      this.height / 2,
      this.height * 0.8
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.4)");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(
      -this.screenShake.x,
      -this.screenShake.y,
      this.width,
      this.height
    );

    // Reset filter
    this.ctx.filter = "none";

    this.ctx.restore();

    // Update HTML UI elements
    this.updateUI();

    // Level transition overlay
    if (this.levelTransition) {
      const timer = this.levelTransitionTimer;
      let boxScale = 0;
      let alpha = 0;

      // Calculate box scale based on animation phase
      if (timer < this.levelTransitionExpandDuration) {
        // Expanding phase
        const progress = timer / this.levelTransitionExpandDuration;
        boxScale = this.easeOutElastic(progress);
        alpha = progress;
      } else if (
        timer <
        this.levelTransitionExpandDuration + this.levelTransitionHoldDuration
      ) {
        // Hold phase
        boxScale = 1;
        alpha = 1;
      } else {
        // Shrinking phase
        const shrinkTimer =
          timer -
          this.levelTransitionExpandDuration -
          this.levelTransitionHoldDuration;
        const progress = shrinkTimer / this.levelTransitionShrinkDuration;
        boxScale = 1 - this.easeInBack(progress);
        alpha = 1 - progress;
      }

      // Dark overlay
      this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.6})`;
      this.ctx.fillRect(0, 0, this.width, this.height);

      if (boxScale > 0.01) {
        this.ctx.save();
        this.ctx.globalAlpha = alpha;

        const boxWidth = 500 * boxScale;
        const boxHeight = 150 * boxScale;
        const boxX = this.width / 2 - boxWidth / 2;
        const boxY = this.height / 2 - boxHeight / 2;

        // Box background
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        // Glitch effect border
        this.ctx.strokeStyle = "#00ff00";
        this.ctx.lineWidth = 4 * boxScale;
        this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        this.ctx.strokeStyle = "#ffff00";
        this.ctx.lineWidth = 2 * boxScale;
        this.ctx.strokeRect(boxX - 3, boxY - 3, boxWidth + 6, boxHeight + 6);

        // Text (only show when box is at least 50% size)
        if (boxScale > 0.5) {
          const textAlpha = (boxScale - 0.5) * 2; // Fade in text
          this.ctx.globalAlpha = alpha * textAlpha;

          this.ctx.fillStyle = "#00ff00";
          this.ctx.font = `bold ${72 * boxScale}px Arial`;
          this.ctx.textAlign = "center";
          this.ctx.shadowBlur = 20 * boxScale;
          this.ctx.shadowColor = "#00ff00";
          this.ctx.fillText(
            `>> LEVEL ${this.level} <<`,
            this.width / 2,
            this.height / 2 - 20 * boxScale + boxHeight / 2 - 60
          );
          this.ctx.shadowBlur = 0;
          this.ctx.font = `bold ${36 * boxScale}px Arial`;
          this.ctx.fillStyle = "#ffff00";
          this.ctx.fillText(
            "! GET READY !",
            this.width / 2,
            this.height / 2 + 40 * boxScale + boxHeight / 2 - 60
          );
        }

        this.ctx.restore();
        this.ctx.textAlign = "left";
      }
    }

    if (this.paused) {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      this.ctx.fillRect(0, 0, this.width, this.height);

      this.ctx.strokeStyle = "#00ff00";
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(this.width / 2 - 200, this.height / 2 - 80, 400, 160);

      this.ctx.fillStyle = "#00ff00";
      this.ctx.font = "bold 56px Outfit";
      this.ctx.textAlign = "center";
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = "#00ff00";
      this.ctx.fillText("|| PAUSED ||", this.width / 2, this.height / 2);
      this.ctx.shadowBlur = 0;
      this.ctx.font = "20px Outfit";
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fillText(
        "» ESC / P = resume",
        this.width / 2,
        this.height / 2 + 40
      );
      this.ctx.fillText("» R = restart", this.width / 2, this.height / 2 + 70);
      this.ctx.textAlign = "left";
    }

    if (this.gameOver) {
      // Full screen VHS static overlay
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.98)";
      this.ctx.fillRect(0, 0, this.width, this.height);

      // VHS noise
      for (let i = 0; i < 50; i++) {
        this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.05})`;
        this.ctx.fillRect(
          Math.random() * this.width,
          Math.random() * this.height,
          2,
          2
        );
      }

      // Larger VHS-style container
      const boxWidth = 900;
      const boxHeight = 550;
      const boxX = this.width / 2 - boxWidth / 2;
      const boxY = this.height / 2 - boxHeight / 2;

      // VHS-style scanlines background
      for (let y = boxY; y < boxY + boxHeight; y += 2) {
        this.ctx.fillStyle =
          y % 4 === 0 ? "rgba(0, 0, 0, 0.9)" : "rgba(10, 0, 0, 0.85)";
        this.ctx.fillRect(boxX, y, boxWidth, 2);
      }

      // Chunky retro border
      this.ctx.strokeStyle = "#ff0000";
      this.ctx.lineWidth = 6;
      this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      this.ctx.strokeStyle = "#660000";
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(boxX + 8, boxY + 8, boxWidth - 16, boxHeight - 16);

      // VHS glitch line effect
      const glitchY = boxY + Math.random() * boxHeight;
      this.ctx.fillStyle = `rgba(255, 0, 0, ${Math.random() * 0.3})`;
      this.ctx.fillRect(boxX, glitchY, boxWidth, 3);

      // Retro GAME OVER text with VHS chromatic aberration
      this.ctx.font = "bold 80px Courier New";
      this.ctx.textAlign = "center";

      // Red channel offset
      this.ctx.fillStyle = "#ff0000";
      this.ctx.fillText("× GAME OVER ×", this.width / 2 - 3, boxY + 90);
      // Cyan channel offset
      this.ctx.fillStyle = "#00ffff";
      this.ctx.fillText("× GAME OVER ×", this.width / 2 + 3, boxY + 90);
      // Main white text
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fillText("× GAME OVER ×", this.width / 2, boxY + 90);

      // VHS-style score display
      this.ctx.font = "bold 28px Courier New";
      this.ctx.fillStyle = "#ffff00";
      this.ctx.fillText(
        `LVL ${this.level} /// SCORE ${this.score}`,
        this.width / 2,
        boxY + 145
      );

      // Retro separator line
      this.ctx.strokeStyle = "#666666";
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(boxX + 50, boxY + 165);
      this.ctx.lineTo(boxX + boxWidth - 50, boxY + 165);
      this.ctx.stroke();

      // VHS-style playstyle title
      const playstyleData = this.getPlaystylePercentage();
      this.ctx.font = "bold 24px Courier New";
      this.ctx.fillStyle = "#00ff00";
      this.ctx.fillText(">> PLAYSTYLE ANALYSIS <<", this.width / 2, boxY + 205);

      // Blocky retro playstyle bar
      const barWidth = 600;
      const barHeight = 40;
      const barX = this.width / 2 - barWidth / 2;
      const barY = boxY + 225;

      // Bar background with scanlines
      this.ctx.fillStyle = "#000000";
      this.ctx.fillRect(barX, barY, barWidth, barHeight);

      // Attack portion - blocky red with dithering
      const attackWidth = (barWidth * playstyleData.attack) / 100;
      for (let y = 0; y < barHeight; y += 2) {
        this.ctx.fillStyle = y % 4 === 0 ? "#ff0000" : "#cc0000";
        this.ctx.fillRect(barX, barY + y, attackWidth, 2);
      }

      // Defense portion - blocky blue with dithering
      const defenseWidth = (barWidth * playstyleData.defense) / 100;
      for (let y = 0; y < barHeight; y += 2) {
        this.ctx.fillStyle = y % 4 === 0 ? "#0066ff" : "#0044cc";
        this.ctx.fillRect(barX + attackWidth, barY + y, defenseWidth, 2);
      }

      // Chunky bar border
      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(barX, barY, barWidth, barHeight);

      // VHS-style labels
      this.ctx.font = "bold 22px Courier New";
      this.ctx.fillStyle = "#ff4444";
      this.ctx.textAlign = "left";
      this.ctx.fillText(
        `[ATTACK: ${playstyleData.attack}%]`,
        barX,
        barY + barHeight + 35
      );

      this.ctx.fillStyle = "#4444ff";
      this.ctx.textAlign = "right";
      this.ctx.fillText(
        `[DEFENCE: ${playstyleData.defense}%]`,
        barX + barWidth,
        barY + barHeight + 35
      );
      this.ctx.textAlign = "center";

      // Another separator
      this.ctx.strokeStyle = "#666666";
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(boxX + 50, barY + barHeight + 55);
      this.ctx.lineTo(boxX + boxWidth - 50, barY + barHeight + 55);
      this.ctx.stroke();

      // Death cause - VHS style
      this.ctx.font = "bold 26px Courier New";
      this.ctx.fillStyle = "#ff6666";
      this.ctx.fillText(
        `[!] ${this.deathCause.toUpperCase()} [!]`,
        this.width / 2,
        barY + barHeight + 95
      );

      // Death message - retro monospace
      this.ctx.font = "20px Courier New";
      this.ctx.fillStyle = "#cccccc";

      // Wrap text
      const maxWidth = boxWidth - 120;
      const words = this.deathMessage.split(" ");
      let line = "";
      let y = barY + barHeight + 135;

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " ";
        const metrics = this.ctx.measureText(testLine);
        if (metrics.width > maxWidth && i > 0) {
          this.ctx.fillText(`> ${line.trim()}`, this.width / 2, y);
          line = words[i] + " ";
          y += 28;
        } else {
          line = testLine;
        }
      }
      this.ctx.fillText(`> ${line.trim()}`, this.width / 2, y);

      // VHS timestamp effect
      const timestamp =
        new Date().toISOString().split("T")[0] +
        " " +
        new Date().toTimeString().split(" ")[0];
      this.ctx.font = "14px Courier New";
      this.ctx.fillStyle = "#666666";
      this.ctx.textAlign = "right";
      this.ctx.fillText(
        `REC ${timestamp}`,
        boxX + boxWidth - 20,
        boxY + boxHeight - 50
      );

      // Restart prompt - blinking VHS style
      const blink = Math.floor(Date.now() / 500) % 2;
      if (blink) {
        this.ctx.font = "bold 24px Courier New";
        this.ctx.fillStyle = "#00ff00";
        this.ctx.textAlign = "center";
        this.ctx.fillText(
          "[PRESS R TO RESTART]",
          this.width / 2,
          boxY + boxHeight - 35
        );
      }

      this.ctx.textAlign = "left";
    }
  }

  animate(timestamp) {
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.update();
    this.draw();

    requestAnimationFrame((time) => this.animate(time));
  }
}
