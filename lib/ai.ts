import { GoogleGenerativeAI } from "@google/generative-ai";
import { ScrapedData } from "./scraper";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy");

// Helper to safely parse AI JSON output
function parseAIJson(text: string) {
  let cleaned = text.trim();

  // 1. Strip markdown code blocks if present
  if (cleaned.includes("```json")) {
    cleaned = cleaned.split("```json")[1].split("```")[0].trim();
  } else if (cleaned.includes("```")) {
    cleaned = cleaned.split("```")[1].split("```")[0].trim();
  }

  // 2. Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // 3. Attempt to find the first '{' and last '}' and slice
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const sliced = cleaned.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(sliced);
      } catch (innerE) {
        // 4. Final attempt: clean control characters from sliced content
        const ultraCleaned = sliced.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
        try {
          return JSON.parse(ultraCleaned);
        } catch (finalE) {
          console.error("Critical JSON Parse Failure (Sliced):", sliced);
          throw new Error("AI returned invalid JSON format");
        }
      }
    }

    console.error("Critical JSON Parse Failure (Original):", cleaned);
    throw new Error("AI returned invalid JSON format");
  }
}

export async function analyzePage(data: ScrapedData) {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("No GEMINI_API_KEY found. Returning mock data.");
    return {
      score: 4.2,
      summary: "Your landing page feels like a passive brochure rather than a high-intent conversion engine. You are leaking revenue at the 'Consideration' stage.",
      audit_items: [
        { category: "Traffic Match", status: "⚠️", analysis: "Messaging is too generic for high-intent traffic.", fix: "Align H1 with specific pain points of your primary ad source.", why: "Relevance reduces bounce rate instantly." },
        { category: "Above-the-Fold Clarity", status: "❌", analysis: "The 5-second test fails; the 'Unique Mechanism' is hidden.", fix: "Replace vague hero copy with a 'State of the Art' benefit statement.", why: "Clarity trumps persuasion every time." },
        { category: "Unique Value Proposition", status: "⚠️", analysis: "Weak differentiation from existing market leaders.", fix: "Add a 'Conversion Anchor' — why you specifically?", why: "Cognitive ease requires clear choices." },
        { category: "CTA Engineering", status: "❌", analysis: "Button labels are 'Friction-driven' (e.g. Submit).", fix: "Switch to 'Value-driven' labels (e.g. Get My Free Report).", why: "Micro-copy dictates macro-results." },
        { category: "Friction Removal", status: "✅", analysis: "Simplified form fields are good.", fix: "Continue minimizing input fields.", why: "Lower cognitive load = higher completion." },
        { category: "Social Proof & Trust", status: "❌", analysis: "No authority signals or social proof visible.", fix: "Add 'As seen on' logos or user testimonials above the fold.", why: "Trust is a prerequisite for conversion." },
        { category: "Psychological Triggers", status: "⚠️", analysis: "Missing urgency or a specific 'Price Anchor'.", fix: "Implement a genuine 'Time-sensitive' bonus.", why: "Loss aversion drives faster decision making." },
        { category: "Mobile Conversion", status: "✅", analysis: "Responsive layout is solid.", fix: "Test tap target sizes for thumb accessibility.", why: "Mobile users have lower tolerance for friction." },
        { category: "Conversion Path Flow", status: "⚠️", analysis: "The 'Next Logical Step' is obscured by nav links.", fix: "Remove the header navigation on the landing page.", why: "Eliminating exits boosts campaign ROI." },
        { category: "Data & Tracking", status: "❌", analysis: "No evidence of behavioral tracking (Hotjar/GA).", fix: "Install GA4 and Event Tracking immediately.", why: "You cannot optimize what you do not measure." },
        { category: "AI & Automation", status: "❌", analysis: "Manual lead processing adds 12h+ friction.", fix: "Add an AI qualification agent to capture leads 24/7.", why: "Speed-to-lead is a top conversion multiplier." }
      ],
      quick_wins: [
        "Change primary CTA color to high-contrast orange.",
        "Remove navigation links from the landing page header.",
        "Add a 100% Money-Back Guarantee badge below the CTA.",
        "Replace 'Welcome' in H1 with your #1 outcome-based benefit.",
        "Add one powerful testimonial with a headshot near the hero."
      ],
      roadmap_to_100: {
        "phase_1": {
          "title": "Phase 1: The Foundation (Immediate Quick-Wins)",
          "tasks": ["Implement outcome-focused H1", "Add visual trust signals", "Fix mobile tap targets"]
        },
        "phase_2": {
          "title": "Phase 2: Optimization (Structural Copy & Design)",
          "tasks": ["Rewrite sub-headers using PAS", "Implement the 'Rule of One'", "Remove excess navigation leaks"]
        },
        "phase_3": {
          "title": "Phase 3: Scaling (Advanced Behavioral Triggers)",
          "tasks": ["Add scarcity/urgency mechanisms", "Implement behavioral tracking", "Personalize copy per traffic source"]
        }
      },
      seo_analysis: {
        score: 4.8,
        diagnosis: "Meta tags are technically present but strategically weak. Keyword saturation for 'high-intent' terms is below 0.5%. Header hierarchy is fragmented.",
        keywords: [
          { term: "Conversion Engineering", intent: "Commercial", value: "High" },
          { term: "CRO Audit Tool", intent: "Transactional", value: "High" },
          { term: "Landing Page Optimization", intent: "Informational", value: "Medium" }
        ],
        fixes: [
          "Rewrite Meta Title to include 'Conversion Engineering' as the primary hook.",
          "Optimize H2 sub-headers with secondary LSI keywords.",
          "Improve image alt-text with contextually relevant descriptions."
        ]
      },
      competitor_analysis: [
        {
          competitor: "Stripe",
          what_they_do_better: "Perfect 'Clarity-first' documentation and 'Value-driven' CTA flow.",
          how_to_apply: "Adopt their minimal layout and focus on the technical 'How it Works' visually."
        },
        {
          competitor: "Notion",
          what_they_do_better: "Excellent use of community social proof and templates as 'low-friction' entries.",
          how_to_apply: "Offer a free 'Starter Template' or asset to capture top-of-funnel leads."
        }
      ]
    };
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = `
    You are an Elite Conversion Engineer and world-class CRO (Conversion Rate Optimization) strategist. 
    Your approach combines direct-response copywriting, behavioral psychology (Fogg Behavior Model, Cialdini's 6 Principles), and conversion engineering frameworks.
    
    Your goal is to perform a brutal, data-driven audit of the provided landing page content. 
    High conversion is the result of RELEVANCE, CLARITY, VALUE, and URGENCY while minimizing DISTRACTION and ANXIETY (The Lift Model).

    CONTEXT FOR THIS AUDIT:
    URL: ${data.url}
    Title: ${data.title}
    H1 (Headline): ${data.h1}
    H2s (Subheaders): ${data.h2s.join(", ")}
    Meta Description: ${data.metaDescription}
    CTAs (Buttons found): ${data.ctaButtons.join(", ")}
    Content Snippet: ${data.mainText.slice(0, 4000)}

    DIAGNOSTIC MANDATE:
    1. Identify the "Conversion Killer" — the #1 thing preventing this page from scaling.
    2. Evaluate "The 5-Second Test" — is it immediately clear what is being offered and to whom?
    3. Analyze the "Cognitive Load" — is the page too busy or confusing?
    4. Assess the "Messy Middle" — are you educating the user enough to make a decision?

    AUDIT CRITERIA (11 CORE MODULES):
    1. Traffic Match: Does the message align with the likely search intent?
    2. Above-the-Fold Clarity: Is the value prop visible without scrolling?
    3. Unique Value Proposition: Why should someone pick you over a better-funded competitor?
    4. CTA Engineering: Do the buttons use "Value-Driven" labels instead of "Friction-Driven" labels?
    5. Friction Removal: Are there too many fields, links, or distractions?
    6. Social Proof & Trust: Is the credibility earned or claimed?
    7. Psychological Triggers: Are you using Scarcity, Urgency, or Authority effectively?
    8. Mobile Conversion: Is the mobile experience a streamlined version or just "smaller"?
    9. Conversion Path Flow: Is the next step logically obvious?
    10. Data & Tracking: Are they measuring the right inputs?
    11. AI/Automation: How could AI reduce friction in their current process?

    OUTPUT SPECIFICATIONS:
    - Be brutally honest. If the copy is "synergy-fluff," call it out.
    - Provide "Actionable Fixes" (e.g., "Change H1 to: [Specific Suggestion]").
    - Ensure the 'score' reflects the difficulty of actually converting a stranger.

    Your Output MUST be a valid JSON object matching this structure EXACTLY:
    {
      "score": number (0-10, one decimal place),
      "summary": "Brutal, one-sentence executive summary.",
      "audit_items": [
        {
          "category": "Traffic Match",
          "status": "✅" | "⚠️" | "❌",
          "analysis": "Professional critique using CRO terminology.",
          "fix": "Specific, implementable instruction.",
          "why": "The psychological or conversion principle behind this fix."
        }
        // ... (Include ALL 11 categories)
      ],
      "quick_wins": [ "Top priority win", "2", "3", "4", "5" ],
      "roadmap_to_100": {
        "phase_1": {
          "title": "Phase 1: The Foundation (Immediate Quick-Wins)",
          "tasks": ["Task 1", "Task 2", "Task 3"]
        },
        "phase_2": {
          "title": "Phase 2: Optimization (Structural Copy & Design)",
          "tasks": ["Task 1", "Task 2", "Task 3"]
        },
        "phase_3": {
          "title": "Phase 3: Scaling (Advanced Behavioral Triggers)",
          "tasks": ["Task 1", "Task 2", "Task 3"]
        }
      },
      "seo_analysis": {
        "score": number (0-10),
        "diagnosis": "Professional SEO audit of meta tags, headers, and keyword saturation.",
        "keywords": [
          { "term": "Keyword", "intent": "Informational|Commercial|Transactional", "value": "High|Medium|Low" }
        ],
        "fixes": ["Fix 1", "Fix 2"]
      },
      "competitor_analysis": [
        {
          "competitor": "Industry Leader Name",
          "what_they_do_better": "Specific move.",
          "how_to_apply": "How to ethically steal."
        }
      ]
    }
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return parseAIJson(response.text());
}

export async function generateCopy(data: ScrapedData) {
  if (!process.env.GEMINI_API_KEY) {
    return {
      diagnosis: {
        headline_weakness: "Your current headline describes features, not outcomes. It forces the user to think.",
        cta_weakness: "Button text 'Submit' is passive. It implies work, not value.",
      },
      headlines: [
        { option: "Get More Leads From Your Website Without Increasing Ad Spend", tag: "Outcome-focused" },
        { option: "Turn Your Website Into a 24/7 Lead Generation Machine", tag: "Clarity-first" },
        { option: "Your Website Isn’t the Problem — Your Message Is", tag: "CRO-approved" }
      ],
      subheadlines: [
        "We analyze your website and tell you exactly what to fix to increase conversions.",
        "No redesign. No guesswork. Just clear, actionable improvements."
      ],
      ctas: {
        primary: ["Get My Free Conversion Audit", "Show Me How to Get More Leads", "Improve My Website Today"],
        secondary: ["See How It Works", "View Sample Report"],
        explanation: "These CTAs reduce friction and increase click intent by focusing on the immediate benefit."
      },
      placement: "Use Headline #1 above the fold. Place CTA #2 below the benefits section. Repeat the primary CTA before the footer."
    };
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `
    You are an Elite Conversion Copywriter. Your work is inspired by legends like Eugene Schwartz, Claude Hopkins, and modern masters like Joanna Wiebe (CopyHackers).
    
    Your goal is to re-engineer the messaging architecture of the website provided.
    Don't just write "better" copy. Write copy that exploits psychological gaps, reduces cognitive load, and moves the user to action using the Rule of One.

    INPUT DATA:
    URL: ${data.url}
    Current H1: ${data.h1}
    CTAs: ${data.ctaButtons.join(", ")}
    Body Content: ${data.mainText.slice(0, 3000)}

    MANDATE:
    1. Identify the 'Core Desire' of the target audience.
    2. Identify the 'Primary Friction' point in the current copy.
    3. Revise using frameworks like PAS (Problem-Agitation-Solution), AIDA, or Benefit-First hooks.

    STRUCTURE YOUR OUTPUT AS JSON:
    {
      "diagnosis": {
        "headline_weakness": "Brutal critique of why the current H1 fails to convert (e.g., focuses on features instead of outcomes).",
        "cta_weakness": "Why the current CTA label doesn't trigger a click (e.g., low-value verb or too much friction)."
      },
      "headlines": [
        { "option": "The PAS Hook (Problem-Agitation-Solution)", "tag": "PAS Framework" },
        { "option": "The Big Promise (Pure Outcome)", "tag": "Benefit-Driven" },
        { "option": "The 'How to' without the 'Pain' Hook", "tag": "Hook" }
      ],
      "subheadlines": [
        "Amplifies the core promise by adding proof or removing a major objection.",
        "Specific subheader that clarifies the unique mechanism of the solution."
      ],
      "ctas": {
        "primary": ["Value-driven Action (e.g., Join 5k+ others)", "Momentum Action (e.g., Get my report)"],
        "secondary": ["Low-friction entry (e.g., Watch how it works)", "Social proof entry (e.g., See results)"],
        "explanation": "Why these specific words satisfy the user's psychological intent."
      },
      "placement": "Strategic advice on layout and visual hierarchy for these copy elements."
    }
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return parseAIJson(response.text());
}
