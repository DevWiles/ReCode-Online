// ==UserScript==
// @name         ReCode Fresh Start
// @namespace    https://recode.devwiles.online/
// @version      1.0.0
// @description  Arriving from ReCode with #recode-fresh clears the problem's saved draft, so a review round starts from the official code template.
// @match        https://leetcode.cn/problems/*
// @match        https://leetcode.com/problems/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

/**
 * LeetCode keeps the last thing typed into its editor in IndexedDB
 * (database "LeetCode-problems", store "problem_code") under keys like
 * "<questionId>_<userId>_<langSlug>". ReCode cannot reach that storage from
 * its own origin, so its "solve" links carry a #recode-fresh hash and this
 * script does the clearing from inside the LeetCode page:
 *
 *   1. look up the problem's questionId (the key prefix; it differs from the
 *      number shown in the title),
 *   2. delete every draft row of this problem, every language and user,
 *   3. reload without the hash, so the editor hydrates from the template.
 *
 * The editor may flash the old draft during step 1-2; the reload in step 3 is
 * what guarantees a clean start. Any failure just strips the hash and leaves
 * the draft alone - a stale draft beats a broken page.
 */
(() => {
  "use strict";

  if (location.hash !== "#recode-fresh") return;

  const slug = location.pathname.split("/")[2];
  const cleanUrl = location.href.replace(/#recode-fresh$/, "");

  const leave = () => location.replace(cleanUrl);

  if (!slug) return leave();

  (async () => {
    try {
      // Same-origin GraphQL; the csrf token is only present when logged in,
      // and the query works without it for anonymous visitors
      const csrf = document.cookie.match(/csrftoken=([^;]+)/)?.[1];

      const response = await fetch("/graphql", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "x-csrftoken": csrf } : {}),
        },
        body: JSON.stringify({
          query:
            "query q($titleSlug: String!) { question(titleSlug: $titleSlug) { questionId } }",
          variables: { titleSlug: slug },
        }),
      });

      const questionId = (await response.json())?.data?.question?.questionId;
      if (!questionId) return leave();

      // No version given: an upgrade would block while a LeetCode tab is open
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open("LeetCode-problems");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (db.objectStoreNames.contains("problem_code")) {
        const store = db
          .transaction("problem_code", "readwrite")
          .objectStore("problem_code");

        // "<id>_" .. "<id>_￿" spans every language and the
        // "-updated-time" bookkeeping rows of exactly this problem
        await new Promise((resolve, reject) => {
          const request = store.delete(
            IDBKeyRange.bound(`${questionId}_`, `${questionId}_￿`)
          );
          request.onsuccess = resolve;
          request.onerror = () => reject(request.error);
        });
      }

      db.close();
    } catch (error) {
      console.warn("[recode-fresh] draft clear failed:", error);
    }

    leave();
  })();
})();
