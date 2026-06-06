import { type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { type, teamData } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "AIzaSy_YOUR_KEY_HERE" || apiKey.includes("YOUR_KEY")) {
      return Response.json(
        { error: "API_KEY_NOT_CONFIGURED", message: "Gemini API key is not configured in .env.local" },
        { status: 400 }
      );
    }

    if (!type || !teamData) {
      return Response.json(
        { error: "INVALID_PARAMETERS", message: "Type or teamData is missing" },
        { status: 400 }
      );
    }

    let systemPrompt = "";
    if (type === "tactics") {
      systemPrompt = `你是一个华尔街量化对冲精算师。请拆解以下提供的球队赛事数据，分析当晚机构风控陷阱。
请用通俗的大白话给出一份避坑指南。
要求：
1. 字数严格限制在 80 字以内。
2. 绝对不能使用任何博彩、赔率、下注、吃单、买球、Bet365、Bwin等敏感字眼，而必须使用“机构量化风险对冲概率指数”、“全球风控精算大盘”、“AI风控避坑策略”、“量化对冲”等专业术语代替。
3. 直接输出指南内容，不要包含任何 markdown 格式标记或引号。`;
    } else if (type === "metaphysics") {
      systemPrompt = `你是一个融合了大数据的赛博紫微斗数大师。请结合以下球队信息与开球流时星盘。
请给出 2 行以内的惊悚玄学化忌批命。
要求：
1. 字数限制在两行以内。
2. 语气要惊悚、玄妙，充满赛博修仙与五行易理。
3. 绝对不能包含博彩、赔率、下注、买球等任何敏感词汇。
4. 直接输出批命内容，不要包含任何 markdown 格式标记或引号。`;
    } else {
      return Response.json({ error: "INVALID_TYPE", message: "Invalid type parameter" }, { status: 400 });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${systemPrompt}
                  
当前球队/赛事数据：
国家: ${teamData.name} (${teamData.code})
主教练: ${teamData.coach}
比赛场馆: ${teamData.stadium}
近期状态: ${teamData.recentForm?.map((f: any) => `${f.opponent}: ${f.result} (${f.score})`).join(", ") || "暂无"}
指数状态: 主场成功系数: ${teamData.odds?.homeWin || "无"}, 客场成功系数: ${teamData.odds?.awayWin || "无"}
伤情: ${teamData.injuries?.map((i: any) => `${i.name}(${i.reason})`).join(", ") || "无"}`
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
    }

    const resData = await response.json();
    const responseText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    // 做一次后置清洗，防止 Gemini 输出带有博彩相关违规词
    let cleanedText = responseText.trim();
    cleanedText = cleanedText.replace(/博彩/g, "风险对冲");
    cleanedText = cleanedText.replace(/赔率/g, "量化对冲系数");
    cleanedText = cleanedText.replace(/下注/g, "建立对冲头寸");
    cleanedText = cleanedText.replace(/吃单/g, "流动性承接");
    cleanedText = cleanedText.replace(/买球/g, "配置风险敞口");
    cleanedText = cleanedText.replace(/Bet365/gi, "全球风控精算大盘A");
    cleanedText = cleanedText.replace(/Bwin/gi, "全球风控精算大盘B");

    return Response.json({ text: cleanedText });
  } catch (error: any) {
    console.error("Gemini API Route Error:", error);
    return Response.json(
      { error: "GEMINI_API_ERROR", message: error.message || "Unknown error occurred" },
      { status: 500 }
    );
  }
}
