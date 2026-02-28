const SUPABASE_URL = 'https://ufhsdjrjmxstgltiyvah.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1TeHLPyWI9UIkVRyh67rEA_zAbQUVAf';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const COLORS = ['#f4a035', '#e8624a', '#5b8dd9', '#7ec8a4', '#c47ed4', '#d4a05b', '#e06b8b'];

// Session like tracking (for non-logged in users)
const SESSION_ID = (() => {
  let id = localStorage.getItem('spark_session');
  if (!id) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('spark_session', id); }
  return id;
})();

let currentUser = null;
let currentProfile = null;
let likedPosts = new Set(JSON.parse(localStorage.getItem('spark_liked') || '[]'));
let reportedPosts = new Set(JSON.parse(localStorage.getItem('spark_reported') || '[]'));
