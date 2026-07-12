const BACKGROUND_PATHS: Record<string, string> = {
  'late-han-road': '/assets/images/levels/late-han/bg-road.webp',
  'late-han-village': '/assets/images/levels/late-han/bg-village.webp',
  'late-han-inn': '/assets/images/levels/late-han/bg-inn.webp',
  'northern-song-gate': '/assets/images/levels/northern-song/bg-gate.webp',
  'northern-song-market': '/assets/images/levels/northern-song/bg-market.webp',
  'northern-song-inn': '/assets/images/levels/northern-song/bg-inn.webp',
  'northern-song-street': '/assets/images/levels/northern-song/bg-street.webp',
  'early-republic-station': '/assets/images/levels/early-republic/bg-station.webp',
  'early-republic-street': '/assets/images/levels/early-republic/bg-street.webp',
  'early-republic-inn': '/assets/images/levels/early-republic/bg-inn.webp',
  'early-republic-press': '/assets/images/levels/early-republic/bg-press.webp',
}

export function getBackgroundImageUrl(backgroundId: string): string | undefined {
  return BACKGROUND_PATHS[backgroundId]
}
