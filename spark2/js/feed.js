// ---- UTILS ----
function timeAgo(ts) {
  const normalized = ts.endsWith('Z') ? ts : ts + 'Z';
  const diff = Date.now() - new Date(normalized).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

function esc(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showToast(msg, err=false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (err ? ' err' : '');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ---- LIKES ----
async function toggleLike(postId, btn) {
  const already = likedPosts.has(postId);
  const countEl = btn.querySelector('.lc');
  const n = parseInt(countEl.textContent) || 0;
  if (already) {
    likedPosts.delete(postId);
    btn.classList.remove('liked');
    countEl.textContent = Math.max(0, n - 1);
    localStorage.setItem('spark_liked', JSON.stringify([...likedPosts]));
    const { data } = await sb.from('posts').select('liked_by').eq('id', postId).single();
    const updated = (data?.liked_by || []).filter(id => id !== SESSION_ID);
    await sb.from('posts').update({ likes: Math.max(0, n-1), liked_by: updated }).eq('id', postId);
  } else {
    likedPosts.add(postId);
    btn.classList.add('liked');
    countEl.textContent = n + 1;
    localStorage.setItem('spark_liked', JSON.stringify([...likedPosts]));
    const { data } = await sb.from('posts').select('liked_by').eq('id', postId).single();
    const existing = data?.liked_by || [];
    if (!existing.includes(SESSION_ID)) {
      await sb.from('posts').update({ likes: n+1, liked_by: [...existing, SESSION_ID] }).eq('id', postId);
      const { data: post } = await sb.from('posts').select('user_id').eq('id', postId).single();
      if (post?.user_id) {
        const { data: profile } = await sb.from('profiles').select('total_likes').eq('id', post.user_id).single();
        if (profile) await sb.from('profiles').update({ total_likes: (profile.total_likes||0)+1 }).eq('id', post.user_id);
      }
    }
  }
}

// ---- REPORTS ----
async function reportPost(postId, btn) {
  if (reportedPosts.has(postId)) return;
  reportedPosts.add(postId);
  localStorage.setItem('spark_reported', JSON.stringify([...reportedPosts]));
  btn.classList.add('reported');
  btn.textContent = 'reported';
  btn.disabled = true;
  await sb.from('reports').insert({ post_id: postId, reason: 'user report' });
  const { data } = await sb.from('posts').select('report_count').eq('id', postId).single();
  const newCount = (data?.report_count||0) + 1;
  if (newCount >= 3) {
    await sb.from('posts').delete().eq('id', postId);
    const card = btn.closest('.card');
    card.style.transition = 'opacity 0.3s, transform 0.3s';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95)';
    setTimeout(() => card.remove(), 350);
    showToast('Post removed');
  } else {
    await sb.from('posts').update({ report_count: newCount }).eq('id', postId);
    showToast('Reported');
  }
}

// ---- LOAD FEED ----
async function loadFeed() {
  const feed = document.getElementById('feed');

  const { data, error } = await sb.from('posts')
    .select('id, text, image_url, is_anonymous, likes, liked_by, report_count, created_at, user_id, color, profiles(username, streak)')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !data) {
    feed.innerHTML = '<div class="empty-state">Could not load — refresh to try again.</div>';
    return;
  }

  if (!data.length) {
    feed.innerHTML = '<div class="empty-state">No sparks yet — be the first.</div>';
    return;
  }

  data.forEach(p => {
    if ((p.liked_by||[]).includes(SESSION_ID)) likedPosts.add(p.id);
  });
  localStorage.setItem('spark_liked', JSON.stringify([...likedPosts]));

  feed.innerHTML = data.map((p, i) => {
    const isAnon = p.is_anonymous || !p.user_id;
    const name = isAnon ? 'Anonymous' : (p.profiles?.username || 'Unknown');
    const initials = isAnon ? '?' : name.slice(0,2).toUpperCase();
    const color = p.color || '#f4a035';
    const liked = likedPosts.has(p.id);
    const reported = reportedPosts.has(p.id);
    const streak = !isAnon && p.profiles?.streak > 1 ? '<span class="streak-pill">🔥 ' + p.profiles.streak + '</span>' : '';
    const clickable = !isAnon && p.user_id ? 'onclick="openProfile(\'' + p.user_id + '\')" style="cursor:pointer"' : '';

    return '<div class="card" data-id="' + p.id + '" style="animation-delay:' + (i*0.05) + 's;--glow-color:' + color + ';border-color:' + color + '22">' +
      (p.image_url ? '<img class="card-image" src="' + esc(p.image_url) + '" alt="" loading="lazy" onclick="' + (p.user_id ? 'openProfile(\'' + p.user_id + '\')' : '') + '">' : '') +
      '<div class="card-content">' + esc(p.text||'') + '</div>' +
      '<div class="card-footer">' +
        '<div class="card-author" ' + clickable + '>' +
          '<div class="avatar-sm" style="background:' + color + '22;color:' + color + '">' + initials + '</div>' +
          '<span>' + esc(name) + '</span>' + streak +
        '</div>' +
        '<div class="card-actions">' +
          '<button class="action-btn report-btn ' + (reported?'reported':'') + '" onclick="reportPost(\'' + p.id + '\',this)" ' + (reported?'disabled':'') + '>⚑</button>' +
          '<button class="action-btn share-btn" data-id="' + p.id + '" data-text="' + esc(p.text||'') + '" data-name="' + esc(name) + '" data-streak="' + (p.profiles?.streak||0) + '" onclick="openShareModal(this)">↗</button>' +
          '<button class="action-btn like-btn ' + (liked?'liked':'') + '" onclick="toggleLike(\'' + p.id + '\',this)" style="' + (liked ? 'color:'+color+';border-color:'+color : '') + '">♥ <span class="lc">' + (p.likes||0) + '</span></button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}