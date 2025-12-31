import axios from "axios";
import * as cheerio from "cheerio";

export interface ScrapedData {
    url: string;
    title: string;
    h1: string;
    h2s: string[];
    metaDescription: string;
    ctaButtons: string[];
    mainText: string;
}

const TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2;

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<string> {
    try {
        const response = await axios.get(url, {
            timeout: TIMEOUT,
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; ConversionBot/1.0)",
            },
            maxRedirects: 5,
        });

        return response.data;
    } catch (error: any) {
        if (retries > 0 && (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT")) {
            console.log(`Retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s before retry
            return fetchWithRetry(url, retries - 1);
        }
        throw error;
    }
}

export async function scrapePage(url: string): Promise<ScrapedData> {
    try {
        // Ensure protocol
        if (!url.startsWith("http")) {
            url = "https://" + url;
        }

        // Fetch HTML with retry logic
        const html = await fetchWithRetry(url);

        const $ = cheerio.load(html);

        // Remove scripts, styles, and ads
        $("script, style, noscript, iframe, .ad, .advertisement").remove();

        // Extract data
        const title = $("title").text().trim() || "";
        const metaDescription =
            $('meta[name="description"]').attr("content")?.trim() || "";

        const h1 = $("h1").first().text().trim() || "";
        const h2s = $("h2")
            .map((_, el) => $(el).text().trim())
            .get()
            .filter((text) => text.length > 0)
            .slice(0, 5);

        const ctaButtons = $("button, a.btn, a.button, input[type='submit']")
            .map((_, el) => $(el).text().trim())
            .get()
            .filter((text) => text.length > 0)
            .slice(0, 10);

        // Extract main text (limit to 3000 chars)
        const mainText = $("body")
            .text()
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 3000);

        return {
            url,
            title,
            h1,
            h2s,
            metaDescription,
            ctaButtons,
            mainText,
        };
    } catch (error: any) {
        console.error("Scraping error:", error);

        let message = error.message;
        if (error.code === 'ENOTFOUND') {
            message = "Website not found or unreachable. Please check the URL.";
        } else if (error.code === 'ECONNABORTED') {
            message = "Connection timed out. The website took too long to respond.";
        }

        throw new Error(`Failed to scrape ${url}: ${message}`);
    }
}
