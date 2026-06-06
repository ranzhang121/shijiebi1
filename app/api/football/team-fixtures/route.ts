import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 球队历史赛事缓存 5 分钟（非实时，省配额）
const CACHE_SECONDS = 300;

const WC_LEAGUE_ID = 1;
const WC_SEASON = 2026;

export interface TeamFixture {
  fixtureId: number;
  date: string;          // ISO 日期字符串
  homeTeam: string;
  homeFlag: string;
  homeScore: number | null;
  awayTeam: string;
  awayFlag: string;
  awayScore: number | null;
  league: string;
  round: string;
  statusShort: string;   // 'FT' | 'NS' | '1H' | '2H' 等
  venue: string;
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

  // ── 未配置密钥时降级 ──
  if (!apiKey || apiKey === "YOUR_API_FOOTBALL_KEY_HERE") {
    return NextResponse.json(
      { fixtures: [], degraded: true, reason: "FOOTBALL_API_KEY not configured" },
      { status: 200, headers: { "Cache-Control": "no-store" } }
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fixtures: TeamFixture[] = (json.response ?? []).map((item: any) => ({
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
    return NextResponse.json(
      {
        fixtures: [],
        degraded: true,
        reason: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }
}

// ── 国旗映射（与 live/route.ts 保持一致） ──
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
