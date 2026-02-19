// ESPN Player ID mapping for headshots
// Format: https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/{espnId}.png

const ESPN_IDS = {
  // QBs
  mahomes: '3139477',
  allen: '3918298',
  jackson: '3916387',
  hurts: '4040715',
  stroud: '4432577',

  // RBs
  mccaffrey: '3117251',
  barkley: '3929630',
  henry: '3043078',
  gibbs: '4429795',
  montgomery: '3116593',
  mixon: '3116385',

  // WRs
  hill: '3116406',
  jefferson: '4262921',
  chase: '4360310',
  lamb: '4241389',
  'williams-j': '4361307',
  nabers: '4433553',
  'brown-aj': '3116164',
  waddle: '4360234',

  // TEs
  kelce: '15847',

  // Additional players from espnPlayers.json
  'diggs-s': '3116406',
  rice: '4429795',
  cook: '4241985',
  pacheco: '4361579',
  kincaid: '4430737',
  worthy: '4432577',
  shakir: '4360438',
  pollard: '4047365',
  addison: '4426354',
  pickens: '4362628',
  'wilson-g': '4360294',
  mcconkey: '4433160',
  dell: '4426515',
  collins: '4566206',
  achane: '4430850',
  'flowers-z': '4372016',
  hall: '4430807',
  tucker: '15683',
  'henry-h': '4686472',
  jacobs: '4047646',
  taylor: '4242335',
  rodgers: '8439',
  mostert: '2977644',
  'st-brown': '4374302',
  'moore-dj': '4361741',
};

// Generate ESPN headshot URL
export function getPlayerHeadshotUrl(playerId, size = 'medium') {
  const espnId = ESPN_IDS[playerId];

  if (!espnId) {
    // Return a placeholder silhouette
    return null;
  }

  // Size options: small (48x35), medium (96x70), large (500x363)
  const dimensions = {
    small: { w: 48, h: 35 },
    medium: { w: 96, h: 70 },
    large: { w: 200, h: 146 },
  };

  const { w, h } = dimensions[size] || dimensions.medium;

  return `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${espnId}.png&w=${w}&h=${h}&cb=1`;
}

// Get team logo URL
export function getTeamLogoUrl(teamAbbr, size = 40) {
  const teamIds = {
    KC: 'kan',
    BUF: 'buf',
    BAL: 'bal',
    PHI: 'phi',
    SF: 'sf',
    DET: 'det',
    DAL: 'dal',
    MIA: 'mia',
    MIN: 'min',
    CIN: 'cin',
    HOU: 'hou',
    NYG: 'nyg',
    LAR: 'lar',
    GB: 'gb',
    PIT: 'pit',
    NYJ: 'nyj',
    SEA: 'sea',
    LAC: 'lac',
    IND: 'ind',
    ATL: 'atl',
  };

  const teamId = teamIds[teamAbbr];
  if (!teamId) return null;

  return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${teamId}.png&w=${size}&h=${size}`;
}
