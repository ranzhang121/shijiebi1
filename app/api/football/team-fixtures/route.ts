import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 缓存5分钟
const CACHE_SECONDS = 300;

const WC_LEAGUE_ID = 1;
const WC_SEASON = 2026;

// 国旗映射
const FLAG_MAP: Record<string, string> = {
  "United States": "🇺🇸", USA: "🇺🇸", Mexico: "🇲🇽", Canada: "🇨🇦",
  Uruguay: "🇺🇾", Brazil: "🇧🇷", Argentina: "🇦🇷", France: "🇫🇷",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Spain: "🇪🇸", Germany: "🇩🇪", Portugal: "🇵🇹",
  Netherlands: "🇳🇱", Belgium: "🇧🇪", Italy: "🇮🇹", Croatia: "🇭🇷",
  Morocco: "🇲🇦", Japan: "🇯🇵", "South Korea": "🇰🇷", Australia: "🇦🇺",
  Switzerland: "🇨🇭", Denmark: "🇩🇰", Poland: "🇵🇱", Serbia: "🇷🇸",
  Ecuador: "🇪🇨", Senegal: "🇸🇳", Colombia: "🇨🇴", Chile: "🇨🇱",
  Peru: "🇵🇪", "Saudi Arabia": "🇸🇦", Qatar: "🇶🇦", Panama: "🇵🇦",
  "Costa Rica": "🇨🇷", Paraguay: "🇵🇾", Algeria: "🇩🇿", Egypt: "🇪🇬",
  Nigeria: "🇳🇬", Cameroon: "🇨🇲", "Ivory Coast": "🇨🇮", "New Zealand": "🇳🇿",
  Jamaica: "🇯🇲", Turkey: "🇹🇷", Greece: "🇬🇷", Austria: "🇦🇹",
};

function countryToEmoji(name: string): string {
  return FLAG_MAP[name] ?? "🏳️";
}

// 精美真实的赛事历史 Mock 库，用于优雅降级（防空白）
const MOCK_FIXTURES: Record<string, Array<{
  fixtureId: number;
  date: string;
  homeTeam: string;
  homeFlag: string;
  homeScore: number;
  awayTeam: string;
  awayFlag: string;
  awayScore: number;
  league: string;
  round: string;
  statusShort: string;
  venue: string;
}>> = {
  // 美国队 (ID: 2)
  "2": [
    { fixtureId: 201, date: "2026-06-01T20:00:00Z", homeTeam: "USA", homeFlag: "🇺🇸", homeScore: 4, awayTeam: "Jamaica", awayFlag: "🇯🇲", awayScore: 2, league: "美加墨世界杯·热身赛", round: "热身赛", statusShort: "FT", venue: "MetLife Stadium" },
    { fixtureId: 202, date: "2026-05-28T19:30:00Z", homeTeam: "Mexico", homeFlag: "🇲🇽", homeScore: 2, awayTeam: "USA", awayFlag: "🇺🇸", awayScore: 0, league: "中北美金杯赛", round: "决赛", statusShort: "FT", venue: "Estadio Azteca" },
    { fixtureId: 203, date: "2026-03-24T21:00:00Z", homeTeam: "USA", homeFlag: "🇺🇸", homeScore: 1, awayTeam: "Canada", awayFlag: "🇨🇦", awayScore: 1, league: "中北美国家联赛", round: "半决赛", statusShort: "FT", venue: "BMO Field" },
    { fixtureId: 204, date: "2026-03-20T20:00:00Z", homeTeam: "USA", homeFlag: "🇺🇸", homeScore: 2, awayTeam: "Panama", awayFlag: "🇵🇦", awayScore: 0, league: "中北美国家联赛", round: "四分之一决赛", statusShort: "FT", venue: "Mercedes-Benz Stadium" },
    { fixtureId: 205, date: "2026-01-15T18:00:00Z", homeTeam: "Costa Rica", homeFlag: "🇨🇷", homeScore: 1, awayTeam: "USA", awayFlag: "🇺🇸", awayScore: 3, league: "国际友谊赛", round: "友谊赛", statusShort: "FT", venue: "Estadio Nacional" }
  ],
  // 墨西哥队 (ID: 262)
  "262": [
    { fixtureId: 2621, date: "2026-06-01T20:00:00Z", homeTeam: "Mexico", homeFlag: "🇲🇽", homeScore: 2, awayTeam: "USA", awayFlag: "🇺🇸", awayScore: 0, league: "中北美金杯赛", round: "决赛", statusShort: "FT", venue: "Estadio Azteca" },
    { fixtureId: 2622, date: "2026-05-27T19:30:00Z", homeTeam: "Mexico", homeFlag: "🇲🇽", homeScore: 2, awayTeam: "Honduras", awayFlag: "🇭🇳", awayScore: 1, league: "中北美金杯赛", round: "半决赛", statusShort: "FT", venue: "NRG Stadium" },
    { fixtureId: 2623, date: "2026-03-22T21:00:00Z", homeTeam: "Brazil", homeFlag: "🇧🇷", homeScore: 3, awayTeam: "Mexico", awayFlag: "🇲🇽", awayScore: 2, league: "国际友谊赛", round: "友谊赛", statusShort: "FT", venue: "Maracanã Stadium" },
    { fixtureId: 2624, date: "2026-03-18T20:00:00Z", homeTeam: "Mexico", homeFlag: "🇲🇽", homeScore: 0, awayTeam: "Canada", awayFlag: "🇨🇦", awayScore: 0, league: "中北美国家联赛", round: "小组赛", statusShort: "FT", venue: "Estadio BBVA" },
    { fixtureId: 2625, date: "2026-01-10T18:00:00Z", homeTeam: "Mexico", homeFlag: "🇲🇽", homeScore: 0, awayTeam: "Uruguay", awayFlag: "🇺🇾", awayScore: 4, league: "国际友谊赛", round: "友谊赛", statusShort: "FT", venue: "CenturyLink Field" }
  ],
  // 加拿大队 (ID: 94)
  "94": [
    { fixtureId: 941, date: "2026-06-02T20:00:00Z", homeTeam: "Canada", homeFlag: "🇨🇦", homeScore: 2, awayTeam: "Panama", awayFlag: "🇵🇦", awayScore: 1, league: "国际友谊赛", round: "友谊赛", statusShort: "FT", venue: "BC Place" },
    { fixtureId: 942, date: "2026-05-28T19:30:00Z", homeTeam: "USA", homeFlag: "🇺🇸", homeScore: 1, awayTeam: "Canada", awayFlag: "🇨🇦", awayScore: 1, league: "中北美国家联赛", round: "半决赛", statusShort: "FT", venue: "BMO Field" },
    { fixtureId: 943, date: "2026-03-24T21:00:00Z", homeTeam: "Canada", homeFlag: "🇨🇦", homeScore: 0, awayTeam: "Mexico", awayFlag: "🇲🇽", awayScore: 0, league: "中北美国家联赛", round: "小组赛", statusShort: "FT", venue: "Estadio Azteca" },
    { fixtureId: 944, date: "2026-03-20T20:00:00Z", homeTeam: "Canada", homeFlag: "🇨🇦", homeScore: 3, awayTeam: "Suriname", awayFlag: "🇸🇷", awayScore: 0, league: "中北美国家联赛", round: "小组赛", statusShort: "FT", venue: "BMO Field" },
    { fixtureId: 945, date: "2026-01-15T18:00:00Z", homeTeam: "Argentina", homeFlag: "🇦🇷", homeScore: 2, awayTeam: "Canada", awayFlag: "🇨🇦", awayScore: 0, league: "美洲杯", round: "小组赛", statusShort: "FT", venue: "Mercedes-Benz Stadium" }
  ],
  // 乌拉圭队 (ID: 631)
  "631": [
    { fixtureId: 6311, date: "2026-06-03T20:00:00Z", homeTeam: "Uruguay", homeFlag: "🇺🇾", homeScore: 3, awayTeam: "Colombia", awayFlag: "🇨🇴", awayScore: 2, league: "世预赛南美区", round: "第14轮", statusShort: "FT", venue: "Centenario" },
    { fixtureId: 6312, date: "2026-05-29T19:30:00Z", homeTeam: "Brazil", homeFlag: "🇧🇷", homeScore: 1, awayTeam: "Uruguay", awayFlag: "🇺🇾", awayScore: 1, league: "世预赛南美区", round: "第13轮", statusShort: "FT", venue: "Maracanã" },
    { fixtureId: 6313, date: "2026-03-25T21:00:00Z", homeTeam: "Peru", homeFlag: "🇵🇪", homeScore: 1, awayTeam: "Uruguay", awayFlag: "🇺🇾", awayScore: 0, league: "世预赛南美区", round: "第12轮", statusShort: "FT", venue: "Estadio Nacional" },
    { fixtureId: 6314, date: "2026-03-21T20:00:00Z", homeTeam: "Uruguay", homeFlag: "🇺🇾", homeScore: 0, awayTeam: "Ecuador", awayFlag: "🇪🇨", awayScore: 0, league: "世预赛南美区", round: "第11轮", statusShort: "FT", venue: "Centenario" },
    { fixtureId: 6315, date: "2026-01-12T18:00:00Z", homeTeam: "Mexico", homeFlag: "🇲🇽", homeScore: 0, awayTeam: "Uruguay", awayFlag: "🇺🇾", awayScore: 4, league: "国际友谊赛", round: "友谊赛", statusShort: "FT", venue: "CenturyLink Field" }
  ]
};

// 确定性动态生成器，当 API 赛程为空或未配 key 时，为其他国家队（如英格兰、阿根廷、巴西等）计算高保真模拟赛程
function generateFallbackFixtures(teamId: string): any[] {
  const custom = MOCK_FIXTURES[teamId];
  if (custom) return custom;

  const idNum = parseInt(teamId, 10) || 999;
  const teamNames = ["Brazil", "Argentina", "France", "England", "Spain", "Germany", "Croatia", "Netherlands", "Belgium", "Italy"];
  const teamFlags = ["🇧🇷", "🇦🇷", "🇫🇷", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "🇪🇸", "🇩🇪", "🇭🇷", "🇳🇱", "🇧🇪", "🇮🇹"];
  
  // 选定当前国家名字
  const currentName = teamNames[idNum % teamNames.length];
  const currentFlag = teamFlags[idNum % teamNames.length];

  return Array.from({ length: 5 }, (_, i) => {
    const opponentIdx = (idNum + i * 3 + 1) % teamNames.length;
    const oppName = teamNames[opponentIdx] === currentName ? teamNames[(opponentIdx + 1) % teamNames.length] : teamNames[opponentIdx];
    const oppFlag = teamFlags[opponentIdx] === currentName ? teamFlags[(opponentIdx + 1) % teamNames.length] : teamFlags[opponentIdx];
    
    const isHome = (idNum + i) % 2 === 0;
    const score1 = (idNum + i) % 3;
    const score2 = (idNum + i * 2) % 3;

    return {
      fixtureId: 10000 + idNum * 10 + i,
      date: new Date(2026, 4 - i, 10 + i, 19, 0).toISOString(),
      homeTeam: isHome ? currentName : oppName,
      homeFlag: isHome ? currentFlag : oppFlag,
      homeScore: isHome ? score1 : score2,
      awayTeam: isHome ? oppName : currentName,
      awayFlag: isHome ? oppFlag : currentFlag,
      awayScore: isHome ? score2 : score1,
      league: "世预赛暨国际热身赛",
      round: `小组赛第 ${5 - i} 轮`,
      statusShort: "FT",
      venue: "国际数据中心球场"
    };
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const teamId = searchParams.get("teamId");

  if (!teamId) {
    return NextResponse.json(
      { error: "teamId query parameter is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.FOOTBALL_API_KEY;

  // ── 未配置密钥时：返回高仿真实 Mock 赛事数据（优雅降级） ──
  if (!apiKey || apiKey === "YOUR_API_FOOTBALL_KEY_HERE" || apiKey.includes("YOUR_KEY")) {
    return NextResponse.json(
      { fixtures: generateFallbackFixtures(teamId), degraded: true, reason: "FOOTBALL_API_KEY not configured, using fallback" },
      { status: 200 }
    );
  }

  try {
    const url = new URL("https://v3.football.api-sports.io/fixtures");
    url.searchParams.set("team", teamId);
    url.searchParams.set("league", String(WC_LEAGUE_ID));
    url.searchParams.set("season", String(WC_SEASON));
    url.searchParams.set("last", "5");

    const res = await fetch(url.toString(), {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "v3.football.api-sports.io",
      },
      next: { revalidate: CACHE_SECONDS },
    });

    if (!res.ok) {
      throw new Error(`API-Football responded ${res.status}`);
    }

    const json = await res.json();
    const responseData = json.response ?? [];

    // ── 如果 API-Football 响应为空（例如 2026 世界杯赛程尚未生成）：返回 Mock 赛事 ──
    if (responseData.length === 0) {
      return NextResponse.json(
        { fixtures: generateFallbackFixtures(teamId), degraded: true, reason: "No live fixtures in API yet, using fallback" },
        { status: 200 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fixtures = responseData.map((item: any) => ({
      fixtureId: item.fixture.id,
      date: item.fixture.date,
      homeTeam: item.teams.home.name,
      homeFlag: countryToEmoji(item.teams.home.name),
      homeScore: item.goals.home,
      awayTeam: item.teams.away.name,
      awayFlag: countryToEmoji(item.teams.away.name),
      awayScore: item.goals.away,
      league: item.league.name,
      round: item.league.round ?? "",
      statusShort: item.fixture.status.short,
      venue: item.fixture.venue?.name ?? "",
    }));

    return NextResponse.json(
      { fixtures, degraded: false },
      {
        status: 200,
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=30`,
        },
      }
    );
  } catch (err: unknown) {
    console.error("[/api/football/team-fixtures] Error:", err);
    // 接口出错时也降级返回 Mock，确保系统鲁棒性
    return NextResponse.json(
      {
        fixtures: generateFallbackFixtures(teamId),
        degraded: true,
        reason: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 200 }
    );
  }
}
