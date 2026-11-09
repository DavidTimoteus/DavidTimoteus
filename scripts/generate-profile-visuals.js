// scripts/generate-profile-visuals.js
// Menghasilkan semua aset visual profil berbasis SVG dengan desain presisi tinggi (Linear/Vercel style):
// 1. img/tech-stack.svg      (Showcase Tech Stack dengan tata letak simetris, icon & badge rapi)
// 2. img/github-trophies.svg (Rak trofi prestasi GitHub vektor 3D dengan padding simetris)
// 3. img/activity-graph.svg  (Grafik kontribusi kurva halus 12 bulan)

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const USERNAME = process.env.GH_USERNAME || "DavidTimoteus";
let TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  try {
    TOKEN = execSync("gh auth token", { encoding: "utf8" }).trim();
  } catch (e) {}
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

function escapeXml(unsafe) {
  if (unsafe === undefined || unsafe === null) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// -------------------------------------------------------------
// 1. GENERATOR TECH STACK (DESAIN PRESISI & SIMETRIS)
// -------------------------------------------------------------
function generateTechStackSvg() {
  const width = 840;
  const height = 340;
  const colWidth = 240;
  const colGap = 20;
  const paddingX = 40; // 40 + 240 + 20 + 240 + 20 + 240 + 40 = 840 (Sempurna Simetris)
  const headerHeight = 75;

  const categories = [
    {
      title: "Backend & Systems",
      iconColor: "#818CF8",
      borderColor: "#6366F1",
      items: [
        { name: "Laravel 11", level: "Expert", color: "#FF2D20" },
        { name: "PHP 8+", level: "Core", color: "#777BB4" },
        { name: "Node.js", level: "Active", color: "#22C55E" },
        { name: "Python", level: "Advanced", color: "#38BDF8" },
        { name: "RESTful API", level: "Expert", color: "#F59E0B" },
      ],
    },
    {
      title: "Frontend & Mobile",
      iconColor: "#38BDF8",
      borderColor: "#0284C7",
      items: [
        { name: "TypeScript", level: "Advanced", color: "#3178C6" },
        { name: "JavaScript ES6+", level: "Expert", color: "#F7DF1E" },
        { name: "Tailwind CSS", level: "Expert", color: "#06B6D4" },
        { name: "Flutter & Dart", level: "Advanced", color: "#02569B" },
        { name: "HTML5 & CSS3", level: "Core", color: "#E34F26" },
      ],
    },
    {
      title: "Data, Cloud & Tools",
      iconColor: "#34D399",
      borderColor: "#059669",
      items: [
        { name: "MySQL", level: "Core", color: "#00758F" },
        { name: "Git & GitHub", level: "Expert", color: "#F05032" },
        { name: "GitHub Actions", level: "Automated", color: "#2088FF" },
        { name: "Postman API", level: "Advanced", color: "#FF6C37" },
        { name: "Figma UI/UX", level: "Design", color: "#F24E1E" },
      ],
    },
  ];

  let columnsSvg = "";
  categories.forEach((cat, colIdx) => {
    const xPos = paddingX + colIdx * (colWidth + colGap);

    let rowsSvg = "";
    cat.items.forEach((item, rowIdx) => {
      const yPill = 50 + rowIdx * 45;
      rowsSvg += `
        <!-- Item ${rowIdx + 1}: ${escapeXml(item.name)} -->
        <g transform="translate(10, ${yPill})">
          <rect width="220" height="36" rx="8" fill="#111625" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
          
          <!-- Brand Dot Indicator -->
          <circle cx="16" cy="18" r="4.5" fill="${item.color}" />
          
          <!-- Name -->
          <text x="28" y="22" fill="#F1F5F9" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">${escapeXml(item.name)}</text>
          
          <!-- Level Tag -->
          <rect x="146" y="8" width="64" height="20" rx="5" fill="#182235" stroke="${item.color}" stroke-width="0.8" stroke-opacity="0.6" />
          <text x="178" y="21.5" fill="${item.color}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="9" font-weight="700" text-anchor="middle">${escapeXml(item.level)}</text>
        </g>`;
    });

    columnsSvg += `
      <!-- Column ${colIdx + 1}: ${escapeXml(cat.title)} -->
      <g transform="translate(${xPos}, ${headerHeight + 10})">
        <!-- Column Outer Panel -->
        <rect width="${colWidth}" height="280" rx="12" fill="#0B1120" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" />
        
        <!-- Header -->
        <g transform="translate(12, 16)">
          <circle cx="8" cy="10" r="5" fill="${cat.iconColor}" />
          <text x="20" y="14" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700">${escapeXml(cat.title)}</text>
          <line x1="0" y1="24" x2="${colWidth - 24}" y2="24" stroke="rgba(255,255,255,0.07)" stroke-width="1" />
        </g>

        ${rowsSvg}
      </g>`;
  });

  return `<svg width="${width}" height="${height + 40}" viewBox="0 0 ${width} ${height + 40}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tech-card-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#08090A" />
      <stop offset="60%" stop-color="#0D1117" />
      <stop offset="100%" stop-color="#111625" />
    </linearGradient>

    <linearGradient id="tech-card-border" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.5" />
      <stop offset="50%" stop-color="#818CF8" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#34D399" stop-opacity="0.5" />
    </linearGradient>
  </defs>

  <style>
    @keyframes pulseBorder {
      0%, 100% { stroke-opacity: 0.5; }
      50% { stroke-opacity: 0.85; }
    }
    .card-border {
      animation: pulseBorder 4s ease-in-out infinite;
    }
  </style>

  <!-- Container Box -->
  <rect x="1" y="1" width="${width - 2}" height="${height + 38}" rx="16" fill="url(#tech-card-bg)" stroke="url(#tech-card-border)" stroke-width="1.2" class="card-border" />

  <!-- Section Header -->
  <g transform="translate(40, 22)">
    <rect width="32" height="32" rx="8" fill="#161B22" stroke="#38BDF8" stroke-width="1" stroke-opacity="0.4" />
    <text x="16" y="22" font-size="16" text-anchor="middle">🛠️</text>
    <text x="44" y="17" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700">Tech Stack &amp; Ekosistem Pengembangan</text>
    <text x="44" y="32" fill="#8B949E" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Arsitektur aplikasi modern, clean code, performa tinggi, dan standar industri</text>
  </g>

  <!-- Divider -->
  <line x1="40" y1="68" x2="${width - 40}" y2="68" stroke="rgba(255,255,255,0.06)" stroke-width="1" />

  <!-- Columns -->
  ${columnsSvg}
</svg>`;
}

// -------------------------------------------------------------
// 2. GENERATOR TROFI GITHUB (VEKTOR 3D & SIMETRI PRESISI)
// -------------------------------------------------------------
function generateTrophiesSvg(stats) {
  const width = 840;
  const height = 210;
  const cardWidth = 138;
  const cardGap = 17;
  const paddingX = 40; // 40 + (138 * 5) + (17 * 4) + 40 = 40 + 690 + 68 + 40 = 838 (~840 simetris)

  const trophies = [
    {
      title: "COMMITS",
      score: `${stats.totalCommits}+`,
      rank: "S RANK",
      color: "#F59E0B",
      medal: `<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#F59E0B" />`,
      badge: "Master",
    },
    {
      title: "REPOSITORIES",
      score: `${stats.totalRepos} Repos`,
      rank: "A+ RANK",
      color: "#38BDF8",
      medal: `<path d="M4 4H20V8H4V4ZM3 9H21V19C21 19.55 20.55 20 20 20H4C3.45 20 3 19.55 3 19V9ZM10 12V14H14V12H10Z" fill="#38BDF8" />`,
      badge: "Creator",
    },
    {
      title: "CONTRIBUTIONS",
      score: `${stats.totalContributions}`,
      rank: "GOLD",
      color: "#10B981",
      medal: `<path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="#10B981" />`,
      badge: "Active",
    },
    {
      title: "PULL REQUESTS",
      score: `${stats.totalPRs} Merged`,
      rank: "PRO",
      color: "#818CF8",
      medal: `<path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.35C15.11 18.56 15.08 18.78 15.08 19C15.08 20.61 16.39 21.92 18 21.92C19.61 21.92 20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z" fill="#818CF8" />`,
      badge: "Collab",
    },
    {
      title: "EXPERIENCE",
      score: "Since 2021",
      rank: "VETERAN",
      color: "#C084FC",
      medal: `<path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99H19C18.47 16.11 15.72 19.78 12 20.93V12H5V6.3L12 3.19V11.99Z" fill="#C084FC" />`,
      badge: "5+ Years",
    },
  ];

  let cardsSvg = "";
  trophies.forEach((t, i) => {
    const x = paddingX + i * (cardWidth + cardGap);

    cardsSvg += `
      <!-- Trophy Card ${i + 1}: ${t.title} -->
      <g transform="translate(${x}, 82)">
        <!-- Card Frame -->
        <rect width="${cardWidth}" height="106" rx="10" fill="#0D1117" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
        
        <!-- Top Glow Circle -->
        <circle cx="${cardWidth / 2}" cy="26" r="15" fill="${t.color}" fill-opacity="0.12" />
        <g transform="translate(${cardWidth / 2 - 10}, 16) scale(0.85)">
          ${t.medal}
        </g>

        <!-- Category Title -->
        <text x="${cardWidth / 2}" y="55" fill="#8B949E" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="700" letter-spacing="0.5" text-anchor="middle">${t.title}</text>

        <!-- Score Value -->
        <text x="${cardWidth / 2}" y="74" fill="#F0F6FC" font-family="'Fira Code', monospace" font-size="13" font-weight="700" text-anchor="middle">${t.score}</text>

        <!-- Rank Badge -->
        <rect x="${(cardWidth - 70) / 2}" y="82" width="70" height="15" rx="4" fill="#161B22" stroke="${t.color}" stroke-width="0.8" stroke-opacity="0.6" />
        <text x="${cardWidth / 2}" y="93" fill="${t.color}" font-family="-apple-system, sans-serif" font-size="8.5" font-weight="700" text-anchor="middle">${t.rank}</text>
      </g>`;
  });

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="trophy-main-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#08090A" />
      <stop offset="60%" stop-color="#0D1117" />
      <stop offset="100%" stop-color="#111625" />
    </linearGradient>

    <linearGradient id="trophy-main-border" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.5" />
      <stop offset="50%" stop-color="#38BDF8" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#C084FC" stop-opacity="0.5" />
    </linearGradient>
  </defs>

  <style>
    @keyframes pulseTrophy {
      0%, 100% { stroke-opacity: 0.5; }
      50% { stroke-opacity: 0.85; }
    }
    .card-border {
      animation: pulseTrophy 4s ease-in-out infinite;
    }
  </style>

  <!-- Container Box -->
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="16" fill="url(#trophy-main-bg)" stroke="url(#trophy-main-border)" stroke-width="1.2" class="card-border" />

  <!-- Section Header -->
  <g transform="translate(40, 22)">
    <rect width="32" height="32" rx="8" fill="#161B22" stroke="#F59E0B" stroke-width="1" stroke-opacity="0.4" />
    <text x="16" y="22" font-size="16" text-anchor="middle">🏆</text>
    <text x="44" y="17" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700">Trofi &amp; Pencapaian GitHub</text>
    <text x="44" y="32" fill="#8B949E" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Rangkuman reputasi, total kontribusi terverifikasi, dan konsistensi pengembangan</text>
  </g>

  <!-- Divider -->
  <line x1="40" y1="68" x2="${width - 40}" y2="68" stroke="rgba(255,255,255,0.06)" stroke-width="1" />

  <!-- Trophy Cards -->
  ${cardsSvg}
</svg>`;
}

// -------------------------------------------------------------
// 3. GENERATOR AKTIVITAS KONTRIBUSI (SVG)
// -------------------------------------------------------------
function generateActivityGraphSvg(weeks, totalContributions) {
  const width = 840;
  const height = 290;
  const paddingX = 50;
  const paddingTop = 85;
  const paddingBottom = 40;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingTop - paddingBottom;

  const monthlyData = {};
  if (Array.isArray(weeks) && weeks.length > 0) {
    weeks.forEach((w) => {
      w.contributionDays.forEach((d) => {
        const monthKey = d.date.slice(0, 7);
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + d.contributionCount;
      });
    });
  }

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

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpX = (curr.x + next.x) / 2;
    pathD += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
  }

  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + graphHeight} L ${points[0].x} ${paddingTop + graphHeight} Z`;

  let dotsSvg = "";
  let monthLabelsSvg = "";
  points.forEach((p, idx) => {
    const delay = (0.2 + idx * 0.08).toFixed(2);
    dotsSvg += `
      <g>
        <circle cx="${p.x}" cy="${p.y}" r="6" fill="#38BDF8" fill-opacity="0.25" />
        <circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#38BDF8" stroke="#0B1120" stroke-width="1.5">
          <animate attributeName="r" values="3.5;5;3.5" dur="3s" begin="${delay}s" repeatCount="indefinite" />
        </circle>
        ${p.val > 0 ? `<text x="${p.x}" y="${p.y - 10}" fill="#38BDF8" font-family="'Fira Code', monospace" font-size="10" font-weight="700" text-anchor="middle">${p.val}</text>` : ""}
      </g>`;

    monthLabelsSvg += `
      <text x="${p.x}" y="${paddingTop + graphHeight + 20}" fill="#8B949E" font-family="-apple-system, sans-serif" font-size="11" text-anchor="middle">${p.month}</text>`;
  });

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="act-main-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#08090A" />
      <stop offset="60%" stop-color="#0D1117" />
      <stop offset="100%" stop-color="#111625" />
    </linearGradient>

    <linearGradient id="act-main-border" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.5" />
      <stop offset="50%" stop-color="#818CF8" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#C084FC" stop-opacity="0.5" />
    </linearGradient>

    <linearGradient id="act-area-fill" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.35" />
      <stop offset="60%" stop-color="#818CF8" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#38BDF8" stop-opacity="0.0" />
    </linearGradient>

    <linearGradient id="act-line-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="50%" stop-color="#818CF8" />
      <stop offset="100%" stop-color="#C084FC" />
    </linearGradient>
  </defs>

  <style>
    @keyframes pulseGraph {
      0%, 100% { stroke-opacity: 0.5; }
      50% { stroke-opacity: 0.85; }
    }
    .card-border {
      animation: pulseGraph 4s ease-in-out infinite;
    }
  </style>

  <!-- Container Box -->
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="16" fill="url(#act-main-bg)" stroke="url(#act-main-border)" stroke-width="1.2" class="card-border" />

  <!-- Section Header -->
  <g transform="translate(40, 22)">
    <rect width="32" height="32" rx="8" fill="#161B22" stroke="#38BDF8" stroke-width="1" stroke-opacity="0.4" />
    <text x="16" y="22" font-size="16" text-anchor="middle">📈</text>
    <text x="44" y="17" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700">Aktivitas &amp; Tren Kontribusi GitHub</text>
    <text x="44" y="32" fill="#8B949E" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Total ${totalContributions} kontribusi terverifikasi tahun ini • GitHub GraphQL API</text>
  </g>

  <!-- Total Badge -->
  <g transform="translate(${width - 180}, 24)">
    <rect width="140" height="28" rx="6" fill="#161B22" stroke="#38BDF8" stroke-width="1" stroke-opacity="0.4" />
    <text x="70" y="18" fill="#38BDF8" font-family="'Fira Code', monospace" font-size="11.5" font-weight="700" text-anchor="middle">🔥 ${totalContributions} Commits</text>
  </g>

  <!-- Divider -->
  <line x1="40" y1="68" x2="${width - 40}" y2="68" stroke="rgba(255,255,255,0.06)" stroke-width="1" />

  <!-- Area Fill -->
  <path d="${areaD}" fill="url(#act-area-fill)" />

  <!-- Line Stroke -->
  <path d="${pathD}" fill="none" stroke="url(#act-line-stroke)" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />

  <!-- Grid Base Line -->
  <line x1="${paddingX}" y1="${paddingTop + graphHeight}" x2="${width - paddingX}" y2="${paddingTop + graphHeight}" stroke="rgba(255,255,255,0.08)" stroke-width="1" stroke-dasharray="4 4" />

  <!-- Dots & Labels -->
  ${dotsSvg}
  ${monthLabelsSvg}
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
    console.warn("GraphQL error, menggunakan fallback data:", err.message);
  }

  fs.mkdirSync(IMG_DIR, { recursive: true });

  // 1. Tech Stack
  const techStackSvg = generateTechStackSvg();
  fs.writeFileSync(path.join(IMG_DIR, "tech-stack.svg"), techStackSvg, "utf8");
  console.log("Berhasil menghasilkan img/tech-stack.svg (Symmetric & Refined)");

  // 2. Trophies
  const trophiesSvg = generateTrophiesSvg(stats);
  fs.writeFileSync(path.join(IMG_DIR, "github-trophies.svg"), trophiesSvg, "utf8");
  console.log("Berhasil menghasilkan img/github-trophies.svg (Vector Medals)");

  // 3. Activity Graph
  const activitySvg = generateActivityGraphSvg(weeks, totalContributions);
  fs.writeFileSync(path.join(IMG_DIR, "activity-graph.svg"), activitySvg, "utf8");
  console.log("Berhasil menghasilkan img/activity-graph.svg");
}

main().catch((err) => {
  console.error("Gagal menjalankan generator:", err);
  process.exit(1);
});
