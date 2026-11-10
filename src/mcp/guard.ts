/**
 * check_against_guide – regelbasert sjekk av tekst mot profilmanualen.
 * Deterministisk (ingen LLM), så resultatet er likt uansett hvilken modell agenten bruker.
 */
import type { BrandGuide } from "@/content";

export type GuideIssue = {
  severity: "error" | "warning";
  rule: string;
  message: string;
  excerpt?: string;
};

export type GuideReport = {
  ok: boolean;
  issues: GuideIssue[];
  stats: { words: number; chars: number };
};

const norm = (s: string) => s.toLowerCase();

export function checkAgainstGuide(
  text: string,
  guide: BrandGuide | null,
  opts: { channel?: string; claims?: string[] } = {},
): GuideReport {
  const issues: GuideIssue[] = [];
  const lower = norm(text);
  const words = text.trim().split(/\s+/).filter(Boolean).length;

  if (!guide) {
    issues.push({
      severity: "warning",
      rule: "no-guide",
      message: "Ingen profilmanual funnet. Sjekk kan ikke gjøres fullt ut.",
    });
    return {
      ok: issues.every((i) => i.severity !== "error"),
      issues,
      stats: { words, chars: text.length },
    };
  }

  for (const w of guide.voice.avoidWords) {
    const re = new RegExp(`\\b${escape(norm(w))}\\b`, "i");
    const m = lower.match(re);
    if (m)
      issues.push({
        severity: "warning",
        rule: "avoid-word",
        message: `Ordet «${w}» står på unngå-listen.`,
        excerpt: snippet(text, m.index ?? 0),
      });
  }

  for (const claim of guide.neverClaim) {
    if (lower.includes(norm(claim))) {
      issues.push({
        severity: "error",
        rule: "never-claim",
        message: `Påstanden «${claim}» skal aldri brukes.`,
      });
    }
  }

  for (const topic of guide.legal.forbiddenTopics) {
    if (lower.includes(norm(topic))) {
      issues.push({
        severity: "error",
        rule: "forbidden-topic",
        message: `Emnet «${topic}» er forbudt i kundens innhold.`,
      });
    }
  }

  for (const needs of guide.legal.requiresApproval) {
    if (lower.includes(norm(needs))) {
      issues.push({
        severity: "warning",
        rule: "requires-approval",
        message: `Innhold om «${needs}» krever godkjenning før publisering.`,
      });
    }
  }

  // Fakta: tall og prosenter i teksten som ikke finnes i godkjente fakta flagges.
  const approved = guide.facts.filter((f) => f.approved).map((f) => norm(f.claim));
  const numbers = text.match(/\b\d[\d\s.,]*\s?(%|kr|kroner|kunder|år|prosent)\b/gi) ?? [];
  for (const n of numbers) {
    const token = norm(n).replace(/\s+/g, " ").trim();
    const known = approved.some((c) =>
      c.replace(/\s+/g, " ").includes(token.split(" ")[0]),
    );
    if (!known)
      issues.push({
        severity: "warning",
        rule: "unverified-number",
        message: `Tallet «${n.trim()}» finnes ikke i godkjente fakta. Legg til kilde eller fjern.`,
        excerpt: n.trim(),
      });
  }

  for (const claim of opts.claims ?? []) {
    if (!approved.some((c) => c.includes(norm(claim)))) {
      issues.push({
        severity: "warning",
        rule: "unapproved-claim",
        message: `Påstanden «${claim}» er ikke i godkjente fakta.`,
      });
    }
  }

  if (opts.channel) {
    const ch = guide.channels.find((c) => norm(c.name) === norm(opts.channel!));
    if (ch?.maxLength && text.length > ch.maxLength) {
      issues.push({
        severity: "error",
        rule: "channel-length",
        message: `Teksten er ${text.length} tegn; ${ch.name} tillater maks ${ch.maxLength}.`,
      });
    }
    if (!ch)
      issues.push({
        severity: "warning",
        rule: "unknown-channel",
        message: `Kanalen «${opts.channel}» finnes ikke i profilmanualen.`,
      });
  }

  if (
    guide.voice.addressForm === "du" &&
    /\b(dere|deres)\b/i.test(text) &&
    !/\bdu\b/i.test(text)
  ) {
    issues.push({
      severity: "warning",
      rule: "address-form",
      message: "Profilmanualen bruker «du», teksten bruker «dere».",
    });
  }

  return {
    ok: issues.every((i) => i.severity !== "error"),
    issues,
    stats: { words, chars: text.length },
  };
}

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function snippet(text: string, at: number) {
  return text.slice(Math.max(0, at - 30), at + 40).replace(/\s+/g, " ");
}
