import { NextResponse } from "next/server";

// ─────────────────────────────────────────────
// 服务端缓存时长（秒）
//   付费版建议: 60  (每分钟更新)
//   免费版建议: 900 (15分钟，保持每天 <100 次请求)
// 可在 .env.local 中设置 LIVE_CACHE_SECONDS=60 覆盖默认值
// ─────────────────────────────────────────────
const CACHE_SECONDS = parseInt(process.env.LIVE_CACHE_SECONDS ?? "60", 10);

// API-Football 世界杯 League ID
// 2026 年 FIFA 世界杯的 league id (赛季 2026)
const WC_LEAGUE_ID = 1;
const WC_SEASON = 2026;

export interface LiveFixture {
  fixtureId: number;
  homeTeam: string;
  homeFlag: string;
  homeCode: string;
  homeScore: number | null;
  awayTeam: string;
  awayFlag: string;
  awayCode: string;
  awayScore: number | null;
  /** 比赛进行分钟数，halftime/未开赛时为 null */
  minute: number | null;
  /** API-Football status short: '1H' | 'HT' | '2H' | 'ET' | 'PEN' | 'FT' | 'NS' 等 */
  statusShort: string;
  statusLong: string;
  venue: string;
}

export async function GET() {
  const apiKey = process.env.FOOTBALL_API_KEY;

  // ── 未配置密钥时返回空列表（优雅降级） ──
  if (!apiKey || apiKey === "YOUR_API_FOOTBALL_KEY_HERE") {
    return NextResponse.json(
      { fixtures: [], degraded: true, reason: "FOOTBALL_API_KEY not configured" },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures?live=all&league=${WC_LEAGUE_ID}&season=${WC_SEASON}`,
      {
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "v3.football.api-sports.io",
        },
        // Next.js 扩展：服务端请求缓存
        next: { revalidate: CACHE_SECONDS },
      }
    );

    if (!res.ok) {
      throw new Error(`API-Football responded ${res.status}`);
    }

    const json = await res.json();

    // ── 解析并标准化响应 ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fixtures: LiveFixture[] = (json.response ?? []).map((item: any) => ({
      fixtureId: item.fixture.id,
      homeTeam: item.teams.home.name,
      homeFlag: countryToEmoji(item.teams.home.name),
      homeCode: item.teams.home.name.slice(0, 3).toUpperCase(),
      homeScore: item.goals.home,
      awayTeam: item.teams.away.name,
      awayFlag: countryToEmoji(item.teams.away.name),
      awayCode: item.teams.away.name.slice(0, 3).toUpperCase(),
      awayScore: item.goals.away,
      minute: item.fixture.status.elapsed ?? null,
      statusShort: item.fixture.status.short,
      statusLong: item.fixture.status.long,
      venue: item.fixture.venue?.name ?? "",
    }));

    return NextResponse.json(
      { fixtures, degraded: false },
      {
        status: 200,
        headers: {
          // 告知 CDN/浏览器缓存时长
          "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=10`,
        },
      }
    );
  } catch (err: unknown) {
    console.error("[/api/football/live] Error:", err);
    // 出错时返回空列表 + 降级标志，不让前端崩溃
    return NextResponse.json(
      {
        fixtures: [],
        degraded: true,
        reason: err instanceof Error ? err.message : "Unknown error",
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}

// ─────────────────────────────────────────────
// 辅助函数：球队名称 → 国旗 Emoji（常见世界杯强队映射）
// API-Football 返回英文队名，转换为对应旗帜
// ─────────────────────────────────────────────
const FLAG_MAP: Record<string, string> = {
  "United States": "🇺🇸",
  USA: "🇺🇸",
  Mexico: "🇲🇽",
  Canada: "🇨🇦",
  Uruguay: "🇺🇾",
  Brazil: "🇧🇷",
  Argentina: "🇦🇷",
  France: "🇫🇷",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Spain: "🇪🇸",
  Germany: "🇩🇪",
  Portugal: "🇵🇹",
  Netherlands: "🇳🇱",
  Belgium: "🇧🇪",
  Italy: "🇮🇹",
  Croatia: "🇭🇷",
  Morocco: "🇲🇦",
  Japan: "🇯🇵",
  "South Korea": "🇰🇷",
  Australia: "🇦🇺",
  Switzerland: "🇨🇭",
  Denmark: "🇩🇰",
  Sweden: "🇸🇪",
  Poland: "🇵🇱",
  Serbia: "🇷🇸",
  Ecuador: "🇪🇨",
  Senegal: "🇸🇳",
  Ghana: "🇬🇭",
  Tunisia: "🇹🇳",
  Colombia: "🇨🇴",
  Chile: "🇨🇱",
  Peru: "🇵🇪",
  "Saudi Arabia": "🇸🇦",
  Iran: "🇮🇷",
  Qatar: "🇶🇦",
  Wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  Austria: "🇦🇹",
  Hungary: "🇭🇺",
  "Czech Republic": "🇨🇿",
  Romania: "🇷🇴",
  Slovakia: "🇸🇰",
  Turkey: "🇹🇷",
  Greece: "🇬🇷",
  Panama: "🇵🇦",
  "Costa Rica": "🇨🇷",
  Honduras: "🇭🇳",
  Paraguay: "🇵🇾",
  Bolivia: "🇧🇴",
  Venezuela: "🇻🇪",
  Algeria: "🇩🇿",
  Egypt: "🇪🇬",
  Nigeria: "🇳🇬",
  Cameroon: "🇨🇲",
  "Ivory Coast": "🇨🇮",
  Mali: "🇲🇱",
  "New Zealand": "🇳🇿",
  Jamaica: "🇯🇲",
};

function countryToEmoji(name: string): string {
  return FLAG_MAP[name] ?? "🏳️";
}
