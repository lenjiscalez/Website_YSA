# MASTER PROMPT — Blog System mit Notion CMS
> Diesen gesamten Prompt in eine neue Claude Code Session einfügen.
> Vorher: Sicherstellen, dass du im richtigen Projektordner arbeitest.

---

## Kontext & Ziel

Ich möchte ein vollständiges Blog-System für diese Website bauen.
Notion dient als CMS — ich schreibe Artikel in Notion, sie erscheinen automatisch auf der Website.

Die Website ist eine **Vanilla HTML/CSS/JS Site auf Netlify** (kein Framework, kein Build-Step).

---

## Schritt 1: Lies zuerst den aktuellen Stack

Öffne `index.html` und extrahiere:
- Alle CSS-Variablen aus `:root` (Farben, Fonts, Abstände)
- Die exakte Nav-Struktur (HTML)
- Die exakte Footer-Struktur (HTML)
- Alle verwendeten Animationen (fadeUp, transitions etc.)
- Den allgemeinen Seiten-Aufbau (Padding, Border-Logik, Typographie-Skala)

Falls `impressum.html` oder weitere Seiten existieren: auch diese lesen, um Konsistenz zu verstehen.

---

## Schritt 2: Baue folgende 7 Dateien/Änderungen

---

### A) `blog/index.html` — Blog-Übersichtsseite (URL: `/blog`)

**Design:** Identisch zur Homepage — gleiche Fonts, Farben, Nav, Footer, CSS-Variablen, Animationen.

**Funktion:**
- Beim Laden: `fetch('/api/get-posts')` → rendert Cards dynamisch
- Jede Card zeigt: Cover-Bild (optional), Datum, Titel, Kurzzusammenfassung, CTA "Weiterlesen →"
- Card-Link führt zu `/blog/{slug}`
- Loading-State: elegante Platzhalter im Site-Stil
- Error-State: freundliche Fehlermeldung im Site-Stil
- Vollständig responsive / mobile-first

**Bild-Darstellung:**
- Cover-Container: `aspect-ratio: 16/9`, `object-fit: cover`, volle Card-Breite
- Kein separates Teaser-Bild — es wird das universelle `cover`-Feld verwendet (siehe Schema)

---

### B) `blog/post.html` — Einzelner Artikel (URL: `/blog/{slug}`)

**Design:** Identisch zur Homepage.

**Funktion:**
- Liest Slug aus `window.location.pathname` (letzter Segment nach `/blog/`)
- `fetch('/api/get-post?slug=' + slug)` → rendert Artikel
- Artikel enthält: Cover-Bild (optional), Datum, Titel, strukturierter Inhalt aus Notion Blocks
- Cover-Bild: volle Inhaltsbreite, `aspect-ratio: 16/9`, `object-fit: cover`
- Zurück-Button zu `/blog`
- Loading & Error States

**Unterstützte Notion Block Types (alle rendern):**
- `paragraph`
- `heading_1`, `heading_2`, `heading_3`
- `bulleted_list_item`, `numbered_list_item`
- `image`
- `quote`
- `divider`
- `callout`
- `code`

---

### C) Homepage-Sektion in `index.html` (BESTEHENDE DATEI ÄNDERN)

Füge eine Blog/Insights-Sektion hinzu:
- Position: direkt vor dem Footer
- Zeigt die **3 neuesten** publizierten Artikel als Cards
- `fetch('/api/get-posts?limit=3')`
- "Alle Artikel →" Link zu `/blog`
- Design nahtlos in den bestehenden Seitenfluss integriert
- Gleicher visueller Rhythmus wie andere Sektionen auf der Homepage

**Bild in den Homepage-Cards:**
- Jede Card zeigt das `cover`-Bild (wenn vorhanden) als `aspect-ratio: 16/9`-Container oben
- Die Cards nutzen eine eigene CSS-Klasse (z.B. `.blog-preview-card`) die das `aspect-ratio: 4/3` der bestehenden `.work-card` mit `aspect-ratio: unset !important` und `padding: 0 !important` überschreibt
- Bild nimmt die volle Card-Breite ein (kein Padding), Text-Inhalt darunter mit eigenem Padding-Block
- Wenn kein Cover vorhanden: Card zeigt nur Text (wie bisher), kein Leerraum

---

### D) `netlify/functions/get-posts.js`

```javascript
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit)
      : null;

    const response = await fetch(
      `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: {
            property: 'Published',
            checkbox: { equals: true },
          },
          sorts: [{ property: 'Date', direction: 'descending' }],
          page_size: limit || 100,
        }),
      }
    );

    if (!response.ok) throw new Error(`Notion API error: ${response.status}`);

    const data = await response.json();

    const posts = data.results.map((page) => ({
      id: page.id,
      title: page.properties.Title?.title?.[0]?.plain_text || '',
      slug: page.properties.Slug?.rich_text?.[0]?.plain_text || '',
      date: page.properties.Date?.date?.start || '',
      summary: page.properties.Summary?.rich_text?.[0]?.plain_text || '',
      cover: page.properties.Cover?.url || page.cover?.external?.url || null,
    }));

    return { statusCode: 200, headers, body: JSON.stringify(posts) };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
```

---

### E) `netlify/functions/get-post.js`

```javascript
// Hilfsfunktion: Notion Blocks in HTML umwandeln
function blocksToHtml(blocks) {
  let html = '';
  let listType = null;

  for (const block of blocks) {
    const type = block.type;
    const content = block[type];
    const text = content?.rich_text?.map((t) => {
      let s = t.plain_text;
      if (t.annotations?.bold) s = `<strong>${s}</strong>`;
      if (t.annotations?.italic) s = `<em>${s}</em>`;
      if (t.annotations?.code) s = `<code>${s}</code>`;
      return s;
    }).join('') || '';

    if (type !== 'bulleted_list_item' && type !== 'numbered_list_item') {
      if (listType === 'ul') html += '</ul>';
      if (listType === 'ol') html += '</ol>';
      listType = null;
    }

    switch (type) {
      case 'paragraph':
        html += `<p>${text}</p>`;
        break;
      case 'heading_1':
        html += `<h1>${text}</h1>`;
        break;
      case 'heading_2':
        html += `<h2>${text}</h2>`;
        break;
      case 'heading_3':
        html += `<h3>${text}</h3>`;
        break;
      case 'bulleted_list_item':
        if (listType !== 'ul') { html += '<ul>'; listType = 'ul'; }
        html += `<li>${text}</li>`;
        break;
      case 'numbered_list_item':
        if (listType !== 'ol') { html += '<ol>'; listType = 'ol'; }
        html += `<li>${text}</li>`;
        break;
      case 'quote':
        html += `<blockquote>${text}</blockquote>`;
        break;
      case 'divider':
        html += '<hr>';
        break;
      case 'code':
        html += `<pre><code>${content?.rich_text?.[0]?.plain_text || ''}</code></pre>`;
        break;
      case 'image': {
        const url = content?.external?.url || content?.file?.url || '';
        const caption = content?.caption?.[0]?.plain_text || '';
        html += `<figure><img src="${url}" alt="${caption}" loading="lazy"><figcaption>${caption}</figcaption></figure>`;
        break;
      }
      case 'callout':
        html += `<div class="callout">${content?.icon?.emoji || ''} ${text}</div>`;
        break;
    }
  }

  if (listType === 'ul') html += '</ul>';
  if (listType === 'ol') html += '</ol>';
  return html;
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const slug = event.queryStringParameters?.slug;
    if (!slug) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing slug' }) };

    // 1. Suche Page nach Slug
    const searchRes = await fetch(
      `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: {
            and: [
              { property: 'Slug', rich_text: { equals: slug } },
              { property: 'Published', checkbox: { equals: true } },
            ],
          },
        }),
      }
    );

    const searchData = await searchRes.json();
    if (!searchData.results?.length) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Post not found' }) };
    }

    const page = searchData.results[0];

    // 2. Hole Blocks (Inhalt)
    const blocksRes = await fetch(
      `https://api.notion.com/v1/blocks/${page.id}/children?page_size=100`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
        },
      }
    );

    const blocksData = await blocksRes.json();
    const contentHtml = blocksToHtml(blocksData.results || []);

    const post = {
      id: page.id,
      title: page.properties.Title?.title?.[0]?.plain_text || '',
      slug: page.properties.Slug?.rich_text?.[0]?.plain_text || '',
      date: page.properties.Date?.date?.start || '',
      summary: page.properties.Summary?.rich_text?.[0]?.plain_text || '',
      cover: page.properties.Cover?.url || page.cover?.external?.url || null,
      content: contentHtml,
    };

    return { statusCode: 200, headers, body: JSON.stringify(post) };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
```

---

### F) `_redirects` — Erstellen oder aktualisieren

Falls die Datei bereits existiert, die folgenden Zeilen OBEN einfügen:

```
/api/*  /.netlify/functions/:splat  200
/blog/:slug  /blog/post.html  200
```

---

### G) `netlify.toml` — Erstellen oder aktualisieren

```toml
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
```

---

## Notion Datenbank Schema

Die Notion-Datenbank MUSS diese Properties exakt so heißen:

| Property-Name | Notion-Typ | Beschreibung |
|---|---|---|
| `Title` | Title (Standard) | Artikelüberschrift |
| `Slug` | Text | URL-Segment, z.B. `mein-erster-artikel` |
| `Published` | Checkbox | Nur bei ✅ wird Artikel angezeigt |
| `Date` | Date | Veröffentlichungsdatum |
| `Summary` | Text | Kurze Teaser-Beschreibung (1-2 Sätze) |
| `Cover` | URL | Cover-Bild als direkter Link. **Empfehlung: 1600 × 900 px (16:9).** Dieses eine Bild wird in allen 3 Positionen verwendet (Artikel-Seite, /blog-Karte, Homepage-Teaser) — immer als 16:9-Container mit `object-fit: cover`. Ein Upload pro Artikel reicht. |

---

## Design-Regeln

- Alle CSS-Variablen aus `:root` der `index.html` **unverändert** wiederverwenden
- Keine externen CSS-Frameworks (kein Bootstrap, kein Tailwind, kein CDN)
- Nur Vanilla CSS
- Nav und Footer **pixel-identisch** zur `index.html`
- Mobile-first, vollständig responsive
- Animationen konsistent zur bestehenden Site

**Bilder — Ein Cover, drei Stellen:**
- Alle drei Image-Positionen (Artikel-Seite, /blog-Listenansicht, Homepage-Teaser) nutzen **dasselbe `cover`-Feld** aus Notion
- Alle drei Container: `aspect-ratio: 16/9`, `object-fit: cover` — kein separates Zuschneiden nötig
- Empfohlene Upload-Größe: **1600 × 900 px** — funktioniert für alle Slots ohne Qualitätsverlust
- Kein Bild gesetzt → kein leerer Container, Card zeigt nur Text

---

## Technische Anforderungen

- Keine npm/node_modules in Netlify Functions — nur native `fetch()` (Node 18+)
- Notion API Version immer: `2022-06-28`
- Kein API-Key oder Database-ID im Frontend-Code
- Alle Fehler graceful abfangen und anzeigen

---

## Abschließende Checkliste

Bestätige nach Abschluss jeden Punkt:

- [ ] `blog/index.html` erstellt
- [ ] `blog/post.html` erstellt
- [ ] `netlify/functions/get-posts.js` erstellt
- [ ] `netlify/functions/get-post.js` erstellt
- [ ] `_redirects` erstellt/aktualisiert
- [ ] `netlify.toml` erstellt/aktualisiert
- [ ] Homepage-Sektion in `index.html` eingefügt
