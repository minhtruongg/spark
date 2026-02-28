// ---- OPEN PROFILE ----
async function openProfile(userId) {
  const { data: profile } = await sb.from('profiles').select('*').eq('id', userId).single();
  if (!profile) return;

  const { data: posts } = await sb.from('posts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_anonymous', false)
    .order('created_at', { ascending: false })
    .limit(20);

  const color = COLORS[(profile.username?.charCodeAt(0) || 0) % COLORS.length];
  const initials = (profile.username || '?').slice(0, 2).toUpperCase();

  document.getElementById('profileAvatar').textContent = initials;
  document.getElementById('profileAvatar').style.background = color + '33';
  document.getElementById('profileAvatar').style.color = color;
  document.getElementById('profileUsername').textContent = profile.username;
  document.getElementById('profileBio').textContent = profile.bio || '';
  document.getElementById('profileStreak').textContent = profile.streak || 0;
  document.getElementById('profilePosts').textContent = profile.total_posts || 0;
  document.getElementById('profileLikes').textContent = profile.total_likes || 0;

  const feed = document.getElementById('profileFeed');
  if (!posts || !posts.length) {
    feed.innerHTML = '<div class="empty-state" style="padding:1.5rem 0">No public posts yet.</div>';
  } else {
    feed.innerHTML = posts.map(p => `
      <div class="profile-post-card">
        <div class="card-content">${esc(p.text || '')}</div>
        ${p.image_url ? `<img class="card-image" src="${esc(p.image_url)}" alt="post image" loading="lazy">` : ''}
        <div class="card-time" style="margin-top:0.5rem">${timeAgo(p.created_at)}</div>
      </div>`).join('');
  }

  document.getElementById('profileOverlay').classList.add('open');
}

function openMyProfile() {
  if (currentUser) openProfile(currentUser.id);
}

function closeProfile() {
  document.getElementById('profileOverlay').classList.remove('open');
}

function profileOverlayClick(e) {
  if (e.target === document.getElementById('profileOverlay')) closeProfile();
}

// ---- STREAK UPDATE ----
async function updateStreak(userId) {
  const { data: profile } = await sb.from('profiles').select('streak, last_post_date').eq('id', userId).single();
  if (!profile) return;

  const today = new Date().toDateString();
  const lastPost = profile.last_post_date ? new Date(profile.last_post_date).toDateString() : null;
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  let newStreak = profile.streak || 0;

  if (lastPost === today) {
    // Already posted today, no change
    return;
  } else if (lastPost === yesterday) {
    // Posted yesterday, extend streak
    newStreak += 1;
  } else {
    // Streak broken or first post
    newStreak = 1;
  }

  await sb.from('profiles').update({
    streak: newStreak,
    last_post_date: new Date().toISOString(),
    total_posts: (profile.total_posts || 0) + 1,
  }).eq('id', userId);

  // Refresh local profile
  await loadCurrentProfile();
  renderAuthUI();
}
