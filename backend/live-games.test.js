const { GAME_STATUS, GAME_EVENTS, LiveGame, LiveGamesManager } = require("./live-games");

// ============================================================================
// LIVE GAME STATE TESTS
// ============================================================================

describe("LiveGame Model", () => {
  let game;

  beforeEach(() => {
    game = new LiveGame({
      id: 1,
      homeTeam: "Team A",
      awayTeam: "Team B",
      homeScore: 0,
      awayScore: 0,
      status: GAME_STATUS.SCHEDULED,
      currentMinute: 0,
      date: new Date().toISOString(),
      competition: "Tournament",
    });
  });

  describe("Score Updates", () => {
    it("should update home score", () => {
      game.updateScore(1, 0);
      expect(game.homeScore).toBe(1);
      expect(game.awayScore).toBe(0);
    });

    it("should update away score", () => {
      game.updateScore(0, 2);
      expect(game.homeScore).toBe(0);
      expect(game.awayScore).toBe(2);
    });

    it("should update both scores", () => {
      game.updateScore(2, 3);
      expect(game.homeScore).toBe(2);
      expect(game.awayScore).toBe(3);
    });

    it("should trigger penalty shootout when extra time ends tied", () => {
      game.status = GAME_STATUS.EXTRA_TIME;
      game.updateScore(2, 2);

      expect(game.status).toBe(GAME_STATUS.PENALTY_SHOOTOUT);
      expect(game.penaltiesEnabled).toBe(true);
    });
  });

  describe("Status Management", () => {
    it("should set valid status", () => {
      game.setStatus(GAME_STATUS.LIVE);
      expect(game.status).toBe(GAME_STATUS.LIVE);
    });

    it("should ignore invalid status", () => {
      const oldStatus = game.status;
      game.setStatus("INVALID_STATUS");
      expect(game.status).toBe(oldStatus);
    });

    it("should transition through status correctly", () => {
      expect(game.status).toBe(GAME_STATUS.SCHEDULED);

      game.setStatus(GAME_STATUS.LIVE);
      expect(game.status).toBe(GAME_STATUS.LIVE);

      game.setStatus(GAME_STATUS.HALFTIME);
      expect(game.status).toBe(GAME_STATUS.HALFTIME);

      game.setStatus(GAME_STATUS.LIVE);
      expect(game.status).toBe(GAME_STATUS.LIVE);

      game.setStatus(GAME_STATUS.FINISHED);
      expect(game.status).toBe(GAME_STATUS.FINISHED);
    });
  });

  describe("Minute Updates", () => {
    it("should update minute", () => {
      game.updateMinute(45);
      expect(game.currentMinute).toBe(45);
    });

    it("should prevent negative minutes", () => {
      game.updateMinute(-5);
      expect(game.currentMinute).toBe(0);
    });

    it("should handle large minute values", () => {
      game.updateMinute(120);
      expect(game.currentMinute).toBe(120);
    });
  });

  describe("Penalty Shootout", () => {
    beforeEach(() => {
      game.penaltiesEnabled = true;
    });

    it("should record home penalty goal", () => {
      game.recordPenalty(true, true);

      expect(game.homePenaltyScore).toBe(1);
      expect(game.awayPenaltyScore).toBe(0);
      expect(game.penaltySequence.length).toBe(1);
    });

    it("should record away penalty miss", () => {
      game.recordPenalty(false, false);

      expect(game.homePenaltyScore).toBe(0);
      expect(game.awayPenaltyScore).toBe(0);
      expect(game.penaltySequence.length).toBe(1);
    });

    it("should record multiple penalties", () => {
      game.recordPenalty(true, true);
      game.recordPenalty(false, true);
      game.recordPenalty(true, false);
      game.recordPenalty(false, true);

      expect(game.homePenaltyScore).toBe(1);
      expect(game.awayPenaltyScore).toBe(2);
      expect(game.penaltySequence.length).toBe(4);
    });

    it("should not record penalty if not enabled", () => {
      game.penaltiesEnabled = false;
      const result = game.recordPenalty(true, true);

      expect(result).toBe(false);
      expect(game.homePenaltyScore).toBe(0);
    });

    it("should determine penalty shootout winner", () => {
      game.recordPenalty(true, true);
      game.recordPenalty(true, true);
      game.recordPenalty(false, true);

      expect(game.getPenaltyWinner()).toBe("home");
    });

    it("should return null for tied penalty shootout", () => {
      game.recordPenalty(true, true);
      game.recordPenalty(false, true);

      expect(game.getPenaltyWinner()).toBeNull();
    });
  });

  describe("Today Check", () => {
    it("should recognize today's game", () => {
      game.date = new Date().toISOString();
      expect(game.isToday()).toBe(true);
    });

    it("should reject yesterday's game", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      game.date = yesterday.toISOString();

      expect(game.isToday()).toBe(false);
    });

    it("should reject tomorrow's game", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      game.date = tomorrow.toISOString();

      expect(game.isToday()).toBe(false);
    });
  });

  describe("Display Score", () => {
    it("should display regular score", () => {
      game.updateScore(2, 1);
      expect(game.getDisplayScore()).toBe("2:1");
    });

    it("should display score with penalties", () => {
      game.penaltiesEnabled = true;
      game.homeScore = 2;
      game.awayScore = 2;
      game.homePenaltyScore = 4;
      game.awayPenaltyScore = 3;

      expect(game.getDisplayScore()).toBe("2:2 (4:3)");
    });
  });

  describe("JSON Serialization", () => {
    it("should serialize to JSON", () => {
      game.updateScore(2, 1);
      const json = game.toJSON();

      expect(json.id).toBe(1);
      expect(json.homeScore).toBe(2);
      expect(json.awayScore).toBe(1);
      expect(json.status).toBe(GAME_STATUS.SCHEDULED);
      expect(json.displayScore).toBe("2:1");
    });

    it("should include all required fields", () => {
      const json = game.toJSON();

      expect(json).toHaveProperty("id");
      expect(json).toHaveProperty("homeTeam");
      expect(json).toHaveProperty("awayTeam");
      expect(json).toHaveProperty("homeScore");
      expect(json).toHaveProperty("awayScore");
      expect(json).toHaveProperty("status");
      expect(json).toHaveProperty("currentMinute");
      expect(json).toHaveProperty("date");
      expect(json).toHaveProperty("competition");
      expect(json).toHaveProperty("penaltiesEnabled");
      expect(json).toHaveProperty("displayScore");
    });
  });
});

// ============================================================================
// LIVE GAMES MANAGER TESTS
// ============================================================================

describe("LiveGamesManager", () => {
  let manager;
  let game1, game2, game3;

  beforeEach(() => {
    manager = new LiveGamesManager();

    const today = new Date().toISOString();

    game1 = new LiveGame({
      id: 1,
      homeTeam: "Team A",
      awayTeam: "Team B",
      homeScore: 0,
      awayScore: 0,
      status: GAME_STATUS.SCHEDULED,
      date: today,
    });

    game2 = new LiveGame({
      id: 2,
      homeTeam: "Team C",
      awayTeam: "Team D",
      homeScore: 1,
      awayScore: 0,
      status: GAME_STATUS.LIVE,
      date: today,
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    game3 = new LiveGame({
      id: 3,
      homeTeam: "Team E",
      awayTeam: "Team F",
      homeScore: 0,
      awayScore: 0,
      status: GAME_STATUS.SCHEDULED,
      date: tomorrow.toISOString(),
    });

    manager.addGame(game1);
    manager.addGame(game2);
    manager.addGame(game3);
  });

  describe("Game Management", () => {
    it("should add game", () => {
      expect(manager.getGame(1)).toBe(game1);
    });

    it("should get all games", () => {
      const allGames = manager.getAllGames();
      expect(allGames.length).toBe(3);
    });

    it("should get today's games", () => {
      const todayGames = manager.getTodayGames();
      expect(todayGames.length).toBe(2);
      expect(todayGames.map((g) => g.id)).toContain(1);
      expect(todayGames.map((g) => g.id)).toContain(2);
      expect(todayGames.map((g) => g.id)).not.toContain(3);
    });

    it("should get live games", () => {
      const liveGames = manager.getLiveGames();
      expect(liveGames.length).toBe(1);
      expect(liveGames[0].id).toBe(2);
    });

    it("should return null for non-existent game", () => {
      expect(manager.getGame(999)).toBeUndefined();
    });
  });

  describe("Score Updates", () => {
    it("should update game score", () => {
      manager.updateGameScore(1, 2, 1);

      const game = manager.getGame(1);
      expect(game.homeScore).toBe(2);
      expect(game.awayScore).toBe(1);
    });

    it("should return null for non-existent game", () => {
      const result = manager.updateGameScore(999, 1, 0);
      expect(result).toBeNull();
    });
  });

  describe("Status Updates", () => {
    it("should update game status", () => {
      manager.updateGameStatus(1, GAME_STATUS.LIVE);

      const game = manager.getGame(1);
      expect(game.status).toBe(GAME_STATUS.LIVE);
    });

    it("should return null for non-existent game", () => {
      const result = manager.updateGameStatus(999, GAME_STATUS.LIVE);
      expect(result).toBeNull();
    });
  });

  describe("Penalty Management", () => {
    beforeEach(() => {
      const game = manager.getGame(1);
      game.penaltiesEnabled = true;
    });

    it("should record penalty", () => {
      manager.recordPenalty(1, true, true);

      const game = manager.getGame(1);
      expect(game.homePenaltyScore).toBe(1);
    });

    it("should return null if penalties not enabled", () => {
      const result = manager.recordPenalty(2, true, true);
      expect(result).toBeNull();
    });
  });

  describe("Watcher Management", () => {
    it("should add watcher", () => {
      manager.addWatcher("socket-1");
      expect(manager.getWatcherCount()).toBe(1);
    });

    it("should remove watcher", () => {
      manager.addWatcher("socket-1");
      manager.addWatcher("socket-2");
      expect(manager.getWatcherCount()).toBe(2);

      manager.removeWatcher("socket-1");
      expect(manager.getWatcherCount()).toBe(1);
    });

    it("should handle multiple watchers", () => {
      manager.addWatcher("socket-1");
      manager.addWatcher("socket-2");
      manager.addWatcher("socket-3");

      expect(manager.getWatcherCount()).toBe(3);
    });

    it("should not double-add same watcher", () => {
      manager.addWatcher("socket-1");
      manager.addWatcher("socket-1");

      expect(manager.getWatcherCount()).toBe(1);
    });
  });
});

// ============================================================================
// GAME STATUS LOGIC TESTS
// ============================================================================

describe("Game Status Logic", () => {
  it("should handle all status values", () => {
    const statusValues = Object.values(GAME_STATUS);
    expect(statusValues).toContain("SCHEDULED");
    expect(statusValues).toContain("LIVE");
    expect(statusValues).toContain("HALFTIME");
    expect(statusValues).toContain("EXTRA_TIME");
    expect(statusValues).toContain("PENALTY_SHOOTOUT");
    expect(statusValues).toContain("FINISHED");
  });

  it("should have all event types", () => {
    const eventValues = Object.values(GAME_EVENTS);
    expect(eventValues).toContain("SCORE_UPDATED");
    expect(eventValues).toContain("STATUS_CHANGED");
    expect(eventValues).toContain("HALFTIME");
    expect(eventValues).toContain("FULLTIME");
    expect(eventValues).toContain("PENALTY_STARTED");
  });
});

// ============================================================================
// REAL-TIME UPDATE SCENARIOS
// ============================================================================

describe("Real-time Update Scenarios", () => {
  let manager;

  beforeEach(() => {
    manager = new LiveGamesManager();
    const today = new Date().toISOString();

    manager.addGame(
      new LiveGame({
        id: 1,
        homeTeam: "Team A",
        awayTeam: "Team B",
        status: GAME_STATUS.SCHEDULED,
        date: today,
      })
    );
  });

  it("should handle goal scenario", () => {
    const game = manager.getGame(1);
    game.setStatus(GAME_STATUS.LIVE);
    game.updateMinute(15);

    manager.updateGameScore(1, 1, 0);

    expect(game.homeScore).toBe(1);
    expect(game.currentMinute).toBe(15);
    expect(game.status).toBe(GAME_STATUS.LIVE);
  });

  it("should handle halftime", () => {
    const game = manager.getGame(1);
    game.setStatus(GAME_STATUS.LIVE);
    game.updateScore(1, 0);

    manager.updateGameStatus(1, GAME_STATUS.HALFTIME);

    expect(game.status).toBe(GAME_STATUS.HALFTIME);
    expect(game.homeScore).toBe(1);
  });

  it("should handle extra time and penalties", () => {
    const game = manager.getGame(1);
    game.setStatus(GAME_STATUS.LIVE);
    game.updateScore(1, 0);

    game.setStatus(GAME_STATUS.EXTRA_TIME);
    game.updateScore(2, 2);

    expect(game.status).toBe(GAME_STATUS.PENALTY_SHOOTOUT);
    expect(game.penaltiesEnabled).toBe(true);
  });

  it("should handle complete match scenario", () => {
    const game = manager.getGame(1);

    // Start match
    game.setStatus(GAME_STATUS.LIVE);
    expect(game.status).toBe(GAME_STATUS.LIVE);

    // Score goals
    game.updateScore(1, 0);
    game.updateMinute(20);

    game.updateScore(2, 0);
    game.updateMinute(45);

    // Halftime
    game.setStatus(GAME_STATUS.HALFTIME);
    expect(game.currentMinute).toBe(45);

    // Second half
    game.setStatus(GAME_STATUS.LIVE);
    game.updateMinute(60);

    // Finish
    game.setStatus(GAME_STATUS.FINISHED);
    expect(game.homeScore).toBe(2);
    expect(game.status).toBe(GAME_STATUS.FINISHED);
  });
});
