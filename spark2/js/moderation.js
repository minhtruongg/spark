// ---- TEXT NORMALIZATION (catches leet speak) ----
function normalizeForMod(text) {
  return text.toLowerCase()
    .replace(/1|!|\|/g, "i")
    .replace(/3/g, "e")
    .replace(/0/g, "o")
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/[*.\-_]/g, "");
}

const BAD_WORDS = [
  "nigger", "nigga", "faggot", "cunt", "kike", "spic", "chink", "wetback",
  "tranny", "retard", "pedoph", "childporn", "child porn",
  "kill yourself", "kys", "go die", "i will kill you", "ill kill you",
  "gonna kill you", "fuck you", "suck my d", "suck my c",
  "buy cocaine", "sell cocaine", "buy meth", "sell meth",
  "buy heroin", "sell heroin", "buy fentanyl", "sell fentanyl",
  "hitler was right", "heil hitler",
];

function moderate(text) {
  if (text.trim().length < 3) return { approved: false, reason: "Your post is too short!" };
  if (text.length > 2000) return { approved: false, reason: "Post is too long — keep it under 2000 characters." };

  const normalized = normalizeForMod(text);

  for (const word of BAD_WORDS) {
    if (normalized.includes(word)) {
      return { approved: false, reason: "Your post did not pass our community guidelines. Please keep it respectful." };
    }
  }

  if (/(.)\1{8,}/.test(normalized)) {
    return { approved: false, reason: "Your post did not pass our community guidelines." };
  }

  const words = normalized.split(/\s+/);
  const counts = {};
  for (const w of words) { counts[w] = (counts[w] || 0) + 1; }
  const max = Math.max(...Object.values(counts));
  if (words.length > 5 && max / words.length > 0.5) {
    return { approved: false, reason: "Looks like spam — try writing something more creative!" };
  }

  return { approved: true };
}
