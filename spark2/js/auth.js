// ---- AUTH STATE ----
sb.auth.onAuthStateChange(async (event, session) => {
  currentUser = session?.user || null;
  if (currentUser) {
    // Try to load profile, create it if it doesn't exist
    const { data } = await sb.from('profiles').select('*').eq('id', currentUser.id).single();
    if (!data) {
      // First time — need username, open signup modal
      await sb.auth.signOut();
      showToast('Please sign up to create your profile', true);
      switchTab('signup');
      openModal();
      return;
    }
    currentProfile = data;
    closeModal();
  } else {
    currentProfile = null;
  }
  renderAuthUI();
  renderPostAs();
});

async function loadCurrentProfile() {
  if (!currentUser) return;
  const { data } = await sb.from('profiles').select('*').eq('id', currentUser.id).single();
  if (!data) {
    await sb.auth.signOut();
    showToast('No profile found — please sign up first', true);
    // Reset modal to signup tab and re-enable button
    switchTab('signup');
    document.getElementById('authBtn').disabled = false;
    document.getElementById('authBtn').textContent = 'Create account →';
    openModal();
    return;
  }
  currentProfile = data;
}

// ---- AUTH UI ----
function renderAuthUI() {
  const area = document.getElementById('authArea');
  if (currentUser && currentProfile) {
    area.innerHTML = `
      <div class="user-pill" onclick="openMyProfile()">
        <div class="user-dot"></div>
        <span>${esc(currentProfile.username)}</span>
        ${currentProfile.streak > 0 ? `<span class="streak-badge">🔥 ${currentProfile.streak}</span>` : ''}
      </div>
      <button class="auth-btn" onclick="sb.auth.signOut()">sign out</button>`;
  } else {
    area.innerHTML = `<button class="auth-btn primary" onclick="openModal()">Sign in</button>`;
  }
}

function renderPostAs() {
  const postAs = document.getElementById('postAs');
  const anonWrap = document.getElementById('anonToggleWrap');
  if (currentUser && currentProfile) {
    postAs.innerHTML = `posting as <strong>${esc(currentProfile.username)}</strong>`;
    anonWrap.style.display = 'flex';
  } else {
    postAs.innerHTML = `posting as <strong>Anonymous</strong>`;
    anonWrap.style.display = 'none';
  }
}

// ---- MODAL ----
let currentTab = 'signup';

function openModal() {
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => document.getElementById(currentTab === 'signup' ? 'authUsername' : 'authEmail').focus(), 100);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.getElementById('authMsg').textContent = '';
}

function overlayClick(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

function switchTab(tab) {
  currentTab = tab;
  document.getElementById('tabSignup').classList.toggle('active', tab === 'signup');
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('authBtn').textContent = tab === 'signup' ? 'Create account →' : 'Sign in →';
  document.getElementById('usernameField').style.display = tab === 'signup' ? 'block' : 'none';
  document.getElementById('modalTitle').textContent = tab === 'signup' ? 'Join Spark.' : 'Welcome back.';
  document.getElementById('modalSubtitle').textContent = tab === 'signup'
    ? 'Create an account to build your profile and streak.'
    : 'Sign in to continue your streak.';
  document.getElementById('authMsg').textContent = '';
  document.getElementById('authMsg').className = 'modal-msg';
}

async function handleAuth() {
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const btn = document.getElementById('authBtn');
  const msg = document.getElementById('authMsg');

  if (!email || !password) { msg.textContent = 'Please fill in all fields.'; return; }

  btn.disabled = true;
  btn.textContent = 'Loading...';
  msg.textContent = '';

  if (currentTab === 'signup') {
    const username = document.getElementById('authUsername').value.trim();
    if (!username) { msg.textContent = 'Please choose a username.'; btn.disabled = false; btn.textContent = 'Create account →'; return; }

    // Check username taken
    const { data: existing } = await sb.from('profiles').select('id').eq('username', username).single();
    if (existing) { msg.textContent = 'Username already taken — try another.'; btn.disabled = false; btn.textContent = 'Create account →'; return; }

    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) { msg.textContent = error.message; btn.disabled = false; btn.textContent = 'Create account →'; return; }

    if (data.user) {
      const { error: profileError } = await sb.from('profiles').insert({
        id: data.user.id,
        username,
        streak: 0,
        last_post_date: null,
        total_posts: 0,
        total_likes: 0,
      });
      if (profileError) console.log('profile error:', JSON.stringify(profileError));
    }

    if (!data.session) {
      msg.className = 'modal-msg success';
      msg.textContent = 'Check your email to confirm your account!';
      btn.disabled = false;
      btn.textContent = 'Create account →';
    }
  } else {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      msg.textContent = 'No account found with that email — try signing up!';
      btn.disabled = false;
      btn.textContent = 'Sign in →';
    }
  }
}
