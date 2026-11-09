// scripts/update-language-stats.js
// Menghitung persentase penggunaan tiap bahasa pemrograman dari SEMUA
// repository publik milik USERNAME, lalu:
// 1. Menghasilkan file SVG animasi interaktif: img/language-progress.svg
// 2. Memperbarui marker <!--LANG-STATS-START--> dan <!--LANG-STATS-END--> di README.md

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
const README_PATH = path.join(__dirname, "..", "README.md");
const SVG_OUTPUT_PATH = path.join(__dirname, "..", "img", "language-progress.svg");
const START_MARKER = "<!--LANG-STATS-START-->";
const END_MARKER = "<!--LANG-STATS-END-->";

// Warna khas tiap bahasa dengan gradient warna (primary & secondary)
const LANGUAGE_THEMES = {
  JavaScript: { primary: "#F7DF1E", secondary: "#EAB308", text: "#000" },
  TypeScript: { primary: "#3178C6", secondary: "#2563EB", text: "#FFF" },
  PHP: { primary: "#777BB4", secondary: "#6366F1", text: "#FFF" },
  HTML: { primary: "#E34F26", secondary: "#EA580C", text: "#FFF" },
  CSS: { primary: "#1572B6", secondary: "#0284C7", text: "#FFF" },
  Blade: { primary: "#FF2D20", secondary: "#DC2626", text: "#FFF" },
  Python: { primary: "#3776AB", secondary: "#38BDF8", text: "#FFF" },
  SCSS: { primary: "#CF649A", secondary: "#DB2777", text: "#FFF" },
  "C++": { primary: "#00599C", secondary: "#3B82F6", text: "#FFF" },
  Dart: { primary: "#00B4AB", secondary: "#14B8A6", text: "#FFF" },
  Vue: { primary: "#41B883", secondary: "#10B981", text: "#FFF" },
  Shell: { primary: "#89E051", secondary: "#22C55E", text: "#000" },
  Default: { primary: "#38BDF8", secondary: "#818CF8", text: "#FFF" },
};

async function githubFetch(url) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "DavidTimoteus-Stats-Updater",
  };
  if (TOKEN) {
    headers.Authorization = `Bearer ${TOKEN}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status} untuk ${url}`);
  }
  return res.json();
}

async function getAllRepos() {
  let repos = [];
  let page = 1;
  while (true) {
    const batch = await githubFetch(
      `https://api.github.com/users/${USERNAME}/repos?per_page=100&page=${page}&type=owner`
    );
    if (!Array.isArray(batch) || batch.length === 0) break;
    repos = repos.concat(batch.filter((r) => !r.fork));
    page++;
  }
  return repos;
}

async function getLanguageBytes(repo) {
  return githubFetch(
    `https://api.github.com/repos/${USERNAME}/${repo.name}/languages`
  );
}

function generateSvgCard(rankedLanguages, grandTotal) {
  const width = 800;
  const itemHeight = 46;
  const headerHeight = 75;
  const paddingBottom = 40;
  const height = headerHeight + rankedLanguages.length * itemHeight + paddingBottom;

  let defsGradients = "";
  let rowsSvg = "";

  rankedLanguages.forEach((item, index) => {
    const lang = item.name;
    const percent = item.percent;
    const theme = LANGUAGE_THEMES[lang] || LANGUAGE_THEMES.Default;
    const gradId = `grad-lang-${index}`;
    const maxBarWidth = 460;
    const barWidth = Math.max(16, Math.round((percent / 100) * maxBarWidth));
    const yPos = headerHeight + index * itemHeight;
    const animDelay = (0.1 + index * 0.08).toFixed(2);

    defsGradients += `
      <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${theme.primary}" />
        <stop offset="100%" stop-color="${theme.secondary}" />
      </linearGradient>`;

    rowsSvg += `
      <!-- Row ${index + 1}: ${lang} -->
      <g transform="translate(30, ${yPos})" class="row-item">
        <!-- Glowing Dot -->
        <circle cx="10" cy="14" r="7" fill="${theme.primary}" fill-opacity="0.25" />
        <circle cx="10" cy="14" r="4.5" fill="${theme.primary}" />

        <!-- Language Name -->
        <text x="30" y="19" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="14" font-weight="600">${lang}</text>

        <!-- Bar Track -->
        <rect x="180" y="5" width="${maxBarWidth}" height="18" rx="9" fill="#131D33" stroke="#233554" stroke-width="1" />

        <!-- Bar Fill with Animation -->
        <rect x="180" y="5" width="${barWidth}" height="18" rx="9" fill="url(#${gradId})">
          <animate attributeName="width" from="0" to="${barWidth}" dur="1.2s" begin="${animDelay}s" fill="freeze" calcMode="spline" keySplines="0.16 1 0.3 1" keyTimes="0;1" />
        </rect>

        <!-- Shimmer Highlight Effect -->
        <rect x="180" y="5" width="${barWidth}" height="9" rx="4.5" fill="#FFFFFF" fill-opacity="0.15" />

        <!-- Percentage Badge -->
        <g transform="translate(${180 + maxBarWidth + 18}, 4)">
          <rect width="64" height="20" rx="6" fill="#131D33" stroke="${theme.primary}" stroke-width="1" stroke-opacity="0.6" />
          <text x="32" y="14" fill="#38BDF8" font-family="'Fira Code', ui-monospace, monospace" font-size="12" font-weight="700" text-anchor="middle">${percent}%</text>
        </g>
      </g>`;
  });

  const nowFormatted = new Date().toISOString().slice(0, 10);

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B1120" />
      <stop offset="60%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#151F38" />
    </linearGradient>

    <!-- Border Gradient -->
    <linearGradient id="border-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.6" />
      <stop offset="40%" stop-color="#818CF8" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#C084FC" stop-opacity="0.6" />
    </linearGradient>

    ${defsGradients}
  </defs>

  <style>
    @keyframes pulseBorder {
      0%, 100% { stroke-opacity: 0.6; }
      50% { stroke-opacity: 0.9; }
    }
    .card-border {
      animation: pulseBorder 4s ease-in-out infinite;
    }
  </style>

  <!-- Card Background -->
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="16" fill="url(#bg-grad)" stroke="url(#border-grad)" stroke-width="1.5" class="card-border" />

  <!-- Header -->
  <g transform="translate(30, 22)">
    <!-- Glowing Header Icon Box -->
    <rect width="36" height="36" rx="9" fill="#1E293B" stroke="#38BDF8" stroke-width="1.2" stroke-opacity="0.6" />
    <text x="18" y="24" font-size="18" text-anchor="middle">⚡</text>

    <!-- Header Titles -->
    <text x="48" y="18" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700">Statistik Kemampuan &amp; Distribusi Kode</text>
    <text x="48" y="34" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Dihitung otomatis secara realtime dari seluruh repositori publik GitHub</text>
  </g>

  <!-- Divider Line -->
  <line x1="30" y1="68" x2="${width - 30}" y2="68" stroke="#334155" stroke-width="1" stroke-opacity="0.5" />

  <!-- Rows -->
  ${rowsSvg}

  <!-- Footer Info -->
  <text x="${width - 30}" y="${height - 14}" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" text-anchor="end">Terakhir diperbarui: ${nowFormatted} • Diupdate setiap hari via GitHub Actions</text>
</svg>`;
}

async function main() {
  console.log(`Memulai kalkulasi statistik untuk user: ${USERNAME}...`);
  const repos = await getAllRepos();
  console.log(`Ditemukan ${repos.length} repository publik (non-fork).`);

  const totals = {};
  for (const repo of repos) {
    try {
      const langs = await getLanguageBytes(repo);
      for (const [lang, bytes] of Object.entries(langs)) {
        totals[lang] = (totals[lang] || 0) + bytes;
      }
    } catch (err) {
      console.warn(`Lewati ${repo.name}: ${err.message}`);
    }
  }

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);
  const ranked = Object.entries(totals)
    .map(([lang, bytes]) => ({
      name: lang,
      bytes: bytes,
      percent: Math.round((bytes / grandTotal) * 100),
    }))
    .filter((item) => item.percent > 0)
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 8); // Ambil top 8 bahasa

  console.log("Top languages:", ranked);

  // 1. Tulis file SVG animasi
  const svgContent = generateSvgCard(ranked, grandTotal);
  fs.mkdirSync(path.dirname(SVG_OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(SVG_OUTPUT_PATH, svgContent, "utf8");
  console.log(`Berhasil membuat file SVG animasi: ${SVG_OUTPUT_PATH}`);

  // 2. Buat tabel progress interaktif untuk README.md
  const tableRows = ranked.map((item) => {
    const theme = LANGUAGE_THEMES[item.name] || LANGUAGE_THEMES.Default;
    const cleanHex = theme.primary.replace("#", "");
    // Badge progress visual
    const badgeUrl = `https://progress-bar.xyz/${item.percent}/?title=&width=220&color=${cleanHex}&suffix=%25`;
    return `| **${item.name}** | ![](${badgeUrl}) | \`${item.percent}%\` |`;
  });

  const nowFormatted = new Date().toISOString().slice(0, 10);
  const markdownSection = [
    '<div align="center">',
    "",
    '  <img src="img/language-progress.svg" alt="Statistik Bahasa Pemrograman & Progress" width="100%" />',
    "",
    "  <details>",
    "    <summary><b>📊 Klik di sini untuk melihat tabel rincian data</b></summary>",
    "",
    "| Bahasa / Teknologi | Indikator Progress | Persentase |",
    "|---|:---:|:---:|",
    ...tableRows,
    "",
    `*Terakhir diperbarui otomatis: ${nowFormatted} — dihitung dari seluruh repository publik.*`,
    "",
    "  </details>",
    "</div>",
  ].join("\n");

  const readme = fs.readFileSync(README_PATH, "utf8");
  const startIdx = readme.indexOf(START_MARKER);
  const endIdx = readme.indexOf(END_MARKER);

  if (startIdx === -1 || endIdx === -1) {
    throw new Error(
      `Marker ${START_MARKER} / ${END_MARKER} tidak ditemukan di README.md`
    );
  }

  const updatedReadme =
    readme.slice(0, startIdx + START_MARKER.length) +
    "\n\n" +
    markdownSection +
    "\n\n" +
    readme.slice(endIdx);

  fs.writeFileSync(README_PATH, updatedReadme, "utf8");
  console.log("README.md berhasil diperbarui dengan komponen progres terbaru.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
