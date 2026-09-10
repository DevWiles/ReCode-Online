import { existsSync } from "node:fs";

import type { LeetCodeQuestionData } from "@/types";

/**
 * leetcode.cn sits behind a Cloudflare challenge that plain fetch cannot pass
 * from a datacentre IP. Driving a real Chrome does pass it, so the problem page
 * is opened in one and the data is read straight out of it.
 *
 * Chrome is only started when the direct request has already failed, and it is
 * closed again as soon as the data is out.
 */

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter((path): path is string => Boolean(path));

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const PAGE_TIMEOUT = 45_000;

const findChrome = () => CHROME_CANDIDATES.find((path) => existsSync(path));

const QUESTION_QUERY = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionFrontendId
      title
      translatedTitle
      difficulty
      topicTags {
        name
        translatedName
      }
    }
  }
`;

export const fetchQuestionViaBrowser = async (
  pageUrl: string,
  titleSlug: string
): Promise<LeetCodeQuestionData | null> => {
  const executablePath = findChrome();
  if (!executablePath) {
    console.warn("LeetCode browser fetch skipped: no Chrome binary found");
    return null;
  }

  // Everything below has to stay inside the try: a failure to load the module
  // or to start Chrome must degrade to the next source, not reject the action
  let browser: Awaited<
    ReturnType<typeof import("playwright-core").chromium.launch>
  > | null = null;

  try {
    const { chromium } = await import("playwright-core");

    browser = await chromium.launch({
      executablePath,
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    });

    const page = await browser.newPage({ userAgent: BROWSER_UA });

    // Nothing visual is needed, and skipping it roughly halves the load time
    await page.route("**/*", (route) => {
      const type = route.request().resourceType();
      return type === "image" || type === "media" || type === "font"
        ? route.abort()
        : route.continue();
    });

    await page.goto(pageUrl, {
      waitUntil: "domcontentloaded",
      timeout: PAGE_TIMEOUT,
    });

    // The page ships the question inside __NEXT_DATA__, so usually no second
    // request is needed at all
    const embedded = await page.evaluate(() => {
      const node = document.getElementById("__NEXT_DATA__");
      if (!node?.textContent) return null;

      try {
        const parsed = JSON.parse(node.textContent);
        const queries =
          parsed?.props?.pageProps?.dehydratedState?.queries ?? [];

        for (const query of queries) {
          const question = query?.state?.data?.question;
          if (question?.questionFrontendId) return question;
        }
      } catch {
        return null;
      }

      return null;
    });

    // Falling back to the API from inside the page: the browser already holds
    // the clearance cookie, and POSTs additionally need the CSRF token
    const question =
      embedded ??
      (await page.evaluate(async (query) => {
        const csrf = document.cookie.match(/csrftoken=([^;]+)/)?.[1] ?? "";

        const response = await fetch("https://leetcode.cn/graphql", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-csrftoken": csrf,
            Referer: location.href,
          },
          body: JSON.stringify({ query, variables: { titleSlug: location.pathname.split("/")[2] } }),
        });

        if (!response.ok) return null;

        const json = await response.json();
        return json?.data?.question ?? null;
      }, QUESTION_QUERY));

    if (!question?.questionFrontendId) return null;

    return {
      questionFrontendId: question.questionFrontendId,
      title: question.title,
      translatedTitle: question.translatedTitle,
      difficulty: question.difficulty,
      topicTags: question.topicTags ?? [],
    };
  } catch (error) {
    console.error(`LeetCode browser fetch failed for ${titleSlug}:`, error);
    return null;
  } finally {
    await browser?.close().catch(() => {});
  }
};
