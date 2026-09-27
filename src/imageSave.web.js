import { httpsify } from './constants';

// Browsers only allow direct downloads for same-origin files, so try a blob download and
// fall back to opening the image in a new tab (where the user can right-click → Save).
export async function saveImage(url) {
  url = httpsify(url);
  try {
    const blob = await (await fetch(url)).blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'cosmopedia-' + Date.now() + '.jpg';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    return 'gallery';
  } catch (e) { window.open(url, '_blank'); return 'share'; }
}

export async function shareImage(url) {
  url = httpsify(url);
  if (navigator.share) return navigator.share({ title: 'Cosmopedia', url });
  await navigator.clipboard.writeText(url);
}
