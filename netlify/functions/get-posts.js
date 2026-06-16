const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

exports.handler = async (event) => {
  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing Notion credentials' }),
    };
  }

  const limit = Math.min(parseInt(event.queryStringParameters?.limit || '100', 10), 100);

  try {
    const res = await fetch(
      `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: { property: 'Published', checkbox: { equals: true } },
          sorts: [{ property: 'Date', direction: 'descending' }],
          page_size: limit,
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Notion ${res.status}: ${text}`);
    }

    const data = await res.json();

    const posts = data.results.map((page) => ({
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
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
      },
      body: JSON.stringify(posts),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
