// ---- SHARE MODAL ----
function openShareModal(btn) {
  const text = btn.dataset.text;
  const name = btn.dataset.name;
  const streak = parseInt(btn.dataset.streak) || 0;
  const postId = btn.dataset.id;
  const todayPrompt = document.getElementById('promptText').textContent.replace(/^"|"$/g, '').trim();

  // Build canvas
  const canvas = buildShareCard(text, name, streak, todayPrompt);

  // Show preview in modal
  const preview = document.getElementById('sharePreview');
  preview.src = canvas.toDataURL('image/png');
  preview.style.display = 'block';

  // Store for download
  document.getElementById('shareDownloadBtn').onclick = () => {
    const link = document.createElement('a');
    link.download = 'spark-' + Date.now() + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Downloaded! ✦');
  };

  // Copy link
  document.getElementById('shareLinkBtn').onclick = () => {
    const url = window.location.origin + window.location.pathname + '?post=' + postId;
    navigator.clipboard.writeText(url).then(() => showToast('Link copied! ✦'));
  };

  document.getElementById('shareOverlay').classList.add('open');
}

function closeShareModal() {
  document.getElementById('shareOverlay').classList.remove('open');
}

// ---- BUILD CARD ----
function buildShareCard(text, name, streak, todayPrompt) {
  const canvas = document.createElement('canvas');
  const scale = 2;
  canvas.width = 600 * scale;
  canvas.height = 720 * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  const W = 600, H = 720;

  // Background
  ctx.fillStyle = '#0e0c0a';
  ctx.fillRect(0, 0, W, H);

  // Grain
  ctx.fillStyle = 'rgba(255,255,255,0.015)';
  for (let i = 0; i < 3000; i++) {
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
  }

  // Top accent line
  const grad = ctx.createLinearGradient(40, 0, W - 40, 0);
  grad.addColorStop(0, '#f4a035');
  grad.addColorStop(1, '#e8624a');
  ctx.fillStyle = grad;
  ctx.fillRect(40, 48, W - 80, 2);

  // Logo
  ctx.fillStyle = '#f4a035';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('Spark ✦', 40, 38);

  // Prompt label
  ctx.fillStyle = '#7a6f62';
  ctx.font = '11px monospace';
  ctx.fillText("TODAY'S PROMPT", 40, 90);

  // Prompt text
  ctx.fillStyle = '#f0ebe3';
  ctx.font = 'italic 18px Georgia, serif';
  wrapText(ctx, '"' + todayPrompt + '"', 40, 118, W - 80, 28);

  // Divider
  ctx.fillStyle = '#2e2820';
  ctx.fillRect(40, 210, W - 80, 1);

  // Post content
  ctx.fillStyle = '#d4cfc7';
  ctx.font = 'italic 26px Georgia, serif';
  const textY = wrapText(ctx, text, 40, 265, W - 80, 42);

  // Bottom area
  const bottomY = Math.max(textY + 60, 580);
  ctx.fillStyle = '#2e2820';
  ctx.fillRect(40, bottomY, W - 80, 1);

  // Author
  ctx.fillStyle = '#f0ebe3';
  ctx.font = '13px monospace';
  ctx.fillText('— ' + name, 40, bottomY + 30);

  if (streak > 1) {
    ctx.fillStyle = '#f4a035';
    ctx.font = '12px monospace';
    ctx.fillText('🔥 ' + streak + ' day streak', 40, bottomY + 52);
  }

  // Watermark
  ctx.fillStyle = '#3e3428';
  ctx.font = '11px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('spark.app', W - 40, bottomY + 30);
  ctx.textAlign = 'left';

  // Bottom accent line
  ctx.fillStyle = grad;
  ctx.fillRect(40, H - 48, W - 80, 2);

  return canvas;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const paragraphs = text.split('\n');
  let currentY = y;
  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      currentY += lineHeight * 0.6;
      continue;
    }
    const words = paragraph.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      if (ctx.measureText(testLine).width > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
        if (currentY > 530) { ctx.fillText(line + '...', x, currentY); return currentY; }
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
    if (currentY > 530) return currentY;
  }
  return currentY;
}