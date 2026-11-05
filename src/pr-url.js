// Matches https://github.com/{owner}/{repo}/pull/{number}[/{subpage}]
const PR_PATH = /^\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:\/([^/]+))?\/?$/;

// GitHub's newer review UI serves "Files changed" at /changes; /files redirects there.
const FILES_SUBPAGES = new Set(["files", "changes"]);

/**
 * Parses a GitHub PR URL into its identity and which view it shows.
 * Returns null for non-PR URLs and for PR subpages other than
 * Conversation and Files changed (commits, checks, ...).
 */
export function parsePrUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.origin !== "https://github.com") return null;

  const match = parsed.pathname.match(PR_PATH);
  if (!match) return null;

  const [, owner, repo, number, subpage] = match;
  let view;
  if (subpage === undefined) view = "conversation";
  else if (FILES_SUBPAGES.has(subpage)) view = "files";
  else return null;

  const base = `https://github.com/${owner}/${repo}/pull/${number}`;
  return {
    key: `${owner}/${repo}#${number}`.toLowerCase(),
    view,
    conversationUrl: base,
    filesUrl: `${base}/files`,
  };
}
