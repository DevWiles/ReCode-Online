'use server';

import { LEETCODE_LANG_SLUGS } from '@/constants';
import { TAG_MAPPING } from '@/constants/tagMapping';
import {
  fetchCodeSnippetsViaBrowser,
  fetchQuestionViaBrowser,
} from '@/lib/leetcode-browser';

import type { LeetCodeCodeSnippet, LeetCodeQuestionData } from '@/types';

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

const SNIPPETS_QUERY = `
  query questionEditorData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      codeSnippets {
        lang
        langSlug
        code
      }
    }
  }
`;

/** Pulls `titleSlug` out of any /problems/<slug>/... URL. */
const parseTitleSlug = (url: string) =>
  url.match(/problems\/([^/?]+)/)?.[1] ?? null;

/** A plain GraphQL request. Returns null on anything other than a question. */
const fetchQuestion = async <T>(
  endpoint: string,
  titleSlug: string,
  query = QUESTION_QUERY
): Promise<T | null> => {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; ReCode/1.0)',
      },
      body: JSON.stringify({
        query,
        variables: { titleSlug },
      }),
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const json = await response.json();
    return json?.data?.question ?? null;
  } catch (error) {
    console.error(`LeetCode request to ${endpoint} failed:`, error);
    return null;
  }
};

export async function fetchLeetCodeQuestionAction(url: string) {
  // get titleSlug
  // Matches titleSlug after problems until - or ?
  const titleSlug = parseTitleSlug(url);
  if (!titleSlug) {
    return { success: false, error: 'Invalid LeetCode URL format' };
  }

  const isCn = url.includes('leetcode.cn');

  let question: LeetCodeQuestionData | null = null;

  if (isCn) {
    // Works from a normal network; datacentre IPs get a Cloudflare challenge
    question = await fetchQuestion<LeetCodeQuestionData>(
      'https://leetcode.cn/graphql',
      titleSlug
    );

    // A real browser gets through that challenge and keeps the Chinese title
    if (!question) question = await fetchQuestionViaBrowser(url, titleSlug);
  }

  // The English site is never challenged and uses the same slugs, so it is a
  // usable last resort: only the title stays English, tags are mapped below
  if (!question) {
    question = await fetchQuestion<LeetCodeQuestionData>(
      'https://leetcode.com/graphql',
      titleSlug
    );
  }

  if (!question) {
    return { success: false, error: 'Failed to fetch data from LeetCode' };
  }

  const processedTags = question.topicTags.map((tag) => {
    // if the official gave a Chinese name
    if (tag.translatedName) return tag.translatedName;

    // if the official didn't give a Chinese name, check the mapping
    if (TAG_MAPPING[tag.name]) return TAG_MAPPING[tag.name];

    // If we still can't find a name, use the English name
    return tag.name;
  });

  return {
    success: true,
    data: {
      pid: question.questionFrontendId,
      title:
        isCn && question.translatedTitle
          ? question.translatedTitle
          : question.title,
      difficulty: question.difficulty,
      tags: processedTags,
      link: url,
    },
  };
}

/**
 * The empty skeleton LeetCode pre-fills its own editor with, so a new solution
 * starts from the official signature instead of a blank page.
 *
 * Follows the same ladder as the question fetch above: the Chinese site first,
 * a real browser when it answers with a challenge, the English site last. The
 * snippets are identical across both sites, only the comments inside a few of
 * them are translated.
 */
export async function fetchLeetCodeSnippetsAction(url: string) {
  const titleSlug = parseTitleSlug(url);
  if (!titleSlug) {
    return { success: false as const, error: 'Invalid LeetCode URL format' };
  }

  type SnippetsPayload = { codeSnippets?: LeetCodeCodeSnippet[] | null };

  const isCn = url.includes('leetcode.cn');

  let snippets: LeetCodeCodeSnippet[] | null = null;

  if (isCn) {
    snippets =
      (
        await fetchQuestion<SnippetsPayload>(
          'https://leetcode.cn/graphql',
          titleSlug,
          SNIPPETS_QUERY
        )
      )?.codeSnippets ?? null;

    if (!snippets?.length) {
      snippets = await fetchCodeSnippetsViaBrowser(url, titleSlug);
    }
  }

  if (!snippets?.length) {
    snippets =
      (
        await fetchQuestion<SnippetsPayload>(
          'https://leetcode.com/graphql',
          titleSlug,
          SNIPPETS_QUERY
        )
      )?.codeSnippets ?? null;
  }

  if (!snippets?.length) {
    return { success: false as const, error: 'Failed to fetch code snippets' };
  }

  const bySlug = new Map(snippets.map((snippet) => [snippet.langSlug, snippet]));

  // Keyed by the editor's own language values, so the caller never has to know
  // about LeetCode's slugs. Languages the problem has no snippet for are left out
  const templates: Record<string, string> = {};

  for (const [language, slug] of Object.entries(LEETCODE_LANG_SLUGS)) {
    const code = bySlug.get(slug)?.code;
    if (code) templates[language] = code;
  }

  return { success: true as const, data: templates };
}
