exports.handler = async () => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
  };

  const dbId = process.env.NOTION_CASE_STUDIES_DB_ID;
  if (!dbId) {
    console.error('[get-case-studies] NOTION_CASE_STUDIES_DB_ID is not set');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'NOTION_CASE_STUDIES_DB_ID not configured' }) };
  }

  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${dbId}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: {
            property: 'Live',
            checkbox: { equals: true },
          },
          sorts: [{ property: 'Order', direction: 'ascending' }],
        }),
      }
    );

    if (!response.ok) throw new Error(`Notion API error: ${response.status}`);

    const data = await response.json();

    const studies = data.results.map(page => ({
      id: page.id,
      title: page.properties.Title?.title?.[0]?.plain_text || '',
      url: page.properties.URL?.url || '#',
      image: page.properties.Screenshot?.url || null,
      device: page.properties.Device?.select?.name || 'desktop',
      alt: page.properties.Alt?.rich_text?.[0]?.plain_text || '',
    }));

    return { statusCode: 200, headers, body: JSON.stringify(studies) };
  } catch (err) {
    console.error('[get-case-studies]', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
