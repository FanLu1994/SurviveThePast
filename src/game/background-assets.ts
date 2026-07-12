const BACKGROUND_PATHS: Record<string, string> = {
  'cloth-yard': '/assets/images/levels/late-han/bg-village.webp',
  'cloth-shop': '/assets/images/levels/late-han/bg-inn.webp',
  'cloth-tea': '/assets/images/levels/northern-song/bg-street.webp',
  'cloth-alley': '/assets/images/levels/late-han/bg-road.webp',
  'cloth-dye': '/assets/images/levels/late-qing/bg-street.webp',
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
  'mid-tang-fang': '/assets/images/levels/mid-tang/bg-fang.webp',
  'mid-tang-inn': '/assets/images/levels/mid-tang/bg-inn.webp',
  'mid-tang-curfew': '/assets/images/levels/mid-tang/bg-curfew.webp',
  'early-ming-road': '/assets/images/levels/early-ming/bg-road.webp',
  'early-ming-village': '/assets/images/levels/early-ming/bg-village.webp',
  'early-ming-checkpoint': '/assets/images/levels/early-ming/bg-checkpoint.webp',
  'late-qing-street': '/assets/images/levels/late-qing/bg-street.webp',
  'late-qing-inn': '/assets/images/levels/late-qing/bg-inn.webp',
  'late-qing-baojia': '/assets/images/levels/late-qing/bg-baojia.webp',
}

export function getBackgroundImageUrl(backgroundId: string): string | undefined {
  return BACKGROUND_PATHS[backgroundId]
}
