import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-f23776ac/health", (c) => {
  return c.json({ status: "ok" });
});

// Get all collections
app.get("/make-server-f23776ac/collections", async (c) => {
  try {
    const collections = await kv.getByPrefix("collection:");
    return c.json({ collections: collections || [] });
  } catch (error) {
    console.log(`Error fetching collections: ${error}`);
    return c.json({ error: "Failed to fetch collections" }, 500);
  }
});

// Get a specific collection by ID
app.get("/make-server-f23776ac/collections/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const collection = await kv.get(`collection:${id}`);
    
    if (!collection) {
      return c.json({ error: "Collection not found" }, 404);
    }
    
    return c.json({ collection });
  } catch (error) {
    console.log(`Error fetching collection: ${error}`);
    return c.json({ error: "Failed to fetch collection" }, 500);
  }
});

// Create a new collection
app.post("/make-server-f23776ac/collections", async (c) => {
  try {
    const body = await c.req.json();
    const { name, description, words } = body;
    
    if (!name || !words || !Array.isArray(words)) {
      return c.json({ error: "Invalid collection data" }, 400);
    }
    
    const id = crypto.randomUUID();
    const collection = {
      id,
      name,
      description: description || "",
      wordCount: words.length,
      words,
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`collection:${id}`, collection);
    return c.json({ collection }, 201);
  } catch (error) {
    console.log(`Error creating collection: ${error}`);
    return c.json({ error: "Failed to create collection" }, 500);
  }
});

// Create a new battle room
app.post("/make-server-f23776ac/battles", async (c) => {
  try {
    const body = await c.req.json();
    const { collectionId, hostName } = body;
    
    if (!collectionId || !hostName) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    const collection = await kv.get(`collection:${collectionId}`);
    if (!collection) {
      return c.json({ error: "Collection not found" }, 404);
    }
    
    const battleId = crypto.randomUUID();
    const battle = {
      id: battleId,
      collectionId,
      status: "waiting", // waiting, active, completed
      participants: [
        {
          id: crypto.randomUUID(),
          name: hostName,
          avatar: "🎯",
          score: 0,
          progress: 0,
          isHost: true,
          answers: [],
        },
      ],
      currentQuestion: 0,
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`battle:${battleId}`, battle);
    return c.json({ battle }, 201);
  } catch (error) {
    console.log(`Error creating battle: ${error}`);
    return c.json({ error: "Failed to create battle" }, 500);
  }
});

// Join a battle room
app.post("/make-server-f23776ac/battles/:battleId/join", async (c) => {
  try {
    const battleId = c.req.param("battleId");
    const body = await c.req.json();
    const { playerName } = body;
    
    if (!playerName) {
      return c.json({ error: "Player name is required" }, 400);
    }
    
    const battle = await kv.get(`battle:${battleId}`);
    if (!battle) {
      return c.json({ error: "Battle not found" }, 404);
    }
    
    if (battle.status !== "waiting") {
      return c.json({ error: "Battle already started" }, 400);
    }
    
    const avatars = ["🚀", "⭐", "💎", "🔥", "⚡", "🌟", "🎨", "🎭"];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
    
    const newParticipant = {
      id: crypto.randomUUID(),
      name: playerName,
      avatar: randomAvatar,
      score: 0,
      progress: 0,
      isHost: false,
      answers: [],
    };
    
    battle.participants.push(newParticipant);
    await kv.set(`battle:${battleId}`, battle);
    
    return c.json({ battle, participantId: newParticipant.id });
  } catch (error) {
    console.log(`Error joining battle: ${error}`);
    return c.json({ error: "Failed to join battle" }, 500);
  }
});

// Get battle state
app.get("/make-server-f23776ac/battles/:battleId", async (c) => {
  try {
    const battleId = c.req.param("battleId");
    const battle = await kv.get(`battle:${battleId}`);
    
    if (!battle) {
      return c.json({ error: "Battle not found" }, 404);
    }
    
    return c.json({ battle });
  } catch (error) {
    console.log(`Error fetching battle: ${error}`);
    return c.json({ error: "Failed to fetch battle" }, 500);
  }
});

// Start a battle
app.post("/make-server-f23776ac/battles/:battleId/start", async (c) => {
  try {
    const battleId = c.req.param("battleId");
    const battle = await kv.get(`battle:${battleId}`);
    
    if (!battle) {
      return c.json({ error: "Battle not found" }, 404);
    }
    
    if (battle.status !== "waiting") {
      return c.json({ error: "Battle already started" }, 400);
    }
    
    battle.status = "active";
    battle.startedAt = new Date().toISOString();
    
    await kv.set(`battle:${battleId}`, battle);
    return c.json({ battle });
  } catch (error) {
    console.log(`Error starting battle: ${error}`);
    return c.json({ error: "Failed to start battle" }, 500);
  }
});

// Submit an answer in a battle
app.post("/make-server-f23776ac/battles/:battleId/answer", async (c) => {
  try {
    const battleId = c.req.param("battleId");
    const body = await c.req.json();
    const { participantId, answer, questionIndex } = body;
    
    if (!participantId || answer === undefined || questionIndex === undefined) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    const battle = await kv.get(`battle:${battleId}`);
    if (!battle) {
      return c.json({ error: "Battle not found" }, 404);
    }
    
    const collection = await kv.get(`collection:${battle.collectionId}`);
    if (!collection) {
      return c.json({ error: "Collection not found" }, 404);
    }
    
    const participantIndex = battle.participants.findIndex(
      (p: any) => p.id === participantId
    );
    
    if (participantIndex === -1) {
      return c.json({ error: "Participant not found" }, 404);
    }
    
    const currentQuestion = collection.words[questionIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;
    
    battle.participants[participantIndex].answers.push({
      questionIndex,
      answer,
      isCorrect,
      timestamp: new Date().toISOString(),
    });
    
    if (isCorrect) {
      battle.participants[participantIndex].score += 100;
    }
    
    battle.participants[participantIndex].progress =
      ((questionIndex + 1) / collection.words.length) * 100;
    
    await kv.set(`battle:${battleId}`, battle);
    
    return c.json({ battle, isCorrect });
  } catch (error) {
    console.log(`Error submitting answer: ${error}`);
    return c.json({ error: "Failed to submit answer" }, 500);
  }
});

// Complete a battle
app.post("/make-server-f23776ac/battles/:battleId/complete", async (c) => {
  try {
    const battleId = c.req.param("battleId");
    const battle = await kv.get(`battle:${battleId}`);
    
    if (!battle) {
      return c.json({ error: "Battle not found" }, 404);
    }
    
    battle.status = "completed";
    battle.completedAt = new Date().toISOString();
    
    await kv.set(`battle:${battleId}`, battle);
    return c.json({ battle });
  } catch (error) {
    console.log(`Error completing battle: ${error}`);
    return c.json({ error: "Failed to complete battle" }, 500);
  }
});

Deno.serve(app.fetch);