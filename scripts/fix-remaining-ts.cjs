const fs = require('fs');

// Targeted fixes for specific files
const fixes = [
  // --- AddEventModal: fix updateField and form validation ---
  {
    file: 'src/components/AddEventModal/AddEventModal.tsx',
    replacements: [
      ['const updateField = (field: string, value: string) => {', 'const updateField = (field: keyof FormData, value: string | number | boolean) => {'],
      ['const [errors, setErrors] = useState({});', 'const [errors, setErrors] = useState<Record<string, string>>({});'],
      ['const selectedPlayer = players.find((p) => p.id === formData.playerId);', 'const selectedPlayer = players?.find((p: Player) => p.id === formData.playerId);'],
    ]
  },

  // --- PlayerDetail ---
  {
    file: 'src/pages/PlayerDetail/PlayerDetail.tsx',
    replacements: [
      ["const EVENT_TYPE_COLORS = {", "const EVENT_TYPE_COLORS: Record<string, string> = {"],
      ["const [activeTab, setActiveTab] = useState('overview');", "const [activeTab, setActiveTab] = useState('overview');"],
      ["const [newsUrls, setNewsUrls] = useState({});", "const [newsUrls, setNewsUrls] = useState<Record<string, string>>({});"],
      ["const [showConfirm, setShowConfirm] = useState(null);", "const [showConfirm, setShowConfirm] = useState<string | null>(null);"],
      ["const [selectedEvent, setSelectedEvent] = useState(null);", "const [selectedEvent, setSelectedEvent] = useState<{ event: unknown; position: { x: number; y: number } } | null>(null);"],
      ["const chartRef = useRef(null);", "const chartRef = useRef<HTMLDivElement>(null);"],
    ]
  },

  // --- Timeline ---
  {
    file: 'src/pages/Timeline/Timeline.tsx',
    replacements: [
      ["const REASON_TYPE_COLORS = {", "const REASON_TYPE_COLORS: Record<string, string> = {"],
      ["const EVENT_TYPE_COLORS = {", "const EVENT_TYPE_COLORS: Record<string, string> = {"],
      ["const [expandedEvents, setExpandedEvents] = useState({});", "const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});"],
    ]
  },

  // --- Portfolio ---
  {
    file: 'src/pages/Portfolio/Portfolio.tsx',
    replacements: []
  },

  // --- Watchlist ---
  {
    file: 'src/pages/Watchlist/Watchlist.tsx',
    replacements: []
  },

  // --- ScenarioToggle ---
  {
    file: 'src/components/ScenarioToggle/ScenarioToggle.tsx',
    replacements: [
      ["const [isOpen, setIsOpen] = useState(false);", "const [isOpen, setIsOpen] = useState(false);"],
      ["const dropdownRef = useRef(null);", "const dropdownRef = useRef<HTMLDivElement>(null);"],
      ["const selectedRef = useRef(null);", "const selectedRef = useRef<HTMLButtonElement>(null);"],
      ["const timeoutRef = useRef(null);", "const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);"],
    ]
  },

  // --- Leaderboard ---
  {
    file: 'src/pages/Leaderboard/Leaderboard.tsx',
    replacements: []
  },

  // --- Mission ---
  {
    file: 'src/pages/Mission/Mission.tsx',
    replacements: []
  },

  // --- DailyMission ---
  {
    file: 'src/components/DailyMission/DailyMission.tsx',
    replacements: [
      ["const [activeTab, setActiveTab] = useState('current');", "const [activeTab, setActiveTab] = useState('current');"],
    ]
  },

  // --- Onboarding ---
  {
    file: 'src/components/Onboarding/Onboarding.tsx',
    replacements: [
      ["const [tooltipData, setTooltipData] = useState(null);", "const [tooltipData, setTooltipData] = useState<{ text: string; rect: DOMRect; placement?: string } | null>(null);"],
    ]
  },

  // --- PlayoffAnnouncementModal ---
  {
    file: 'src/components/PlayoffAnnouncementModal/PlayoffAnnouncementModal.tsx',
    replacements: []
  },

  // --- TimelineDebugger ---
  {
    file: 'src/components/TimelineDebugger/TimelineDebugger.tsx',
    replacements: []
  },

  // --- Market ---
  {
    file: 'src/pages/Market/Market.tsx',
    replacements: []
  },
];

let totalFixed = 0;
for (const { file, replacements } of fixes) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  let fileChanged = false;

  for (const [old, newStr] of replacements) {
    if (old === newStr) continue;
    if (content.includes(old)) {
      content = content.replace(old, newStr);
      fileChanged = true;
    }
  }

  if (fileChanged) {
    fs.writeFileSync(file, content);
    totalFixed++;
    console.log('Fixed:', file);
  }
}
console.log(`Applied fixes to ${totalFixed} files`);
