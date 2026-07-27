# Assets & facts to do

Every missing asset and unverified fact goes here as it's discovered. Nothing
gets fabricated to fill a gap — a row here and a `Placeholder` component instead.

| Pfad | Was fehlt | Format / Maße | Status |
| ---- | --------- | ------------- | ------ |
| `components/layout/Logo.tsx` | Logo, volle Variante | SVG, ca. 160×40, transparent | Platzhalter aktiv (dashed-gold-Textbox) |
| `components/layout/Logo.tsx` | Logo, kompakte Variante | SVG, ca. 40×40, transparent | Platzhalter aktiv (dashed-gold-Textbox) |
| `content/navigation.ts` (`socialLinks`) | Instagram-URL | — | Platzhalter aktiv (`href: null`) |
| `content/navigation.ts` (`socialLinks`) | LinkedIn-URL | — | Platzhalter aktiv (`href: null`) |
| `content/navigation.ts` (`socialLinks`) | Facebook-URL | — | Platzhalter aktiv (`href: null`) |
| `content/navigation.ts` (`socialLinks`) | Spotify-URL | — | Platzhalter aktiv (`href: null`) |
| `content/navigation.ts` (`networkLinks`) | Enactus Germany-URL | — | Platzhalter aktiv (`href: null`) |
| `content/navigation.ts` (`networkLinks`) | Enactus Global-URL | — | Platzhalter aktiv (`href: null`) |
| `components/layout/Footer.tsx` | LinkedIn-Icon | — | `@icons-pack/react-simple-icons` enthält keine Marke für LinkedIn (Takedown-Request an Simple Icons) — Footer zeigt nur Text statt Icon für diesen einen Eintrag. Zu prüfen, sobald ein anderes Icon-Set oder das offizielle LinkedIn-Brand-Asset verfügbar ist. |
| `app/[locale]/(site)/page.tsx` | Startseite | — | Alle acht Sections stehen (Hero, Partner, Kennzahlen, Säulen, Benefits, Alumni, Vorstand, CTA); Copy dort, wo sie nicht aus `content/` kommt, ist Entwurf — siehe die Zeilen zu `Hero.rotating`, `Benefits.*` und den Content-Dateien unten. Keine erfundene Mission/Vision-Copy über das Bestehende hinaus. Eigener Charakter durch drei Eingriffe ergänzt: der goldene Faden (`components/motion/ThreadSegment.tsx`, `threadRoute.ts`) von `PartnerMarquee` bis `ClosingCta`, das editoriale Alumni-Layout (`AlumniVoices.tsx`), der Proximity-Effekt auf den Vorstandsportraits (`ProximityGroup.tsx`) |
| `app/[locale]/(site)/impressum`, `/datenschutz` | Rechtstexte | — | Nur Platzhalterseite. Laut `docs/engineering.md` geht der Datenschutz-Entwurf vor Launch an den Datenschutzbeauftragten von Enactus Germany, klar als Entwurf markiert |
| `next.config.ts` / Redirect-Map | Ziel für alte URLs `/innolab`, `/faq` | — | Für die 301-Redirect-Map aus `docs/engineering.md` zu klären: ersetzt „Prozess" die InnoLab-Seite (dann Redirect `/innolab` → `/prozess`), oder braucht `/innolab` eine eigene Route? `/faq` hat aktuell ebenfalls kein Ziel |
| `content/org.ts` | Vereinssitz, Vereinsregister-Nummer, allgemeine Kontakt-E-Mail, Vorstands-E-Mail | — | Platzhalter aktiv (`null`) |
| `content/org.ts` (`foundingYear`) | Bestätigung Gründungsjahr 2003 | — | `verified: false`, gespiegelt in `content/kpis.ts` (`foundedYear`) |
| `content/kpis.ts` | Bestätigung der 5 Kennzahlen (8 National Championships, 5 Ausgründungen, 250.000 € Funding, 70 Projektiterationen, seit 2003) | — | Alle `verified: false`, `asOf: "2026-07-26"` |
| `content/projects.ts` (alle Einträge) | `stage`, `leadName`, `leadEmail`, `externalUrl`, `logo`, `images`, `sdgs` | Logo/Bilder als Datei, sonst Text/URL | Platzhalter aktiv (`null` / `[]`) über den `project()`-Helper |
| `content/projects.ts` | Status Safesteps und Vela | — | Auf Rückfrage bestätigt: beide `paused` (nicht `cancelled`) |
| `content/projects.ts` / `content/process.ts` | Vollständige Gate-Stage-Reihenfolge und -Namen | — | Nur „Inno Gating" und „Operations Gating" sind laut `docs/design-system.md` bestätigt (`confirmed: true`); `ideation` und `spinoff` sind Platzhalternamen, jedes Projekt hat vorerst `stage: null` |
| `content/stars.ts` | Echte Namen für STAR_1–STAR_8, Logo, Beschreibung, YouTube-ID | SVG/PNG bzw. YouTube-Video-ID | Platzhalter aktiv (`null`) |
| `content/stars.ts` | Bedeutung von „Status" im STAR-Kontext | — | Ungeklärt, ob Projekt-Status oder Mitgliedsstatus gemeint ist — Feld vorerst `null`, siehe Kommentar in `stars.ts` |
| `content/board.ts` | Aktuelle Vorstandsriege (Namen, Rollen, Fotos, E-Mails, LinkedIn) | Foto: quadratisch | Platzhalter aktiv (missing) — 5 Sitze `VORSTAND_1`–`VORSTAND_5`, `POSITION_1`–`POSITION_5`, Rest `null` bis zur nächsten Vorstandsübergabe |
| `content/alumni.ts` | Alumni-Einträge (Namen, aktuelle Position, Zitat, LinkedIn, Foto) | Foto: Hochformat 3∶4 | Platzhalter aktiv (missing) — 3 Einträge `ALUMNUS_1`–`ALUMNUS_3` mit `POSITION_n`/`STATEMENT_n`, Rest `null`. Format seit dem Editorial-Layout Hochformat statt quadratisch (Portrait bricht über die Container-Kante hinaus, siehe `AlumniVoices.tsx`) |
| `content/events.ts` | Veranstaltungskalender (Titel, Datum, Ort, URL) | — | Platzhalter aktiv (missing) — 4 Einträge, `title` als Message-Key, Rest `null` |
| `content/journeys.ts` | Inhalt und genaue Schritte der Mitglieder-Journey | — | Struktur/Zweck mit dem Vorstand zu klären; 4 generische Phasen (`phase-1`–`phase-4`) als Platzhalter-Enum, Text noch nicht in `messages/` gepflegt |
| `content/partners.ts` | Partnerliste (Namen, Logos, URLs, Tier-Bezeichnungen) | Logo: SVG, transparent | Platzhalter aktiv (missing) — 8 Einträge `PARTNER_1`–`PARTNER_8`, Rest `null`; Tier-Namen bewusst nicht als Enum vorgegeben |
| `content/faq.ts` | Echte Fragen/Antworten (Texte gehören nach `messages/`), Kategorien | — | Platzhalter aktiv (missing) — 8 generische Fragen-Keys (`frage-1`–`frage-8`) als Platzhalter-Enum, Text noch nicht in `messages/` gepflegt |
| `content/recruiting.ts` | Start-/Enddatum des nächsten Bewerbungsfensters | — | Platzhalter aktiv (`null` / `null`) |
| `content/benefits.ts` | Echte sechs Benefits ("was man lernt und bekommt") | — | Platzhalter aktiv (missing) — generische Keys `benefit-1`–`benefit-6`, mit dem Vorstand zu klären |
| `content/media.ts` (`heroMedia`) | Hero-Video (Pitches auf der Bühne), Poster-Frame, mobiles Standbild | Video: 16:9, 1920×1080 als Zielmaß; Poster: gleiches Seitenverhältnis | Platzhalter aktiv (missing) — `sources: []`, `posterSrc`/`mobileImageSrc: null`, Fläche über `width`/`height` reserviert. `HomeHero.tsx` zeigt bis dahin temporär einen Verlaufshintergrund statt einer flachen Fläche, nur damit der Glass-Button-Effekt (Interaction-Abschnitt, `docs/design-system.md`) gegen echte Farbvariation beurteilt werden kann — beim echten Video/Poster entfernen |
| `messages/{de,en}.json` (`Benefits.*`) | Freigabe der sechs Benefit-Texte | — | Entwurfstext (Verantwortung, Praxiswissen, Netzwerk, Führung, Lebenslauf, Gemeinschaft) — plausible, aber nicht mit dem Vorstand abgestimmte Behauptungen; vor Launch gegenlesen lassen |
| `messages/{de,en}.json` (`Hero.rotating`) | Die vier rotierenden Begriffe im Hero | — | Platzhalter aktiv (`BEGRIFF_1`–`BEGRIFF_4`), Wortwahl liegt beim Vorstand |
| `messages/en.json` (`Pillars.*`, `Benefits.*`, `AlumniVoices.*`, `BoardGrid.*`, `ClosingCta.*`) | Echte Übersetzung statt Erstentwurf | — | Bereits als eigenständiges Englisch formuliert (keine reine Spiegelung des Deutschen), aber Teil der noch ausstehenden dedizierten Übersetzungsrunde vor Launch |

## Accepted dependency advisories

`npm audit --omit=dev` reports 3 high-severity findings, all in packages that
Next.js pins internally rather than something we installed directly. The only
fix `npm audit fix --force` offers is a downgrade to `next@9.3.3`, which is not
an option.

| Package | Advisories | Pinned by | Why not forced | Resolved when |
| ------- | ---------- | --------- | --------------- | ------------- |
| `postcss` (`node_modules/next/node_modules/postcss`, 8.4.31) | [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93), [GHSA-6g55-p6wh-862q](https://github.com/advisories/GHSA-6g55-p6wh-862q), [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849) — vulnerable range `<=8.5.17` | `next@16.2.11` (`dependencies.postcss` is a hard-pinned version, not a range) | `next@16.2.11` is already the `latest` npm dist-tag; no stable release exists that bumps this | `npm view next@latest dependencies` shows `postcss` `>8.5.17` |
| `sharp` (`node_modules/sharp`, `^0.34.5`) | [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) (CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591) — vulnerable range `<0.35.0` | `next@16.2.11` (`optionalDependencies.sharp`) | Same as above — already on latest stable Next | `npm view next@latest optionalDependencies` shows `sharp` `>=0.35.0` |

Checked 2026-07-25: `next@16.2.11` is both installed and the current `latest`
dist-tag, so there is no stable upgrade to take. The `canary` channel
(`16.3.0-canary.96`) bumps `sharp` to `^0.35.3` (fixed) but only bumps `postcss`
to `8.5.10`, still inside the vulnerable `<=8.5.17` range — so even canary
would not fully clear this, and a pre-release channel is not appropriate for a
production site regardless.

Re-run `npm audit --omit=dev` after every Next.js upgrade (Dependabot now opens
those PRs automatically) to check whether these have been resolved upstream.
Do not run `npm audit fix --force` to silence them.
