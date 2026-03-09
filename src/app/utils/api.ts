import { supabase } from "./supabaseClient";

// --- Collections ---

export async function getAllCollections() {
  const { data, error } = await supabase
    .from('collections')
    .select('*, words(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching collections:", error);
    return [];
  }

  console.log("Supabase collections raw data:", data);

  return (data || []).map((c: any) => ({
    ...c,
    name: c.title, // Map title to name for frontend compatibility
    wordCount: (c.words?.length ?? c.word_count) || 0,
    words: (c.words || []).map((w: any) => ({
      ...w,
      english: w.word,
      correctAnswer: w.translation,
      exampleSentence: w.example_sentence || "",
    })),
  }));
}

export async function getCollection(id: string) {
  const { data, error } = await supabase
    .from('collections')
    .select('*, words(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error("Error fetching collection:", error);
    throw error;
  }

  console.log("Supabase collection raw data:", data);

  return {
    ...data,
    name: data.title,
    wordCount: (data.words?.length ?? data.word_count) || 0,
    words: (data.words || []).map((w: any) => ({
      ...w,
      english: w.word,
      correctAnswer: w.translation, // Fallback to translation if needed by frontend logic
      exampleSentence: w.example_sentence || "" // Placeholder
    }))
  };
}

export async function createCollection(
  title: string,
  description: string,
  words: any[]
) {
  // 1. Get User Session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    throw new Error("User must be logged in to create a collection");
  }

  // 2. Create the collection
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .insert({ 
      title, 
      user_id: session.user.id
    })
    .select()
    .single();

  if (collectionError) {
    console.error("Error creating collection:", collectionError);
    throw collectionError;
  }

  // 3. Insert words linked to this collection
  // Only insert fields that exist in the DB schema: id, word, translation, collection_id, user_id, mastery_level, audio_url, next_review
  const wordsToInsert = words.map((w) => ({
    collection_id: collection.id,
    user_id: session.user.id,
    word: w.english,
    translation: w.translation,
    mastery_level: 0,
    // audio_url and next_review can be null or have defaults
  }));

  const { error: wordsError } = await supabase
    .from('words')
    .insert(wordsToInsert);

  if (wordsError) {
    console.error("Error adding words:", wordsError);
    // Ideally rollback collection creation here, but keeping it simple for now
    throw wordsError;
  }

  // Return collection with words (re-fetching or constructing object)
  return { ...collection, words: words, wordCount: words.length }; 
}

// --- Battles ---

// NOTE: For battles, we might still need real-time or edge functions if we want server-side state.
// However, the prompt asks to replace Edge Functions with direct client queries.
// We'll simulate battle state in a 'battles' table and 'battle_participants' table.

export async function createBattle(collectionId: string, hostName: string) {
  const { data: battle, error } = await supabase
    .from('battles')
    .insert({ 
      collection_id: collectionId, 
      status: 'waiting',
      host_name: hostName
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating battle:", error);
    throw error;
  }
  
  // Add host as participant
  const { data: participant, error: participantError } = await supabase
    .from('battle_participants')
    .insert({
      battle_id: battle.id,
      name: hostName,
      is_host: true,
      score: 0,
      progress: 0,
      avatar: "🚀" // Default avatar
    })
    .select()
    .single();

   if (participantError) {
    console.error("Error creating participant:", participantError);
    throw participantError;
  }

  return { ...battle, participants: [participant] };
}

export async function joinBattle(battleId: string, playerName: string) {
  const avatars = ["🚀", "⭐", "💎", "🔥", "⚡", "🌟", "🎨", "🎭"];
  const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

  const { data: participant, error } = await supabase
    .from('battle_participants')
    .insert({
      battle_id: battleId,
      name: playerName,
      is_host: false,
      score: 0,
      progress: 0,
      avatar: randomAvatar
    })
    .select()
    .single();

  if (error) {
    console.error("Error joining battle:", error);
    throw error;
  }

  // Fetch updated battle with all participants
  const battle = await getBattle(battleId);
  return { battle, participantId: participant.id };
}

export async function getBattle(battleId: string) {
  const { data: battle, error } = await supabase
    .from('battles')
    .select(`
      *,
      participants:battle_participants(*)
    `)
    .eq('id', battleId)
    .single();

  if (error) {
    console.error("Error fetching battle:", error);
    throw error;
  }

  return battle;
}

export async function startBattle(battleId: string) {
  const { data: battle, error } = await supabase
    .from('battles')
    .update({ status: 'active', started_at: new Date().toISOString() })
    .eq('id', battleId)
    .select()
    .single();

  if (error) {
    console.error("Error starting battle:", error);
    throw error;
  }

  return battle;
}

export async function submitAnswer(
  battleId: string,
  participantId: string,
  answer: string,
  questionIndex: number
) {
  // In a real app, validation should happen on server (RLS or Function).
  // Here we just update the score on the client for simplicity as requested.
  
  // 1. Get battle to find collection
  const battle = await getBattle(battleId);
  const collection = await getCollection(battle.collection_id); // Assuming we can fetch collection details
  
  // We need the words. getCollection usually returns them if we modify it to join.
  // Let's ensure getCollection returns words.
  
  // 2. Check correctness
  // Wait, getCollection above currently just fetches from 'collections'. 
  // We need to fetch words too.
  
  const currentWord = collection.words?.[questionIndex]; 
  // If getCollection doesn't return words, we need to fetch them.
  // Let's update getCollection to fetch words.
  
  const isCorrect = currentWord && answer === currentWord.correct_answer;
  
  // 3. Update participant
  // We need to fetch current participant to increment score
  const { data: participant } = await supabase
    .from('battle_participants')
    .select('*')
    .eq('id', participantId)
    .single();

  const newScore = participant.score + (isCorrect ? 100 : 0);
  const newProgress = ((questionIndex + 1) / (collection.words?.length || 1)) * 100;

  const { error: updateError } = await supabase
    .from('battle_participants')
    .update({ score: newScore, progress: newProgress })
    .eq('id', participantId);

  if (updateError) throw updateError;

  // Return updated battle state
  const updatedBattle = await getBattle(battleId);
  return { battle: updatedBattle, isCorrect };
}

export async function completeBattle(battleId: string) {
   const { data: battle, error } = await supabase
    .from('battles')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', battleId)
    .select()
    .single();

  if (error) throw error;
  return battle;
}
