// Prompts are now fixed in index.html — no loading needed
function loadAIPrompt() {}
const FALLBACK_PROMPTS = [
  { text: "Describe a color you've never seen but can imagine.", category: "🎨 imagination" },
  { text: "Write the last message someone left that you never replied to.", category: "✍️ storytelling" },
  { text: "What does 3am smell like to you?", category: "💭 sensory" },
  { text: "Design a room where time moves differently.", category: "🏛️ architecture" },
  { text: "Write a one-sentence biography for a stranger you passed today.", category: "✍️ fiction" },
  { text: "What sound would loneliness make if it were music?", category: "🎵 synesthesia" },
  { text: "Describe your childhood bedroom as if you're seeing it for the first time.", category: "💭 memory" },
  { text: "Write a love letter from the ocean to the shore.", category: "✍️ poetry" },
  { text: "What would a city built entirely on dreams look like?", category: "🏙️ worldbuilding" },
  { text: "Create a recipe for a feeling, not a food.", category: "🍳 creative" },
  { text: "Describe the inside of a cloud from the perspective of a raindrop.", category: "💭 perspective" },
  { text: "Write the plot of a movie that could only exist at 4pm on a Tuesday.", category: "🎬 absurd" },
  { text: "What does forgiveness taste like?", category: "💭 synesthesia" },
  { text: "Invent a new holiday and describe how people celebrate it.", category: "🎉 invention" },
  { text: "Write a conversation between two books on a shelf.", category: "✍️ fiction" },
  { text: "If you could send one sentence back in time, what would it be and to when?", category: "⏳ time" },
  { text: "Describe the last dream you remember as if it were a film review.", category: "🎬 dreams" },
  { text: "Write a weather report for your current emotional state.", category: "💭 introspection" },
  { text: "What would your 10-year-old self think of you right now?", category: "💭 reflection" },
  { text: "Describe a smell that takes you somewhere else entirely.", category: "💭 sensory" },
  { text: "Write the opening line of a novel set in the city you grew up in.", category: "✍️ fiction" },
  { text: "What does the color of your mood look like today?", category: "🎨 emotion" },
  { text: "Invent a word for a feeling that doesn't have a name yet.", category: "📖 language" },
  { text: "What does home sound like at midnight?", category: "🎵 sensory" },
  { text: "Write a letter to the last person who made you laugh.", category: "✍️ gratitude" },
  { text: "Describe a moment when time felt like it stopped.", category: "💭 memory" },
  { text: "If your life had a soundtrack, what's playing right now?", category: "🎵 music" },
  { text: "Write the last page of a book you wish existed.", category: "✍️ fiction" },
  { text: "What would you put in a museum of ordinary things?", category: "🏛️ curation" },
  { text: "Describe the texture of a Tuesday afternoon.", category: "💭 absurd" },
];

// ---- LOAD AI PROMPT ----
async function loadAIPrompt() {
  const today = new Date().toDateString();
  const cached = localStorage.getItem('spark_prompt_' + today);

  if (cached) {
    const p = JSON.parse(cached);
    setPrompt(p.text, p.category);
    return;
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 150,
        system: `You generate daily creative writing prompts for a creative community app.
Generate ONE unique, thought-provoking, poetic prompt that inspires creative expression.
The prompt should be open-ended, evocative, and suitable for all ages.
Respond ONLY with a JSON object: {"text": "the prompt question", "category": "emoji + one word category"}
Example: {"text": "What does the color of silence look like?", "category": "🎨 synesthesia"}`,
        messages: [{
          role: 'user',
          content: `Generate a creative prompt for ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}. Make it unique and unexpected.`
        }]
      })
    });

    const data = await res.json();
    const raw = data.content?.[0]?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const p = JSON.parse(clean);
    localStorage.setItem('spark_prompt_' + today, JSON.stringify(p));
    setPrompt(p.text, p.category);
  } catch {
    // Fallback to static prompt
    const fallback = FALLBACK_PROMPTS[Math.floor(Date.now() / 86400000) % FALLBACK_PROMPTS.length];
    setPrompt(fallback.text, fallback.category);
  }
}

function setPrompt(text, category) {
  document.getElementById('promptText').textContent = `"${text}"`;
  document.getElementById('promptCat').textContent = category;
}