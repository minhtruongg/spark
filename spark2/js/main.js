// ---- INIT ----
document.getElementById('headerDate').textContent = new Date().toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric'
});

loadAIPrompt();
loadFeed();
handleSharedLink();

// ---- IMAGE HANDLING ----
let selectedImageFile = null;

function handleImageSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('Image too large - max 5MB', true); return; }
  selectedImageFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('imagePreview').src = e.target.result;
    document.getElementById('imagePreviewWrap').style.display = 'block';
    document.getElementById('imageUploadArea').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function removeImage() {
  selectedImageFile = null;
  document.getElementById('imageInput').value = '';
  document.getElementById('imagePreviewWrap').style.display = 'none';
  document.getElementById('imageUploadArea').style.display = 'block';
}

async function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 1200;
        let w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = (h / w) * maxSize; w = maxSize; }
          else { w = (w / h) * maxSize; h = maxSize; }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.8);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadImage(file) {
  file = await compressImage(file);
  const filename = Date.now() + '-' + Math.random().toString(36).slice(2) + '.jpg';
  const { error } = await sb.storage.from('post-images').upload(filename, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data } = sb.storage.from('post-images').getPublicUrl(filename);
  return data.publicUrl;
}

// ---- SUBMIT ----
async function submitPost() {
  const text = document.getElementById('responseText').value.trim();
  if (!text && !selectedImageFile) return;

  const btn = document.getElementById('postBtn');
  const modStatus = document.getElementById('modStatus');
  const modMsg = document.getElementById('modMsg');

  btn.disabled = true;
  btn.textContent = 'Checking...';
  modStatus.className = 'mod-status checking';
  modMsg.textContent = 'Checking your post...';
  await new Promise(r => setTimeout(r, 600));

  if (text) {
    const result = moderate(text);
    if (!result.approved) {
      modStatus.className = 'mod-status rejected';
      modMsg.textContent = result.reason;
      btn.disabled = false;
      btn.textContent = 'Post';
      return;
    }
  }

  modStatus.className = 'mod-status';

  let imageUrl = null;
  if (selectedImageFile) {
    btn.textContent = 'Uploading...';
    modStatus.className = 'mod-status checking';
    modMsg.textContent = 'Uploading image...';
    try {
      imageUrl = await uploadImage(selectedImageFile);
      modStatus.className = 'mod-status';
    } catch (e) {
      showToast('Image upload failed - try again', true);
      btn.disabled = false;
      btn.textContent = 'Post';
      modStatus.className = 'mod-status';
      return;
    }
  }

  btn.textContent = 'Posting...';

  const isLoggedIn = !!currentUser;
  const isAnon = isLoggedIn ? document.getElementById('anonToggle').checked : true;

  const { error } = await sb.from('posts').insert({
    text: text || null,
    user_id: isLoggedIn && !isAnon ? currentUser.id : null,
    display_name: null,
    is_anonymous: isAnon,
    liked_by: [],
    image_url: imageUrl,
  });

  btn.disabled = false;
  btn.textContent = 'Post';

  if (error) { showToast('Error posting - try again', true); return; }

  // Update streak if logged in and not anonymous
  if (isLoggedIn && !isAnon) {
    await updateStreak(currentUser.id);
    renderAuthUI();
  }

  document.getElementById('responseText').value = '';
  removeImage();
  showToast('Posted!');

  // Show claim banner for anonymous posts
  if (!isLoggedIn) {
    document.getElementById('claimBanner').style.display = 'flex';
  }

  loadFeed();
}

function dismissClaim() {
  document.getElementById('claimBanner').style.display = 'none';
}


// ---- HANDLE SHARED POST LINK ----
async function handleSharedLink() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get('post');
  if (!postId) return;

  const { data } = await sb.from('posts')
    .select('*, profiles(username, streak)')
    .eq('id', postId)
    .single();

  if (!data) return;

  // Scroll to top and highlight it
  const banner = document.createElement('div');
  banner.className = 'shared-post-banner';
  banner.innerHTML = '<span>✦ Someone shared this spark with you</span>';
  document.querySelector('.section-divider').before(banner);

  // Load feed and scroll to that card after render
  await loadFeed();
  setTimeout(() => {
    const cards = document.querySelectorAll('.card');
    // find the matching card and highlight it
    cards.forEach(card => {
      if (card.querySelector('.card-content')?.textContent === data.text) {
        card.style.borderColor = 'var(--accent)';
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }, 500);
}