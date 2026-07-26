import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireLocale } from "@/i18n/requireLocale";
import {
  blendOverBackground,
  contrastRatio,
  passesAA,
  WCAG_AA_LARGE_TEXT,
  WCAG_AA_NORMAL_TEXT,
} from "@/lib/contrast";
import { colorTokens } from "@/lib/design-tokens";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Field } from "@/components/ui/Field";
import { GateMarker } from "@/components/ui/GateMarker";
import { Placeholder } from "@/components/ui/Placeholder";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Styleguide — internal reference",
  robots: { index: false, follow: false },
};

const { ink, gold, paper, sand, oxblood } = colorTokens;

const colorSwatches = [
  { name: "ink", hex: ink, className: "bg-ink text-paper" },
  { name: "gold", hex: gold, className: "bg-gold text-ink" },
  { name: "paper", hex: paper, className: "bg-paper text-ink border border-ink/20" },
  { name: "sand", hex: sand, className: "bg-sand text-ink" },
  { name: "oxblood", hex: oxblood, className: "bg-oxblood text-paper" },
] as const;

const typeScale = [
  {
    step: "display-1",
    className: "text-display-1 font-display",
    sample: "Wir bauen Social Startups.",
  },
  {
    step: "display-2",
    className: "text-display-2 font-display",
    sample: "Wir bauen Social Startups.",
  },
  {
    step: "display-3",
    className: "text-display-3 font-display",
    sample: "Wir bauen Social Startups.",
  },
  {
    step: "heading-1",
    className: "text-heading-1 font-sans",
    sample: "Von der Idee zum Spin-off",
  },
  {
    step: "heading-2",
    className: "text-heading-2 font-sans",
    sample: "Von der Idee zum Spin-off",
  },
  {
    step: "heading-3",
    className: "text-heading-3 font-sans",
    sample: "Von der Idee zum Spin-off",
  },
  {
    step: "body-l",
    className: "text-body-l font-sans",
    sample: "Enactus Mannheim entwickelt unternehmerische Lösungen für die UN-Ziele.",
  },
  {
    step: "body-m",
    className: "text-body-m font-sans",
    sample: "Enactus Mannheim entwickelt unternehmerische Lösungen für die UN-Ziele.",
  },
  {
    step: "body-s",
    className: "text-body-s font-sans",
    sample: "Enactus Mannheim entwickelt unternehmerische Lösungen für die UN-Ziele.",
  },
  { step: "mono-s", className: "text-mono-s font-mono uppercase", sample: "Inno Gating" },
  { step: "mono-xs", className: "text-mono-xs font-mono uppercase", sample: "Inno Gating" },
] as const;

const contrastCombinations = [
  { label: "Body text — ink on paper", fgHex: ink, bgHex: paper, fgClass: "text-ink", bgClass: "bg-paper" },
  {
    label: "Muted text — ink at 60% on paper",
    fgHex: blendOverBackground(ink, 0.6, paper),
    bgHex: paper,
    fgClass: "text-ink/60",
    bgClass: "bg-paper",
  },
  {
    label: "Text on gold — ink on gold (no exceptions)",
    fgHex: ink,
    bgHex: gold,
    fgClass: "text-ink",
    bgClass: "bg-gold",
  },
  {
    label: "Dark-section body text — paper on ink",
    fgHex: paper,
    bgHex: ink,
    fgClass: "text-paper",
    bgClass: "bg-ink",
  },
  {
    label: "Dark-section accent text — sand on ink",
    fgHex: sand,
    bgHex: ink,
    fgClass: "text-sand",
    bgClass: "bg-ink",
  },
  {
    label: "Sand on paper — never used",
    fgHex: sand,
    bgHex: paper,
    fgClass: "text-sand",
    bgClass: "bg-paper",
  },
  {
    label: "Gold as text on paper — never used, gold is not a text color",
    fgHex: gold,
    bgHex: paper,
    fgClass: "text-gold",
    bgClass: "bg-paper",
  },
] as const;

function PassBadge({ pass }: { pass: boolean }) {
  return (
    <span
      className={
        pass
          ? "inline-block rounded-sm bg-ink px-2 py-0.5 text-mono-xs font-mono uppercase text-paper"
          : "inline-block rounded-sm bg-oxblood px-2 py-0.5 text-mono-xs font-mono uppercase text-paper"
      }
    >
      {pass ? "Pass" : "Fail"}
    </span>
  );
}

export default async function StyleguidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await requireLocale(params);


  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-16 px-6 py-16">
      <header className="flex flex-col gap-2">
        <p className="text-mono-s font-mono uppercase text-ink/60">Internal reference</p>
        <h1 className="text-heading-1 font-sans">Styleguide</h1>
        <p className="text-body-m font-sans text-ink/60">
          Every token from <code>src/app/globals.css</code>. This route is removed before
          launch — see <code>docs/design-system.md</code>.
        </p>
      </header>

      <section className="flex flex-col gap-6">
        <h2 className="text-heading-2 font-sans">Color</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {colorSwatches.map((swatch) => (
            <div key={swatch.name} className={`flex h-28 flex-col justify-end rounded-md p-4 ${swatch.className}`}>
              <p className="text-mono-s font-mono uppercase">{swatch.name}</p>
              <p className="text-mono-xs font-mono">{swatch.hex}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-heading-2 font-sans">Typography</h2>
        <div className="flex flex-col divide-y divide-ink/10">
          {typeScale.map((step) => (
            <div key={step.step} className="flex flex-col gap-2 py-6 first:pt-0">
              <p className="text-mono-xs font-mono uppercase text-ink/60">{step.className}</p>
              <p className={step.className}>{step.sample}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-heading-2 font-sans">Contrast</h2>
        <p className="text-body-m font-sans text-ink/60">
          WCAG AA requires 4.5:1 for normal text, 3:1 for large text (≥24px, or ≥19px bold).
          Checked automatically in <code>tests/unit/contrast.test.ts</code>.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-body-s font-sans">
            <thead>
              <tr className="border-b border-ink/20 text-left">
                <th className="py-2 pr-4 font-normal text-mono-xs font-mono uppercase text-ink/60">
                  Combination
                </th>
                <th className="py-2 pr-4 font-normal text-mono-xs font-mono uppercase text-ink/60">
                  Preview
                </th>
                <th className="py-2 pr-4 font-normal text-mono-xs font-mono uppercase text-ink/60">
                  Ratio
                </th>
                <th className="py-2 pr-4 font-normal text-mono-xs font-mono uppercase text-ink/60">
                  AA normal (4.5:1)
                </th>
                <th className="py-2 font-normal text-mono-xs font-mono uppercase text-ink/60">
                  AA large (3:1)
                </th>
              </tr>
            </thead>
            <tbody>
              {contrastCombinations.map((combo) => {
                const ratio = contrastRatio(combo.fgHex, combo.bgHex);
                return (
                  <tr key={combo.label} className="border-b border-ink/10">
                    <td className="py-3 pr-4">{combo.label}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-block rounded-sm px-3 py-1 ${combo.fgClass} ${combo.bgClass}`}
                      >
                        Aa
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono">{ratio.toFixed(2)}:1</td>
                    <td className="py-3 pr-4">
                      <PassBadge pass={passesAA(ratio, false)} />
                    </td>
                    <td className="py-3">
                      <PassBadge pass={passesAA(ratio, true)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-mono-xs font-mono uppercase text-ink/40">
          AA thresholds: {WCAG_AA_NORMAL_TEXT}:1 normal · {WCAG_AA_LARGE_TEXT}:1 large
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-heading-2 font-sans">Button</h2>

        <Demo label="Größen (sm / md / lg)">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Kontakt aufnehmen</Button>
            <Button size="md">Kontakt aufnehmen</Button>
            <Button size="lg">Kontakt aufnehmen</Button>
          </div>
        </Demo>

        <Demo label="Varianten primary / secondary / ghost (auf Paper)">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </Demo>

        <Demo label="Variante glass — nur auf dunklem Untergrund oder Bild">
          <div className="flex flex-wrap items-center gap-3 rounded-md bg-ink p-6">
            <Button variant="glass">Glass</Button>
          </div>
        </Demo>

        <Demo label="Zustände default / disabled / loading">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Default</Button>
            <Button disabled>Disabled</Button>
            <Button loading>Loading</Button>
          </div>
        </Demo>

        <Demo label="Als Link (next/link, href gesetzt, bleibt ein <a>)">
          <Button href="/mitmachen">Jetzt bewerben</Button>
        </Demo>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-heading-2 font-sans">Container</h2>
        <p className="text-body-m font-sans text-ink/60">
          Zentriert, horizontal gepolstert (<code>px-4</code> → <code>px-10</code>), Deckel bei{" "}
          <code>max-w-content</code> (80rem) — sichtbar erst ab einem entsprechend breiten Viewport.
        </p>
        <div className="overflow-hidden rounded-md border border-dashed border-ink/20">
          <Container>
            <div className="bg-sand/40 py-4 text-center text-body-s">Container-Inhalt</div>
          </Container>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-heading-2 font-sans">Section</h2>
        <p className="text-body-m font-sans text-ink/60">
          Tab zu den Buttons unten: Der Fokus-Ring wechselt automatisch von Navy zu Gold, gesteuert
          über <code>data-surface=&quot;ink&quot;</code>.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Section surface="paper" className="rounded-md border border-ink/10 !py-8">
            <p className="mb-3 text-body-s">surface=&quot;paper&quot; (Standard)</p>
            <Button size="sm">Fokus testen</Button>
          </Section>
          <Section surface="ink" className="rounded-md !py-8">
            <p className="mb-3 text-body-s">surface=&quot;ink&quot;</p>
            <Button size="sm" variant="glass">
              Fokus testen
            </Button>
          </Section>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-heading-2 font-sans">Eyebrow</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-ink/10 p-4">
            <Eyebrow>Auf Paper</Eyebrow>
          </div>
          <div className="rounded-md bg-ink p-4 text-paper">
            <Eyebrow>Auf Ink</Eyebrow>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-heading-2 font-sans">Card</h2>
        <Card className="max-w-sm">
          <p className="text-heading-3 font-sans">Grameen Bike</p>
          <p className="mt-2 text-body-s text-ink/60">
            Ein Beispieltext, wie ein Projekt-Card-Inhalt aussehen könnte.
          </p>
        </Card>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-heading-2 font-sans">Badge</h2>
        <p className="text-body-m font-sans text-ink/60">
          Fläche vs. Outline unterscheidet die Status auch ohne Farbwahrnehmung.
        </p>
        <div className="flex flex-wrap gap-3">
          <Badge status="active">Aktiv</Badge>
          <Badge status="spinoff">Ausgegründet</Badge>
          <Badge status="paused">Pausiert</Badge>
          <Badge status="cancelled">Beendet</Badge>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-heading-2 font-sans">Field</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Name" name="name" placeholder="Ada Lovelace" />
          <Field
            label="E-Mail-Adresse"
            name="email"
            type="email"
            error="Bitte gültige E-Mail-Adresse angeben"
          />
          <Field as="textarea" label="Nachricht" name="message" hint="Optional" />
          <Field as="select" label="Fachbereich" name="department">
            <option value="wi">Wirtschaftsinformatik</option>
            <option value="bwl">BWL</option>
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-heading-2 font-sans">Placeholder</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Placeholder kind="Foto" label="Team-Gruppenfoto" ratio="1 / 1" note="1600×1600" />
          <Placeholder kind="Video" label="Hero-Video" ratio="16 / 9" note="Muted, mit Poster" />
          <Placeholder kind="Statistik" label="Anzahl Spin-offs" note="Von Enactus Germany bestätigen" />
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-heading-2 font-sans">GateMarker</h2>
        <Demo label="variant=&quot;milestone&quot; — Timeline-Schritt, Label seitlich">
          <div className="flex h-16 items-stretch gap-8">
            <GateMarker label="Ideation" />
            <GateMarker label="Inno Gating" />
            <GateMarker label="Operations Gating" />
          </div>
        </Demo>
        <Demo label="variant=&quot;divider&quot; — Section-Divider, zentriert">
          <GateMarker label="Von der Idee zum Spin-off" variant="divider" />
        </Demo>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-heading-2 font-sans">SectionHeading</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-ink/10 p-6">
            <SectionHeading
              eyebrow="Auf Paper"
              title="Was uns einzigartig macht"
              lead="Titel und Lead-Satz sind immer sichtbar."
            />
          </div>
          <div className="rounded-md bg-ink p-6 text-paper">
            <SectionHeading
              eyebrow="Auf Ink"
              title="Was uns einzigartig macht"
              lead="Titel und Lead-Satz sind immer sichtbar."
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-heading-2 font-sans">PlaceholderMark</h2>
        <p className="text-body-m font-sans text-ink/60">
          Zwei Zustände: <code>missing</code> für Daten, die es noch gar nicht gibt (auffällig),
          <code>unverified</code> für Daten, die da, aber unbestätigt sind (dezent).
        </p>
        <Demo label="variant=&quot;missing&quot; (Standard) — Name existiert noch nicht">
          <p className="text-body-m">
            <PlaceholderMark hint="Diese Angabe ist noch nicht verfügbar.">PARTNER_1</PlaceholderMark>
          </p>
        </Demo>
        <Demo label="variant=&quot;unverified&quot; — Zahl existiert, ist aber unbestätigt">
          <p className="text-display-3 font-display">
            <PlaceholderMark variant="unverified" hint="Diese Zahl ist noch nicht vom Vorstand bestätigt.">
              8
            </PlaceholderMark>
          </p>
        </Demo>
      </section>
    </main>
  );
}

function Demo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-mono-xs font-mono uppercase text-ink/40">{label}</p>
      {children}
    </div>
  );
}
