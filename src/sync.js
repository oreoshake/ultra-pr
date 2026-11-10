import { parsePrUrl } from "./pr-url.js";

/**
 * Decides what to do with a split partner after one side of an Ultra PR split
 * navigated.
 *
 * `tabUrl` is the URL the navigated tab now shows. It's undefined when the tab
 * left github.com, since the extension can't see URLs outside its host
 * permissions; that counts as leaving the PR like any other non-PR URL.
 *
 * Returns one of:
 *   { action: "none" }               partner already shows the other view of this PR
 *   { action: "navigate", url, pr }  point partner at the other view of this PR
 *   { action: "close" }              tab left the PR's Conversation/Files views
 */
export function syncPartner(tabUrl, partnerUrl) {
  const pr = tabUrl ? parsePrUrl(tabUrl) : null;
  if (!pr) return { action: "close" };

  const wantView = pr.view === "files" ? "conversation" : "files";
  const partnerPr = partnerUrl ? parsePrUrl(partnerUrl) : null;
  if (partnerPr && partnerPr.key === pr.key && partnerPr.view === wantView) {
    return { action: "none" };
  }

  return {
    action: "navigate",
    url: wantView === "files" ? pr.filesUrl : pr.conversationUrl,
    pr,
  };
}
