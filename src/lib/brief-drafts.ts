import type { BriefDraftItem, MomentumData } from "@/lib/types";

// The id given to a draft saved in the M3 shape (one `briefDraft`), so it reads the same every time.
export const OLD_DRAFT_ID = "brief-1";

// The briefs on brief entry, from either stored shape. Data saved before M7c has at most one
// `briefDraft`; it reads as one item. Nothing is rewritten here: the first write that touches
// drafts stores `briefDrafts` and drops `briefDraft` (see setBriefDrafts in reducer.ts).
export function readBriefDrafts(data: MomentumData): BriefDraftItem[] {
  if (data.briefDrafts) return data.briefDrafts;
  if (data.briefDraft) return [{ id: OLD_DRAFT_ID, ...data.briefDraft }];
  return [];
}

// What is worth keeping: a brief with text or a deadline. An empty card isn't stored.
export function keptDrafts(drafts: BriefDraftItem[]): BriefDraftItem[] {
  return drafts.filter((draft) => draft.text !== "" || draft.deadline !== "");
}

export function sameDrafts(a: BriefDraftItem[], b: BriefDraftItem[]): boolean {
  return a.length === b.length && a.every((draft, i) => draft.id === b[i].id && draft.text === b[i].text && draft.deadline === b[i].deadline);
}

// The drafts as stored: briefDrafts (left out when empty), never the old briefDraft.
export function withDrafts(data: MomentumData, drafts: BriefDraftItem[]): MomentumData {
  return { ...data, briefDraft: undefined, briefDrafts: drafts.length > 0 ? drafts : undefined };
}
