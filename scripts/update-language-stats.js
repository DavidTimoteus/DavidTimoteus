// scripts/update-language-stats.js
// Menghitung persentase penggunaan tiap bahasa pemrograman dari SEMUA
// repository publik milik USERNAME, lalu menulis progress bar ke README.md
// di antara marker <!--LANG-STATS-START--> dan <!--LANG-STATS-END-->.

const fs = require("fs");

const USERNAME = process.env.GH_USERNAME; // di-set dari workflow
const TOKEN = process.env.GITHUB_TOKEN;
const README_PATH = "README.md";
const START_MARKER = "<!--LANG-STATS-START-->";
const END_MARKER = "<!--LANG-STATS-END-->";

// Warna khas tiap bahasa (dipakai progress-bar.xyz)
const COLORS = {
  JavaScript: "f7df1e",
  TypeScript: "3178c6",
  PHP: "777bb4",
  HTML: "e34f26",
  CSS: "1572b6",
  Vue: "41b883",
  Blade: "ff2d20",
  Python: "3776ab",
  Java: "b07219",
  Shell: "89e051",
};

async function githubFetch(url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
    },
  });
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
    if (batch.length === 0) break;
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

function buildProgressRow(lang, percent) {
  const color = COLORS[lang] || "94a3b8";
  const url = `https://progress-bar.xyz/${percent}/?title=&width=200&color=${color}&suffix=%25`;
  return `| **${lang}** | ![](${url}) |`;
}

async function main() {
  if (!USERNAME || !TOKEN) {
    throw new Error("GH_USERNAME atau GITHUB_TOKEN belum di-set.");
  }

  const repos = await getAllRepos();
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
    .map(([lang, bytes]) => [lang, Math.round((bytes / grandTotal) * 100)])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8); // ambil 8 bahasa teratas

  const rows = ranked.map(([lang, pct]) => buildProgressRow(lang, pct));

  const table = [
    "<div align=\"center\">",
    "",
    "| Skill | Level |",
    "|---|---|",
    ...rows,
    "",
    `*Terakhir diperbarui otomatis: ${new Date().toISOString().slice(0, 10)} — dihitung dari seluruh repository publik.*`,
    "",
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

  const updated =
    readme.slice(0, startIdx + START_MARKER.length) +
    "\n\n" +
    table +
    "\n\n" +
    readme.slice(endIdx);

  fs.writeFileSync(README_PATH, updated);
  console.log("README.md berhasil diperbarui dengan statistik bahasa terbaru.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
