const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function richTextToHtml(richTexts = []) {
  return richTexts
    .map((rt) => {
      let text = escapeHtml(rt.plain_text);
      if (rt.annotations?.bold) text = `<strong>${text}</strong>`;
      if (rt.annotations?.italic) text = `<em>${text}</em>`;
      if (rt.annotations?.strikethrough) text = `<s>${text}</s>`;
      if (rt.annotations?.underline) text = `<u>${text}</u>`;
      if (rt.annotations?.code) text = `<code>${text}</code>`;
      if (rt.href) text = `<a href="${escapeHtml(rt.href)}" target="_blank" rel="noopener">${text}</a>`;
      return text;
    })
    .join('');
}

function blocksToHtml(blocks) {
  let html = '';
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    if (block.type === 'bulleted_list_item') {
      html += '<ul>';
      while (i < blocks.length && blocks[i].type === 'bulleted_list_item') {
        html += `<li>${richTextToHtml(blocks[i].bulleted_list_item.rich_text)}</li>`;
        i++;
      }
      html += '</ul>';
      continue;
    }

    if (block.type === 'numbered_list_item') {
      html += '<ol>';
      while (i < blocks.length && blocks[i].type === 'numbered_list_item') {
        html += `<li>${richTextToHtml(blocks[i].numbered_list_item.rich_text)}</li>`;
        i++;
      }
      html += '</ol>';
      continue;
    }

    switch (block.type) {
      case 'paragraph': {
        const inner = richTextToHtml(block.paragraph.rich_text);
        html += inner ? `<p>${inner}</p>` : '<p>&nbsp;</p>';
        break;
      }
      case 'heading_1':
        html += `<h2 class="post-h1">${richTextToHtml(block.heading_1.rich_text)}</h2>`;
        break;
      case 'heading_2':
        html += `<h3 class="post-h2">${richTextToHtml(block.heading_2.rich_text)}</h3>`;
        break;
      case 'heading_3':
        html += `<h4 class="post-h3">${richTextToHtml(block.heading_3.rich_text)}</h4>`;
        break;
      case 'quote':
        html += `<blockquote>${richTextToHtml(block.quote.rich_text)}</blockquote>`;
        break;
      case 'divider':
        html += '<hr>';
        break;
      case 'callout': {
        const icon = block.callout.icon?.emoji || '';
        const text = richTextToHtml(block.callout.rich_text);
        html += `<div class="callout">${icon ? `<span class="callout-icon">${icon}</span>` : ''}<div>${text}</div></div>`;
        break;
      }
      case 'code': {
        const lang = escapeHtml(block.code.language || '');
        const code = block.code.rich_text.map((rt) => rt.plain_text).join('');
        html += `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`;
        break;
      }
      case 'image': {
        const url = block.image?.external?.url || block.image?.file?.url || '';
        const caption = (block.image?.caption || []).map((rt) => rt.plain_text).join('');
        if (url) {
          html += `<figure><img src="${escapeHtml(url)}" alt="${escapeHtml(caption)}" loading="lazy">`;
          if (caption) html += `<figcaption>${escapeHtml(caption)}</figcaption>`;
          html += '</figure>';
        }
        break;
      }
      default:
        break;
    }

    i++;
  }

  return html;
}

exports.handler = async (event) => {
  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing Notion credentials' }),
    };
  }

  const slug = event.queryStringParameters?.slug;
  if (!slug) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing slug parameter' }),
    };
  }

  try {
    const queryRes = await fetch(
      `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
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

    if (!queryRes.ok) throw new Error(`Notion query ${queryRes.status}`);

    const queryData = await queryRes.json();

    if (!queryData.results?.length) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Post not found' }),
      };
    }

    const page = queryData.results[0];

    const blocksRes = await fetch(
      `https://api.notion.com/v1/blocks/${page.id}/children?page_size=100`,
      {
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
        },
      }
    );

    if (!blocksRes.ok) throw new Error(`Notion blocks ${blocksRes.status}`);

    const blocksData = await blocksRes.json();
    const content = blocksToHtml(blocksData.results || []);

    const post = {
      id: page.id,
      title: page.properties.Title?.title?.[0]?.plain_text || '',
      slug: page.properties.Slug?.rich_text?.[0]?.plain_text || '',
      date: page.properties.Date?.date?.start || null,
      summary: page.properties.Summary?.rich_text?.[0]?.plain_text || '',
      cover:
        page.properties.Cover?.url ||
        page.cover?.external?.url ||
        page.cover?.file?.url ||
        null,
      teaserHomepage: page.properties['Teaser Homepage']?.url || null,
      teaserBlogpage: page.properties['Teaser Blogpage']?.url || null,
      content,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
      },
      body: JSON.stringify(post),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
