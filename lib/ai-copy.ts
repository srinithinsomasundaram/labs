// Add generateCopy function for Pro users
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ScrapedData } from "./scraper";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateCopy(scrapedData: ScrapedData) {
  // Use gemini-2.0-flash for better performance and structured output support
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
You are an elite conversion copywriter (think David Ogilvy meets Eugene Schwartz).
Analyze this landing page and re-engineer its messaging for MAXIMUM conversion rate.

Context:
- URL: ${scrapedData.url}
- H1: ${scrapedData.h1}
- Meta: ${scrapedData.metaDescription}
- Body: ${scrapedData.mainText.slice(0, 3000)}

Your Task:
1. Identify the core user desire and the biggest objection.
2. Rewrite the copy using simple, punchy, benefit-first language. 
3. Avoid "corporate fluff" (e.g., "empowering synergy"). Use "You" focused language.
4. Apply the "Rule of One": One reader, one offer, one big promise.
5. Provide a sophisticated Placement Strategy: Tell them exactly where to place primary versus secondary CTAs based on scroll depth and user intent (e.g., Above the fold, after value props, near demo sections).

Your Output MUST be a valid JSON object with the following structure:

{
  "diagnosis": {
    "headline_weakness": "Brutal, honest critique of user's H1 (1 sentence).",
    "cta_weakness": "Why the current CTA fails to compel action (1 sentence)."
  },
  "headlines": [
    { "option": "Clear & Direct Headline (What is it?)", "tag": "Clarity" },
    { "option": "Outcome/Benefit Headline (What do I get?)", "tag": "Benefit" },
    { "option": "The 'How Without What' Hook", "tag": "Hook" },
    { "option": "Social Proof / Authority Headline", "tag": "Authority" },
    { "option": "Risk-Reversal / Guarantee Headline", "tag": "Trust" }
  ],
  "subheadlines": [
    "Option 1: Amplifies the big promise.",
    "Option 2: Kills the #1 objection.",
    "Option 3: Adds specific credibility/numbers."
  ],
  "value_props": [
    "Hook 1: Benefit",
    "Hook 2: Benefit",
    "Hook 3: Benefit"
  ],
  "ctas": {
    "primary": ["High-Intent CTA 1", "High-Intent CTA 2", "High-Intent CTA 3"],
    "secondary": ["Low-Risk CTA 1", "Low-Risk CTA 2"],
    "explanation": "Brief psycho-analysis of why these specific words trigger clicks."
  },
  "placement": "Specific, multi-step strategic advice on where to place the primary CTA (high-intent) versus secondary CTA (nurturing) for maximum conversion."
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Since we requested JSON, it should be parseable directly
    return JSON.parse(text);

  } catch (error) {
    console.error("AI Copy generation error:", error);
    // Return a safe fallback structure if AI fails
    return {
      diagnosis: {
        headline_weakness: "Current headline lacks clear value proposition.",
        cta_weakness: "Current CTA is generic and low-urgency."
      },
      headlines: [
        { option: "Transform Your Business Results Today", tag: "Benefit-Driven" },
        { option: "The Secret to Faster Growth", tag: "Curiosity" },
        { option: "Join 10,000+ Market Leaders", tag: "Social Proof" },
        { option: "Guaranteed Results or You Don't Pay", tag: "Trust" }
      ],
      subheadlines: [
        "Stop wasting time on manual tasks. Automate meaningful work.",
        "Trusted by Fortune 500 companies worldwide.",
        "No credit card required. Cancel anytime."
      ],
      value_props: [
        "Simplify your workflow instantly",
        "Cut costs by 50%",
        "Launch in minutes, not days"
      ],
      ctas: {
        primary: ["Get Started Free", "Start Now", "Launch Campaign"],
        secondary: ["View Pricing", "Learn More", "Talk to Sales"],
        explanation: "Action-oriented verbs reduce friction and increase click-through rates."
      },
      placement: "Place primary CTAs above the fold and after each value proposition to capture high-intent users. Use secondary CTAs near the demo video and features section to nurture leads who need more convincing."
    };
  }
}
