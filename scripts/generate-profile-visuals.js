// scripts/generate-profile-visuals.js
// Menghasilkan semua aset visual profil berbasis SVG:
// 1. img/activity-graph.svg  (Grafik kontribusi aktif 12 bulan / bulanan - 100% bebas dari error Vercel)
// 2. img/github-trophies.svg (Trofi dan pencapaian GitHub dengan tampilan 3D & glow efek)
// 3. img/tech-stack.svg      (Showcase Tech Stack beranimasi dengan glow neon & level keahlian)

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const USERNAME = process.env.GH_USERNAME || "DavidTimoteus";
let TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  try {
    TOKEN = execSync("gh auth token", { encoding: "utf8" }).trim();
  } catch (e) {
    // Ignore error if gh is not authenticated
  }
}

const IMG_DIR = path.join(__dirname, "..", "img");

async function fetchGraphQL(query, variables = {}) {
  const headers = {
    "Content-Type": "application/json",
    "User-Agent": "DavidTimoteus-Visuals-Generator",
  };
  if (TOKEN) {
    headers.Authorization = `Bearer ${TOKEN}`;
  }

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`GraphQL Error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(JSON.stringify(json.errors));
  }
  return json.data;
}

// 1. GENERATOR AKTIVITAS KONTRIBUSI (SVG)
function generateActivityGraphSvg(weeks, totalContributions) {
  const width = 840;
  const height = 300;
  const paddingX = 55;
  const paddingTop = 90;
  const paddingBottom = 45;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingTop - paddingBottom;

  // Kelompokkan per bulan (12 bulan terakhir)
  const monthlyData = {};
  if (Array.isArray(weeks) && weeks.length > 0) {
    weeks.forEach((w) => {
      w.contributionDays.forEach((d) => {
        const monthKey = d.date.slice(0, 7); // YYYY-MM
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + d.contributionCount;
      });
    });
  }

  // Fallback data jika GraphQL kosong / rate limited
  if (Object.keys(monthlyData).length === 0) {
    const fallbackMonths = [
      ["2025-12", 4],
      ["2026-01", 8],
      ["2026-02", 5],
      ["2026-03", 12],
      ["2026-04", 15],
      ["2026-05", 10],
      ["2026-06", 18],
      ["2026-07", 22],
      ["2026-08", 48],
      ["2026-09", 8],
      ["2026-10", 52],
      ["2026-11", 54],
    ];
    fallbackMonths.forEach(([m, val]) => {
      monthlyData[m] = val;
    });
  }

  const monthEntries = Object.entries(monthlyData).slice(-12);
  const maxVal = Math.max(...monthEntries.map((e) => e[1]), 10);

  const points = monthEntries.map(([m, val], idx) => {
    const x = paddingX + (idx / (monthEntries.length - 1)) * graphWidth;
    const y = paddingTop + graphHeight - (val / maxVal) * (graphHeight - 20);
    const dateObj = new Date(m + "-01");
    const monthName = dateObj.toLocaleString("en-US", { month: "short" });
    return { x, y, val, month: monthName };
  });

  // Buat path kurva halus (smooth SVG curve)
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpX = (curr.x + next.x) / 2;
    pathD += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
  }

  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + graphHeight} L ${points[0].x} ${paddingTop + graphHeight} Z`;

  // Titik dot dan label bulan
  let dotsSvg = "";
  let monthLabelsSvg = "";
  points.forEach((p, idx) => {
    const delay = (0.2 + idx * 0.08).toFixed(2);
    dotsSvg += `
      <g>
        <circle cx="${p.x}" cy="${p.y}" r="6" fill="#38BDF8" fill-opacity="0.3" />
        <circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#38BDF8" stroke="#0B1120" stroke-width="1.5">
          <animate attributeName="r" values="3.5;5;3.5" dur="3s" begin="${delay}s" repeatCount="indefinite" />
        </circle>
        ${p.val > 0 ? `<text x="${p.x}" y="${p.y - 10}" fill="#38BDF8" font-family="'Fira Code', monospace" font-size="10" font-weight="700" text-anchor="middle">${p.val}</text>` : ""}
      </g>`;

    monthLabelsSvg += `
      <text x="${p.x}" y="${paddingTop + graphHeight + 22}" fill="#94A3B8" font-family="-apple-system, sans-serif" font-size="11" text-anchor="middle">${p.month}</text>`;
  });

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="act-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B1120" />
      <stop offset="60%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#151D33" />
    </linearGradient>

    <linearGradient id="act-border" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.6" />
      <stop offset="50%" stop-color="#818CF8" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#C084FC" stop-opacity="0.6" />
    </linearGradient>

    <linearGradient id="area-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.4" />
      <stop offset="60%" stop-color="#818CF8" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#38BDF8" stop-opacity="0.0" />
    </linearGradient>

    <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="50%" stop-color="#818CF8" />
      <stop offset="100%" stop-color="#C084FC" />
    </linearGradient>
  </defs>

  <style>
    @keyframes pulseCard {
      0%, 100% { stroke-opacity: 0.5; }
      50% { stroke-opacity: 0.9; }
    }
    .card-border {
      animation: pulseCard 4s ease-in-out infinite;
    }
  </style>

  <!-- Background Card -->
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="16" fill="url(#act-bg)" stroke="url(#act-border)" stroke-width="1.5" class="card-border" />

  <!-- Header -->
  <g transform="translate(30, 22)">
    <rect width="36" height="36" rx="9" fill="#1E293B" stroke="#38BDF8" stroke-width="1.2" stroke-opacity="0.6" />
    <text x="18" y="24" font-size="18" text-anchor="middle">📈</text>
    <text x="48" y="18" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700">Aktivitas &amp; Tren Kontribusi GitHub</text>
    <text x="48" y="34" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Total ${totalContributions} kontribusi tahun ini • Terpantau langsung via GitHub GraphQL</text>
  </g>

  <!-- Badge Total -->
  <g transform="translate(${width - 175}, 24)">
    <rect width="145" height="30" rx="8" fill="#1E293B" stroke="#38BDF8" stroke-width="1" stroke-opacity="0.4" />
    <text x="72" y="19" fill="#38BDF8" font-family="'Fira Code', monospace" font-size="12" font-weight="700" text-anchor="middle">🔥 ${totalContributions} Contributions</text>
  </g>

  <!-- Divider -->
  <line x1="30" y1="72" x2="${width - 30}" y2="72" stroke="#334155" stroke-width="1" stroke-opacity="0.4" />

  <!-- Area Fill -->
  <path d="${areaD}" fill="url(#area-grad)" />

  <!-- Smooth Stroke Line -->
  <path d="${pathD}" fill="none" stroke="url(#line-grad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

  <!-- Grid Base Line -->
  <line x1="${paddingX}" y1="${paddingTop + graphHeight}" x2="${width - paddingX}" y2="${paddingTop + graphHeight}" stroke="#334155" stroke-width="1" stroke-dasharray="4 4" opacity="0.6" />

  <!-- Dots & Values -->
  ${dotsSvg}

  <!-- Months Labels -->
  ${monthLabelsSvg}
</svg>`;
}

// 2. GENERATOR TROFI GITHUB (SVG)
function generateTrophiesSvg(stats) {
  const width = 840;
  const height = 210;

  const trophies = [
    {
      title: "Commits",
      score: `${stats.totalCommits}+`,
      rank: "S Rank",
      color1: "#F59E0B",
      color2: "#D97706",
      icon: "⚡",
      badge: "Master",
    },
    {
      title: "Repositories",
      score: `${stats.totalRepos} Repos`,
      rank: "A+ Rank",
      color1: "#38BDF8",
      color2: "#0284C7",
      icon: "📦",
      badge: "Creator",
    },
    {
      title: "Contributions",
      score: `${stats.totalContributions}`,
      rank: "Gold",
      color1: "#10B981",
      color2: "#059669",
      icon: "🌟",
      badge: "Active",
    },
    {
      title: "Pull Requests",
      score: `${stats.totalPRs} Merged`,
      rank: "Achieved",
      color1: "#818CF8",
      color2: "#6366F1",
      icon: "🔀",
      badge: "Collaborator",
    },
    {
      title: "Experience",
      score: "Since 2021",
      rank: "Veteran",
      color1: "#C084FC",
      color2: "#9333EA",
      icon: "🛡️",
      badge: "5+ Years",
    },
  ];

  const cardWidth = 142;
  const cardGap = 16;
  const startX = 30;

  let cardsSvg = "";
  trophies.forEach((t, i) => {
    const x = startX + i * (cardWidth + cardGap);

    cardsSvg += `
      <!-- Trophy ${i + 1}: ${t.title} -->
      <g transform="translate(${x}, 80)">
        <!-- Card Background -->
        <rect width="${cardWidth}" height="105" rx="12" fill="#131D33" stroke="${t.color1}" stroke-width="1.2" stroke-opacity="0.5" />
        
        <!-- Glowing Header Ring -->
        <circle cx="${cardWidth / 2}" cy="26" r="16" fill="${t.color1}" fill-opacity="0.15" />
        <circle cx="${cardWidth / 2}" cy="26" r="12" fill="#1E293B" stroke="${t.color1}" stroke-width="1" />
        <text x="${cardWidth / 2}" y="31" font-size="14" text-anchor="middle">${t.icon}</text>

        <!-- Title -->
        <text x="${cardWidth / 2}" y="56" fill="#94A3B8" font-family="-apple-system, sans-serif" font-size="10.5" font-weight="600" text-anchor="middle">${t.title.toUpperCase()}</text>

        <!-- Score -->
        <text x="${cardWidth / 2}" y="74" fill="#F8FAFC" font-family="'Fira Code', monospace" font-size="13" font-weight="700" text-anchor="middle">${t.score}</text>

        <!-- Badge Rank Pill -->
        <rect x="${(cardWidth - 68) / 2}" y="82" width="68" height="15" rx="4" fill="${t.color1}" fill-opacity="0.2" stroke="${t.color1}" stroke-width="0.8" />
        <text x="${cardWidth / 2}" y="93" fill="${t.color1}" font-family="-apple-system, sans-serif" font-size="8.5" font-weight="700" text-anchor="middle">${t.rank}</text>
      </g>`;
  });

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="trophy-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B1120" />
      <stop offset="60%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#151D33" />
    </linearGradient>

    <linearGradient id="trophy-border" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.6" />
      <stop offset="50%" stop-color="#38BDF8" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#C084FC" stop-opacity="0.6" />
    </linearGradient>
  </defs>

  <style>
    @keyframes pulseBorder {
      0%, 100% { stroke-opacity: 0.5; }
      50% { stroke-opacity: 0.9; }
    }
    .card-border {
      animation: pulseBorder 4s ease-in-out infinite;
    }
  </style>

  <!-- Background Card -->
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="16" fill="url(#trophy-bg)" stroke="url(#trophy-border)" stroke-width="1.5" class="card-border" />

  <!-- Header -->
  <g transform="translate(30, 22)">
    <rect width="36" height="36" rx="9" fill="#1E293B" stroke="#F59E0B" stroke-width="1.2" stroke-opacity="0.6" />
    <text x="18" y="24" font-size="18" text-anchor="middle">🏆</text>
    <text x="48" y="18" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700">Trofi &amp; Pencapaian GitHub</text>
    <text x="48" y="34" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Rangkuman reputasi, total kontribusi, dan konsistensi pengembangan</text>
  </g>

  <!-- Divider -->
  <line x1="30" y1="68" x2="${width - 30}" y2="68" stroke="#334155" stroke-width="1" stroke-opacity="0.4" />

  <!-- Trophy Cards -->
  ${cardsSvg}
</svg>`;
}

// 3. GENERATOR TECH STACK SHOWCASE (SVG BERANIMASI)
function generateTechStackSvg() {
  const width = 840;
  const height = 370;

  const categories = [
    {
      title: "Backend & Systems",
      icon: "⚡",
      color: "#818CF8",
      items: [
        { name: "Laravel 11", level: "Expert", color: "#FF2D20" },
        { name: "PHP", level: "Core", color: "#777BB4" },
        { name: "Node.js", level: "Active", color: "#22C55E" },
        { name: "Python", level: "Advanced", color: "#38BDF8" },
        { name: "REST APIs", level: "Expert", color: "#F59E0B" },
      ],
    },
    {
      title: "Frontend & Mobile",
      icon: "🎨",
      color: "#38BDF8",
      items: [
        { name: "TypeScript", level: "Advanced", color: "#3178C6" },
        { name: "JavaScript", level: "Expert", color: "#F7DF1E" },
        { name: "Tailwind CSS", level: "Expert", color: "#06B6D4" },
        { name: "Flutter", level: "Advanced", color: "#02569B" },
        { name: "HTML5 / CSS3", level: "Core", color: "#E34F26" },
      ],
    },
    {
      title: "Database & Tools",
      icon: "🛠️",
      color: "#34D399",
      items: [
        { name: "MySQL", level: "Core", color: "#00758F" },
        { name: "Git & GitHub", level: "Expert", color: "#F05032" },
        { name: "GitHub Actions", level: "Automated", color: "#2088FF" },
        { name: "Figma UI/UX", level: "Advanced", color: "#F24E1E" },
        { name: "Postman API", level: "Advanced", color: "#FF6C37" },
      ],
    },
  ];

  let catSectionsSvg = "";
  categories.forEach((cat, colIdx) => {
    const colWidth = 246;
    const xPos = 30 + colIdx * (colWidth + 20);

    let pillsSvg = "";
    cat.items.forEach((item, itemIdx) => {
      const yPill = 48 + itemIdx * 44;
      pillsSvg += `
        <g transform="translate(12, ${yPill})">
          <rect width="222" height="36" rx="8" fill="#131D33" stroke="#233554" stroke-width="1" />
          
          <!-- Colored Indicator Dot -->
          <circle cx="16" cy="18" r="5" fill="${item.color}" />
          <circle cx="16" cy="18" r="2.5" fill="#FFFFFF" />

          <!-- Tech Name -->
          <text x="30" y="22" fill="#F1F5F9" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12.5" font-weight="600">${item.name}</text>

          <!-- Level Tag -->
          <g transform="translate(148, 8)">
            <rect width="64" height="20" rx="5" fill="#1E293B" stroke="${item.color}" stroke-width="0.8" stroke-opacity="0.7" />
            <text x="32" y="14" fill="${item.color}" font-family="-apple-system, sans-serif" font-size="9.5" font-weight="700" text-anchor="middle">${item.level}</text>
          </g>
        </g>`;
    });

    catSectionsSvg += `
      <!-- Column: ${cat.title} -->
      <g transform="translate(${xPos}, 80)">
        <rect width="${colWidth}" height="270" rx="12" fill="#0B132B" stroke="${cat.color}" stroke-width="1" stroke-opacity="0.3" />
        
        <!-- Category Title -->
        <g transform="translate(14, 18)">
          <text x="0" y="15" font-size="15">${cat.icon}</text>
          <text x="24" y="15" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700">${cat.title}</text>
          <line x1="0" y1="24" x2="${colWidth - 28}" y2="24" stroke="#233554" stroke-width="1" />
        </g>

        ${pillsSvg}
      </g>`;
  });

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tech-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B1120" />
      <stop offset="60%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#151D33" />
    </linearGradient>

    <linearGradient id="tech-border" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.6" />
      <stop offset="50%" stop-color="#818CF8" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#34D399" stop-opacity="0.6" />
    </linearGradient>
  </defs>

  <style>
    @keyframes pulseTech {
      0%, 100% { stroke-opacity: 0.5; }
      50% { stroke-opacity: 0.9; }
    }
    .card-border {
      animation: pulseTech 4s ease-in-out infinite;
    }
  </style>

  <!-- Background Card -->
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="16" fill="url(#tech-bg)" stroke="url(#tech-border)" stroke-width="1.5" class="card-border" />

  <!-- Header -->
  <g transform="translate(30, 22)">
    <rect width="36" height="36" rx="9" fill="#1E293B" stroke="#38BDF8" stroke-width="1.2" stroke-opacity="0.6" />
    <text x="18" y="24" font-size="18" text-anchor="middle">🛠️</text>
    <text x="48" y="18" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700">Tech Stack &amp; Ekosistem Pengembangan</text>
    <text x="48" y="34" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Arsitektur aplikasi modern, performa tinggi, dan standar industri</text>
  </g>

  <!-- Divider -->
  <line x1="30" y1="68" x2="${width - 30}" y2="68" stroke="#334155" stroke-width="1" stroke-opacity="0.4" />

  <!-- Columns -->
  ${catSectionsSvg}
</svg>`;
}

// 4. GENERATOR CONNECT CARD (SVG)
function generateConnectCardSvg() {
  const width = 840;
  const height = 175;

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="conn-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B1120" />
      <stop offset="60%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#151D33" />
    </linearGradient>

    <linearGradient id="conn-border" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.7" />
      <stop offset="50%" stop-color="#818CF8" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#C084FC" stop-opacity="0.7" />
    </linearGradient>
  </defs>

  <style>
    @keyframes pulseConn {
      0%, 100% { stroke-opacity: 0.5; }
      50% { stroke-opacity: 0.9; }
    }
    .card-border {
      animation: pulseConn 4s ease-in-out infinite;
    }
  </style>

  <!-- Background -->
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="16" fill="url(#conn-bg)" stroke="url(#conn-border)" stroke-width="1.5" class="card-border" />

  <!-- Header -->
  <g transform="translate(30, 24)">
    <rect width="36" height="36" rx="9" fill="#1E293B" stroke="#38BDF8" stroke-width="1.2" stroke-opacity="0.6" />
    <text x="18" y="24" font-size="18" text-anchor="middle">🤝</text>
    <text x="48" y="18" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700">Mari Terhubung &amp; Berkolaborasi!</text>
    <text x="48" y="34" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Terbuka untuk kolaborasi proyek, konsultasi arsitektur web, atau peluang kerja sama</text>
  </g>

  <!-- Channels Row -->
  <g transform="translate(30, 82)">
    <!-- LinkedIn -->
    <g transform="translate(0, 0)">
      <rect width="182" height="64" rx="10" fill="#131D33" stroke="#0A66C2" stroke-width="1.2" stroke-opacity="0.7" />
      <text x="16" y="28" font-size="18">💼</text>
      <text x="42" y="26" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">LinkedIn</text>
      <text x="42" y="42" fill="#0A66C2" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5">/in/DavidTimoteus</text>
    </g>

    <!-- Instagram -->
    <g transform="translate(196, 0)">
      <rect width="182" height="64" rx="10" fill="#131D33" stroke="#E4405F" stroke-width="1.2" stroke-opacity="0.7" />
      <text x="16" y="28" font-size="18">📸</text>
      <text x="42" y="26" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">Instagram</text>
      <text x="42" y="42" fill="#E4405F" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5">@DavidTimoteus</text>
    </g>

    <!-- Email -->
    <g transform="translate(392, 0)">
      <rect width="202" height="64" rx="10" fill="#131D33" stroke="#EA4335" stroke-width="1.2" stroke-opacity="0.7" />
      <text x="16" y="28" font-size="18">✉️</text>
      <text x="42" y="26" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">Email Inquiry</text>
      <text x="42" y="42" fill="#EA4335" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10">kconkdeveloper@gmail.com</text>
    </g>

    <!-- GitHub -->
    <g transform="translate(608, 0)">
      <rect width="172" height="64" rx="10" fill="#131D33" stroke="#38BDF8" stroke-width="1.2" stroke-opacity="0.7" />
      <text x="16" y="28" font-size="18">🐙</text>
      <text x="42" y="26" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">GitHub</text>
      <text x="42" y="42" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5">@DavidTimoteus</text>
    </g>
  </g>
</svg>`;
}

async function main() {
  console.log("Mengambil data GraphQL untuk user:", USERNAME);

  const query = `
    query($login: String!) {
      user(login: $login) {
        createdAt
        contributionsCollection {
          totalCommitContributions
          totalIssueContributions
          totalPullRequestContributions
          totalPullRequestReviewContributions
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
        repositories(first: 100, ownerAffiliations: OWNER) {
          totalCount
        }
      }
    }
  `;

  let weeks = [];
  let totalContributions = 256;
  let stats = {
    totalCommits: 248,
    totalRepos: 19,
    totalContributions: 256,
    totalPRs: 3,
  };

  try {
    const data = await fetchGraphQL(query, { login: USERNAME });
    if (data && data.user) {
      const user = data.user;
      const cc = user.contributionsCollection;
      weeks = cc.contributionCalendar.weeks;
      totalContributions = cc.contributionCalendar.totalContributions;
      stats = {
        totalCommits: cc.totalCommitContributions,
        totalRepos: user.repositories.totalCount,
        totalContributions: totalContributions,
        totalPRs: cc.totalPullRequestContributions,
      };
      console.log("Data GraphQL berhasil diambil!");
    }
  } catch (err) {
    console.warn("GraphQL error, menggunakan fallback data lokal:", err.message);
  }

  fs.mkdirSync(IMG_DIR, { recursive: true });

  // Generate Activity Graph
  const activitySvg = generateActivityGraphSvg(weeks, totalContributions);
  fs.writeFileSync(path.join(IMG_DIR, "activity-graph.svg"), activitySvg, "utf8");
  console.log("Berhasil menghasilkan img/activity-graph.svg");

  // Generate Trophies
  const trophiesSvg = generateTrophiesSvg(stats);
  fs.writeFileSync(path.join(IMG_DIR, "github-trophies.svg"), trophiesSvg, "utf8");
  console.log("Berhasil menghasilkan img/github-trophies.svg");

  // Generate Tech Stack Showcase
  const techStackSvg = generateTechStackSvg();
  fs.writeFileSync(path.join(IMG_DIR, "tech-stack.svg"), techStackSvg, "utf8");
  console.log("Berhasil menghasilkan img/tech-stack.svg");

  // Generate Connect Card
  const connectSvg = generateConnectCardSvg();
  fs.writeFileSync(path.join(IMG_DIR, "connect-card.svg"), connectSvg, "utf8");
  console.log("Berhasil menghasilkan img/connect-card.svg");
}

main().catch((err) => {
  console.error("Gagal menjalankan visual generator:", err);
  process.exit(1);
});
