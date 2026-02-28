// ---- INIT ----
document.getElementById('headerDate').textContent = new Date().toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric'
});

loadFeed();

// ---- COLOR PICKER ----
let selectedColor = '#f4a035';

function selectColor(btn) {
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  btn.classList.add('active');
  selectedColor = btn.dataset.color;
  // Update submit box glow
  document.getElementById('submitBox').style.boxShadow = `0 0 40px ${selectedColor}18`;
  document.getElementById('submitBox').style.borderColor = `${selectedColor}33`;
}

// ---- ANONYMOUS TOGGLE ----
function toggleAnon() {
  const isAnon = document.getElementById('anonToggle').checked;
  const nameInput = document.getElementById('nameInput');
  if (nameInput) { nameInput.disabled = isAnon; nameInput.style.opacity = isAnon ? '0.3' : '1'; }
}

// ---- IMAGE HANDLING ----
let selectedImageFile = null;

async function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 900;
        let w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = (h / w) * maxSize; w = maxSize; }
          else { w = (w / h) * maxSize; h = maxSize; }
        }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(new File([blob], 'image.jpg', { type: 'image/jpeg' })), 'image/jpeg', 0.7);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

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
  await new Promise(r => setTimeout(r, 500));

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
      showToast('Image upload failed', true);
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
    is_anonymous: isAnon,
    liked_by: [],
    image_url: imageUrl,
    color: selectedColor,
  });

  btn.disabled = false;
  btn.textContent = 'Post';

  if (error) { showToast('Error posting - try again', true); return; }

  if (isLoggedIn && !isAnon) await updateStreak(currentUser.id);

  document.getElementById('responseText').value = '';
  removeImage();
  showToast('Posted!');

  if (!isLoggedIn) document.getElementById('claimBanner').style.display = 'flex';

  loadFeed();
}

function dismissClaim() {
  document.getElementById('claimBanner').style.display = 'none';
}

function handleSharedLink() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get('post');
  if (!postId) return;
  const banner = document.createElement('div');
  banner.className = 'shared-post-banner';
  banner.innerHTML = '<span>✦ Someone shared this spark with you</span>';
  document.querySelector('.section-divider').before(banner);
  loadFeed().then(() => {
    setTimeout(() => {
      document.querySelectorAll('.card').forEach(card => {
        if (card.dataset.id === postId) {
          card.style.borderColor = 'rgba(255,255,255,0.2)';
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }, 500);
  });
}

handleSharedLink();