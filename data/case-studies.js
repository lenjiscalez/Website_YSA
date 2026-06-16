// TODO: Replace Promise.resolve with a Notion API fetch when case studies are in the database.
// Each entry: { id, title, url, image, device: 'desktop'|'mobile', alt }

export function getCaseStudies() {
  return Promise.resolve([
    {
      id: '1',
      title: 'Friseursalon München',
      url: 'https://example.com',
      image: 'https://placehold.co/1280x800/f5f5f5/111111?text=Friseursalon+München',
      device: 'desktop',
      alt: 'Screenshot der Website eines Friseursalons in München',
    },
    {
      id: '2',
      title: 'Zahnarztpraxis Ottobrunn',
      url: 'https://example.com',
      image: 'https://placehold.co/390x844/f5f5f5/111111?text=Zahnarzt',
      device: 'mobile',
      alt: 'Mobile Website einer Zahnarztpraxis in Ottobrunn',
    },
    {
      id: '3',
      title: 'Restaurant Bogenhausen',
      url: 'https://example.com',
      image: 'https://placehold.co/1280x800/f5f5f5/111111?text=Restaurant+Bogenhausen',
      device: 'desktop',
      alt: 'Screenshot der Website eines Restaurants in Bogenhausen',
    },
    {
      id: '4',
      title: 'Physiotherapie Studio',
      url: 'https://example.com',
      image: 'https://placehold.co/390x844/f5f5f5/111111?text=Physiotherapie',
      device: 'mobile',
      alt: 'Mobile Website eines Physiotherapie Studios',
    },
    {
      id: '5',
      title: 'Rechtsanwalt Schwabing',
      url: 'https://example.com',
      image: 'https://placehold.co/1280x800/f5f5f5/111111?text=Rechtsanwalt+Schwabing',
      device: 'desktop',
      alt: 'Screenshot der Website einer Rechtsanwaltskanzlei in Schwabing',
    },
  ]);
}
