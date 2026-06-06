import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

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

// 2026 美加墨世界杯 104 场核心模拟交战大盘（在真实 API 缺省时提供逼真的赛程）
const MOCK_FIXTURES = [
  {
    fixtureId: 202601,
    date: "2026-06-11T18:00:00Z", // 揭幕战北京时间凌晨 (美加墨当地时间下午)
    homeTeam: "USA", homeFlag: "🇺🇸", homeCode: "USA", homeScore: 2,
    awayTeam: "Uruguay", awayFlag: "🇺🇾", awayCode: "URU", awayScore: 1,
    minute: 78, statusShort: "2H", statusLong: "下半场进行中", venue: "MetLife Stadium"
  },
  {
    fixtureId: 202602,
    date: "2026-06-11T21:00:00Z",
    homeTeam: "Canada", homeFlag: "🇨🇦", homeCode: "CAN", homeScore: 0,
    awayTeam: "Germany", awayFlag: "🇩🇪", awayCode: "GER", awayScore: 0,
    minute: 34, statusShort: "1H", statusLong: "上半场进行中", venue: "Estadio Azteca"
  },
  {
    fixtureId: 202603,
    date: "2026-06-12T18:00:00Z",
    homeTeam: "Brazil", homeFlag: "🇧🇷", homeCode: "BRA", homeScore: null,
    awayTeam: "Spain", awayFlag: "🇪🇸", awayCode: "ESP", awayScore: null,
    minute: null, statusShort: "NS", statusLong: "未开赛", venue: "BC Place Stadium"
  },
  {
    fixtureId: 202604,
    date: "2026-06-12T21:00:00Z",
    homeTeam: "Argentina", homeFlag: "🇦🇷", homeCode: "ARG", homeScore: null,
    awayTeam: "France", awayFlag: "🇫🇷", awayCode: "FRA", awayScore: null,
    minute: null, statusShort: "NS", statusLong: "未开赛", venue: "Mercedes-Benz Stadium"
  },
  {
    fixtureId: 202605,
    date: "2026-06-13T19:00:00Z",
    homeTeam: "Mexico", homeFlag: "🇲🇽", homeCode: "MEX", homeScore: null,
    awayTeam: "England", awayFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", awayCode: "ENG", awayScore: null,
    minute: null, statusShort: "NS", statusLong: "未开赛", venue: "Estadio BBVA"
  }
];

const MOCK_INJURIES: Record<string, Array<{ player: string; position: string; reason: string; severity: string }>> = {
  USA: [
    { player: "Christian Pulisic", position: "前锋", reason: "大腿肌肉拉伤", severity: "轻度 (每日观察)" },
    { player: "Tyler Adams", position: "中场", reason: "膝盖韧带拉伤", severity: "中度 (预计缺席1周)" }
  ],
  Mexico: [
    { player: "Edson Álvarez", position: "中场", reason: "腿筋撕裂", severity: "重度 (预计缺席3周)" }
  ]
};

// 后置敏感词严格过滤清洗
function cleanSensitiveWords(text: string): string {
  return text
    .replace(/博彩/g, "量化对冲")
    .replace(/赔率/g, "机构量化风险对冲概率指数")
    .replace(/下注/g, "配置风险头寸")
    .replace(/吃单/g, "流动性承接")
    .replace(/买球/g, "风险敞口管理")
    .replace(/Bet365/gi, "全球风控精算大盘A")
    .replace(/Bwin/gi, "全球风控精算大盘B");
}

function createCleanResponse(data: any, init?: ResponseInit) {
  const jsonString = JSON.stringify(data);
  const cleanedString = cleanSensitiveWords(jsonString);
  return new Response(cleanedString, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const fixtureId = searchParams.get("fixtureId");
  const teamId = searchParams.get("teamId");

  const apiKey = process.env.FOOTBALL_API_KEY;
  const hasKey = apiKey && apiKey !== "YOUR_API_FOOTBALL_KEY_HERE" && !apiKey.includes("YOUR_KEY");

  // 1. 获取交战大盘或实时滚球日程 (type = live | type = fixtures)
  if (type === "live" || type === "fixtures") {
    if (!hasKey) {
      return createCleanResponse({ fixtures: MOCK_FIXTURES, degraded: true, reason: "FOOTBALL_API_KEY 未配置，使用精算模拟交战大盘" });
    }

    try {
      // 真实交战大盘：如果是 live 查滚球，如果是 fixtures 查全部世界杯赛程
      const endpoint = type === "live" 
        ? `https://v3.football.api-sports.io/fixtures?live=all&league=${WC_LEAGUE_ID}&season=${WC_SEASON}`
        : `https://v3.football.api-sports.io/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`;

      const res = await fetch(endpoint, {
        headers: {
          "X-RapidAPI-Key": apiKey!,
          "X-RapidAPI-Host": "v3.football.api-sports.io",
        },
        cache: "no-store" // 强行斩断静态缓存
      });

      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      const json = await res.json();
      const rawData = json?.response ?? [];

      if (rawData.length === 0) {
        return createCleanResponse({ fixtures: MOCK_FIXTURES, degraded: true, reason: "API 数据为空，启动高仿真模拟盘口" });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fixtures = rawData.map((item: any) => ({
        fixtureId: item?.fixture?.id,
        date: item?.fixture?.date,
        homeTeam: item?.teams?.home?.name,
        homeFlag: countryToEmoji(item?.teams?.home?.name),
        homeCode: (item?.teams?.home?.name ?? "UNK").slice(0, 3).toUpperCase(),
        homeScore: item?.goals?.home,
        awayTeam: item?.teams?.away?.name,
        awayFlag: countryToEmoji(item?.teams?.away?.name),
        awayCode: (item?.teams?.away?.name ?? "UNK").slice(0, 3).toUpperCase(),
        awayScore: item?.goals?.away,
        minute: item?.fixture?.status?.elapsed ?? null,
        statusShort: item?.fixture?.status?.short ?? "NS",
        statusLong: item?.fixture?.status?.long ?? "未开赛",
        venue: item?.fixture?.venue?.name ?? ""
      }));

      return createCleanResponse({ fixtures, degraded: false });
    } catch (err: any) {
      console.error("[/api/football?type=fixtures] Error:", err);
      return createCleanResponse({ fixtures: MOCK_FIXTURES, degraded: true, error: err.message });
    }
  }

  // 2. 获取实时伤停名单 (type = injuries)
  if (type === "injuries") {
    if (!hasKey) {
      // 优雅降级返回 Mock
      const fallback = teamId && MOCK_INJURIES[teamId] ? MOCK_INJURIES[teamId] : [
        { player: "Key Core Player", position: "中轴核心", reason: "战术风控避险", severity: "轻度 (观察中)" }
      ];
      return createCleanResponse({ injuries: fallback, degraded: true });
    }

    try {
      let url = `https://v3.football.api-sports.io/injuries?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`;
      if (fixtureId) {
        url = `https://v3.football.api-sports.io/injuries?fixture=${fixtureId}`;
      } else if (teamId) {
        url = `https://v3.football.api-sports.io/injuries?team=${teamId}`;
      }

      const res = await fetch(url, {
        headers: {
          "X-RapidAPI-Key": apiKey!,
          "X-RapidAPI-Host": "v3.football.api-sports.io",
        },
        cache: "no-store"
      });

      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      const json = await res.json();
      const rawData = json?.response ?? [];

      if (rawData.length === 0) {
        const fallback = teamId && MOCK_INJURIES[teamId] ? MOCK_INJURIES[teamId] : [
          { player: "Key Core Player", position: "中轴核心", reason: "战术风控避险", severity: "轻度 (观察中)" }
        ];
        return createCleanResponse({ injuries: fallback, degraded: true });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const injuries = rawData.map((item: any) => ({
        player: item?.player?.name ?? "未知球员",
        position: item?.player?.type ?? item?.player?.position ?? "主力",
        reason: item?.injury?.type ?? "伤退",
        severity: item?.injury?.detail ?? "中度 (观察中)"
      }));

      return createCleanResponse({ injuries, degraded: false });
    } catch (err: any) {
      console.error("[/api/football?type=injuries] Error:", err);
      return createCleanResponse({ injuries: [], degraded: true, error: err.message });
    }
  }

  // 3. 获取实时盘口概率 (type = odds)
  if (type === "odds") {
    if (!fixtureId) {
      return createCleanResponse({ error: "Missing fixtureId query parameter" }, { status: 400 });
    }

    if (!hasKey) {
      return createCleanResponse({
        odds: {
          data_source: "全球风控精算大盘A",
          main_success_factor: 2.10,
          draw_factor: 3.20,
          away_success_factor: 3.40,
          theoretical_payout: 95.2
        },
        degraded: true
      });
    }

    try {
      // 抓取该比赛的所有 odds，我们解析 Bet365 (id = 8) 或 Bwin (id = 11)
      const res = await fetch(
        `https://v3.football.api-sports.io/odds?fixture=${fixtureId}`,
        {
          headers: {
            "X-RapidAPI-Key": apiKey!,
            "X-RapidAPI-Host": "v3.football.api-sports.io",
          },
          cache: "no-store"
        }
      );

      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      const json = await res.json();
      const rawData = json?.response ?? [];

      if (rawData.length === 0) {
        return createCleanResponse({
          odds: {
            data_source: "全球风控精算大盘A",
            main_success_factor: 2.15,
            draw_factor: 3.25,
            away_success_factor: 3.10,
            theoretical_payout: 94.8
          },
          degraded: true
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bookmakers = rawData[0]?.bookmakers ?? [];
      const bet365 = bookmakers.find((b: any) => b?.id === 8 || b?.name?.toLowerCase().includes("365"));
      const bwin = bookmakers.find((b: any) => b?.id === 11 || b?.name?.toLowerCase().includes("bwin"));
      const bookmaker = bet365 || bwin || bookmakers[0];

      if (!bookmaker) {
        throw new Error("No bookmaker data available");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const winnerBet = bookmaker?.bets?.find((b: any) => b?.id === 1 || b?.name === "Match Winner");
      if (!winnerBet?.values) {
        throw new Error("No winner odds data available");
      }

      // 可选链与兜底保护，过滤清洗
      const homeVal = parseFloat(winnerBet.values.find((v: any) => v?.value === "Home")?.odd ?? "2.0");
      const drawVal = parseFloat(winnerBet.values.find((v: any) => v?.value === "Draw")?.odd ?? "3.0");
      const awayVal = parseFloat(winnerBet.values.find((v: any) => v?.value === "Away")?.odd ?? "3.0");

      const payout = parseFloat((100 / ((1 / homeVal) + (1 / drawVal) + (1 / awayVal))).toFixed(2));

      let dataSource = "全球风控精算大盘A";
      if (bookmaker.id === 11 || bookmaker.name?.toLowerCase().includes("bwin")) {
        dataSource = "全球风控精算大盘B";
      } else if (bookmaker.id !== 8) {
        dataSource = `全球风控精算大盘C (${bookmaker.name})`;
      }

      return createCleanResponse({
        odds: {
          data_source: dataSource,
          main_success_factor: homeVal,
          draw_factor: drawVal,
          away_success_factor: awayVal,
          theoretical_payout: payout
        },
        degraded: false
      });
    } catch (err: any) {
      console.error("[/api/football?type=odds] Error:", err);
      return createCleanResponse({
        odds: {
          data_source: "全球风控精算大盘A",
          main_success_factor: 2.15,
          draw_factor: 3.25,
          away_success_factor: 3.10,
          theoretical_payout: 94.8
        },
        degraded: true,
        error: err.message
      });
    }
  }

  return createCleanResponse({ error: "Invalid type parameter" }, { status: 400 });
}
