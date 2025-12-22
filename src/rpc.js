const { Client } = require("discord-rpc");

const CLIENT_ID = "123123123123123123"; // Replace with your actual Discord Application Client ID

class DiscordRPC {
  constructor() {
    this.client = null;
    this.connected = false;
    this.startTimestamp = Date.now();
    this.currentState = {
      level: 1,
      activity: "booting...",
      boss: null,
      enemyCount: 0,
      paused: false,
      dead: false,
      deathMessage: null,
    };
    this.animationFrame = 0;
    this.animationInterval = null;
  }

  async connect() {
    try {
      this.client = new Client({ transport: "ipc" });

      this.client.on("ready", () => {
        console.log("[Discord RPC] Connected as", this.client.user.username);
        this.connected = true;
        this.startTimestamp = Date.now();
        this.updatePresence();
        this.startAnimation();
      });

      this.client.on("disconnected", () => {
        console.log("[Discord RPC] Disconnected");
        this.connected = false;
        this.stopAnimation();
      });

      await this.client.login({ clientId: CLIENT_ID });
    } catch (error) {
      console.error("[Discord RPC] Failed to connect:", error.message);
      this.connected = false;
    }
  }

  startAnimation() {
    this.animationInterval = setInterval(() => {
      if (
        this.connected &&
        !this.currentState.boss &&
        !this.currentState.dead &&
        !this.currentState.paused
      ) {
        this.animationFrame = (this.animationFrame + 1) % 2;
        this.updatePresence();
      }
    }, 800);
  }

  stopAnimation() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
  }

  updateState(state) {
    this.currentState = { ...this.currentState, ...state };

    // Reset animation frame when entering boss fight
    if (state.boss) {
      this.animationFrame = 0;
    }

    // Reset start timestamp on new game
    if (state.activity === "booting..." || state.newGame) {
      this.startTimestamp = Date.now();
    }

    this.updatePresence();
  }

  getActivityDetails() {
    const { level, activity, boss, enemyCount, paused, dead, deathMessage } =
      this.currentState;

    if (dead) {
      // Check if died during boss fight
      if (boss) {
        const bossName = boss === "mage" ? "Mage" : "Nova";
        return {
          details: `DEAD - ${bossName} Fight`,
          state: deathMessage || "Skill issue",
          largeImageKey: "death",
          largeImageText: `Killed by ${bossName.toUpperCase()}`,
        };
      }

      return {
        details: `DEAD - Level ${level}`,
        state: deathMessage || "Skill issue",
        largeImageKey: "death",
        largeImageText: deathMessage || "Game Over",
      };
    }

    if (paused) {
      return {
        details: `Paused - Level ${level}`,
        state: "Taking a break...",
        largeImageKey: "fractal_logo",
        largeImageText: "FRACTAL",
        smallImageKey: "pause",
        smallImageText: "Paused",
      };
    }

    if (boss) {
      const bossName = boss === "mage" ? "MAGE" : "NOVA";
      const bossImage = boss === "mage" ? "boss_mage" : "boss_nova";
      const bossText =
        boss === "mage" ? "Purple Magic Terror" : "Chaos Incarnate";

      return {
        details: `BOSS FIGHT - Level ${level}`,
        state: `Fighting ${bossName}!`,
        largeImageKey: bossImage,
        largeImageText: `${bossName} - ${bossText}`,
        smallImageKey: "star",
        smallImageText: "In Combat",
      };
    }

    // Starting state - just show logo
    if (activity === "starting") {
      return {
        details: "FRACTAL",
        state: "booting up...",
        largeImageKey: "fractal_logo",
        largeImageText: "FRACTAL",
      };
    }

    // Regular gameplay
    let state = "Playing...";
    let smallImage = "idle";
    let smallText = "Idle";

    switch (activity) {
      case "idle":
        state = "Standing still...";
        smallImage = "idle";
        smallText = "Idle";
        break;
      case "fighting":
        if (enemyCount >= 10) {
          state = `ENEMY STORM! (${enemyCount} enemies)`;
          smallImage = "storm";
          smallText = "Overwhelmed!";
        } else if (enemyCount >= 5) {
          state = `Fighting ${enemyCount} enemies`;
          smallImage = "combat";
          smallText = "In Combat";
        } else {
          state = `Fighting ${enemyCount} ${
            enemyCount === 1 ? "enemy" : "enemies"
          }`;
          smallImage = "combat";
          smallText = "In Combat";
        }
        break;
      default:
        state = "Playing...";
        break;
    }

    // Animated enemy image (frame 0 or 1)
    const enemyImage = this.animationFrame === 0 ? "enemy_idle" : "enemy_jump";

    return {
      details: `Level ${level}`,
      state: state,
      largeImageKey: enemyImage,
      largeImageText: "Geometric Violence",
      smallImageKey: smallImage,
      smallImageText: smallText,
    };
  }

  async updatePresence() {
    if (!this.connected || !this.client) return;

    try {
      const activity = this.getActivityDetails();

      await this.client.setActivity({
        details: activity.details,
        state: activity.state,
        startTimestamp: this.startTimestamp,
        largeImageKey: activity.largeImageKey,
        largeImageText: activity.largeImageText,
        smallImageKey: activity.smallImageKey,
        smallImageText: activity.smallImageText,
        instance: false,
        buttons: [
          {
            label: "Get FRACTAL",
            url: "https://github.com/NotYarazi/fractal",
          },
        ],
      });
    } catch (error) {
      console.error("[Discord RPC] Failed to update presence:", error.message);
    }
  }

  async disconnect() {
    this.stopAnimation();
    if (this.client) {
      try {
        await this.client.clearActivity();
        await this.client.destroy();
      } catch (e) {
        // Ignore disconnect errors
      }
      this.connected = false;
      this.client = null;
    }
  }
}

module.exports = DiscordRPC;
