// ============================================================================
// LIVE SECTION - GAME STATE & WEBSOCKET IMPLEMENTATION
// ============================================================================

const http = require("http");
const socketIo = require("socket.io");

/**
 * Game Status Enum
 */
const GAME_STATUS = {
  SCHEDULED: "SCHEDULED",
  LIVE: "LIVE",
  HALFTIME: "HALFTIME",
  EXTRA_TIME: "EXTRA_TIME",
  PENALTY_SHOOTOUT: "PENALTY_SHOOTOUT",
  FINISHED: "FINISHED",
};

/**
 * Game Events
 */
const GAME_EVENTS = {
  SCORE_UPDATED: "SCORE_UPDATED",
  STATUS_CHANGED: "STATUS_CHANGED",
  HALFTIME: "HALFTIME",
  FULLTIME: "FULLTIME",
  PENALTY_STARTED: "PENALTY_STARTED",
  PENALTY_GOAL: "PENALTY_GOAL",
  PENALTY_MISSED: "PENALTY_MISSED",
};

/**
 * Game Model with Live Extensions
 */
class LiveGame {
  constructor(gameData = {}) {
    this.id = gameData.id || null;
    this.homeTeam = gameData.homeTeam || "";
    this.awayTeam = gameData.awayTeam || "";
    this.homeScore = gameData.homeScore || 0;
    this.awayScore = gameData.awayScore || 0;
    this.status = gameData.status || GAME_STATUS.SCHEDULED;
    this.currentMinute = gameData.currentMinute || 0;
    this.date = gameData.date || new Date().toISOString();
    this.competition = gameData.competition || "Tournament";

    // Penalty Shootout Fields
    this.penaltiesEnabled = gameData.penaltiesEnabled || false;
    this.homePenaltyScore = gameData.homePenaltyScore || 0;
    this.awayPenaltyScore = gameData.awayPenaltyScore || 0;
    this.penaltySequence = gameData.penaltySequence || [];
  }

  /**
   * Update score
   */
  updateScore(homeScore, awayScore) {
    this.homeScore = homeScore;
    this.awayScore = awayScore;

    // Check if game should go to penalties
    if (
      this.status === GAME_STATUS.EXTRA_TIME &&
      homeScore === awayScore &&
      homeScore > 0
    ) {
      this.status = GAME_STATUS.PENALTY_SHOOTOUT;
      this.penaltiesEnabled = true;
    }
  }

  /**
   * Update game status
   */
  setStatus(status) {
    if (Object.values(GAME_STATUS).includes(status)) {
      this.status = status;
    }
  }

  /**
   * Update current minute
   */
  updateMinute(minute) {
    this.currentMinute = Math.max(0, minute);
  }

  /**
   * Record penalty attempt
   */
  recordPenalty(isHome, isGoal) {
    if (!this.penaltiesEnabled) return false;

    const penalty = {
      team: isHome ? "home" : "away",
      goal: isGoal,
      timestamp: new Date().toISOString(),
    };

    this.penaltySequence.push(penalty);

    if (isGoal) {
      if (isHome) this.homePenaltyScore++;
      else this.awayPenaltyScore++;
    }

    return true;
  }

  /**
   * Get penalty shootout winner
   */
  getPenaltyWinner() {
    if (!this.penaltiesEnabled) return null;

    if (this.homePenaltyScore > this.awayPenaltyScore) return "home";
    if (this.awayPenaltyScore > this.homePenaltyScore) return "away";
    return null;
  }

  /**
   * Is game today?
   */
  isToday() {
    const gameDate = new Date(this.date);
    const today = new Date();
    return (
      gameDate.getFullYear() === today.getFullYear() &&
      gameDate.getMonth() === today.getMonth() &&
      gameDate.getDate() === today.getDate()
    );
  }

  /**
   * Get display score (including penalties if applicable)
   */
  getDisplayScore() {
    if (this.penaltiesEnabled) {
      return `${this.homeScore}:${this.awayScore} (${this.homePenaltyScore}:${this.awayPenaltyScore})`;
    }
    return `${this.homeScore}:${this.awayScore}`;
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      id: this.id,
      homeTeam: this.homeTeam,
      awayTeam: this.awayTeam,
      homeScore: this.homeScore,
      awayScore: this.awayScore,
      status: this.status,
      currentMinute: this.currentMinute,
      date: this.date,
      competition: this.competition,
      penaltiesEnabled: this.penaltiesEnabled,
      homePenaltyScore: this.homePenaltyScore,
      awayPenaltyScore: this.awayPenaltyScore,
      displayScore: this.getDisplayScore(),
    };
  }
}

/**
 * Live Games Manager
 */
class LiveGamesManager {
  constructor() {
    this.games = new Map();
    this.watchers = new Set(); // WebSocket clients
  }

  /**
   * Add or update game
   */
  addGame(game) {
    if (!(game instanceof LiveGame)) {
      game = new LiveGame(game);
    }
    this.games.set(game.id, game);
    return game;
  }

  /**
   * Get game by ID
   */
  getGame(gameId) {
    return this.games.get(gameId);
  }

  /**
   * Get all games
   */
  getAllGames() {
    return Array.from(this.games.values());
  }

  /**
   * Get today's games
   */
  getTodayGames() {
    return Array.from(this.games.values()).filter((game) => game.isToday());
  }

  /**
   * Get live games (currently playing)
   */
  getLiveGames() {
    return this.getTodayGames().filter((game) =>
      [GAME_STATUS.LIVE, GAME_STATUS.HALFTIME, GAME_STATUS.EXTRA_TIME].includes(
        game.status
      )
    );
  }

  /**
   * Update game score and broadcast
   */
  updateGameScore(gameId, homeScore, awayScore) {
    const game = this.getGame(gameId);
    if (!game) return null;

    game.updateScore(homeScore, awayScore);

    // Broadcast to all watchers
    this.broadcastEvent(GAME_EVENTS.SCORE_UPDATED, {
      gameId,
      homeScore,
      awayScore,
      displayScore: game.getDisplayScore(),
      status: game.status,
    });

    return game;
  }

  /**
   * Update game status and broadcast
   */
  updateGameStatus(gameId, status) {
    const game = this.getGame(gameId);
    if (!game) return null;

    const oldStatus = game.status;
    game.setStatus(status);

    this.broadcastEvent(GAME_EVENTS.STATUS_CHANGED, {
      gameId,
      status,
      oldStatus,
    });

    if (status === GAME_STATUS.PENALTY_SHOOTOUT) {
      this.broadcastEvent(GAME_EVENTS.PENALTY_STARTED, { gameId });
    }

    return game;
  }

  /**
   * Record penalty attempt
   */
  recordPenalty(gameId, isHome, isGoal) {
    const game = this.getGame(gameId);
    if (!game || !game.penaltiesEnabled) return null;

    game.recordPenalty(isHome, isGoal);

    const eventType = isGoal
      ? GAME_EVENTS.PENALTY_GOAL
      : GAME_EVENTS.PENALTY_MISSED;

    this.broadcastEvent(eventType, {
      gameId,
      team: isHome ? "home" : "away",
      homePenaltyScore: game.homePenaltyScore,
      awayPenaltyScore: game.awayPenaltyScore,
      penaltyWinner: game.getPenaltyWinner(),
    });

    return game;
  }

  /**
   * Register WebSocket watcher
   */
  addWatcher(socketId) {
    this.watchers.add(socketId);
  }

  /**
   * Unregister WebSocket watcher
   */
  removeWatcher(socketId) {
    this.watchers.delete(socketId);
  }

  /**
   * Broadcast event to all watchers
   */
  broadcastEvent(eventType, data, io = null) {
    if (!io) return;

    io.emit(eventType, {
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  /**
   * Get watcher count
   */
  getWatcherCount() {
    return this.watchers.size;
  }
}

module.exports = {
  GAME_STATUS,
  GAME_EVENTS,
  LiveGame,
  LiveGamesManager,
};
