// Fetches case studies from the Netlify Function, which reads from Notion.
// Falls back to placeholder data when running locally without the function.

const FALLBACK = [
  { id: 'p1', title: 'Friseursalon München',       url: '#', image: null, device: 'desktop', alt: '' },
  { id: 'p2', title: 'Zahnarztpraxis Ottobrunn',   url: '#', image: null, device: 'desktop', alt: '' },
  { id: 'p3', title: 'Restaurant Bogenhausen',      url: '#', image: null, device: 'desktop', alt: '' },
  { id: 'p4', title: 'Physiotherapie Studio',       url: '#', image: null, device: 'desktop', alt: '' },
  { id: 'p5', title: 'Rechtsanwalt Schwabing',      url: '#', image: null, device: 'desktop', alt: '' },
];

export async function getCaseStudies() {
  try {
    const res = await fetch('/api/get-case-studies');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) throw new Error('empty response');
    return data;
  } catch (err) {
    console.warn('[getCaseStudies] API unavailable, using fallback placeholders:', err.message);
    return FALLBACK;
  }
}
