# Handoff — unattended run, 2026-08-17

Started after plan approval for Aufgabe A (Event-Kalender), with six
corrections from the review round. Running A → F unattended per instruction.
Decisions and their reasoning are recorded here as they're made; this file is
temporary and gets folded into commit messages / docs / ASSETS-TODO.md before
the run ends, not left behind as permanent documentation.

## Corrections applied to the approved plan

1. **Seed as its own migration.** `0006_calendar_events.sql` creates the table
   only. `0007_calendar_events_seed.sql` seeds the 22 confirmed dates, with a
   `unique index (category, start_date, title)` added first so `on conflict do
   nothing` has something to key on. Reason: migrations are "applied" by
   filename in `schema_migrations` — rows added to 0006 after it already ran
   against Neon would never execute.
2. **Natural-key uniqueness checked, not assumed.** Counted by hand across all
   22 seed rows: no two share `(category, start_date, title)`. Three titles
   repeat across different dates (Kick-off ×2, Initiativenmarkt ×2,
   Bewerbungsgespräche ×2, ConnectUs ×3) — none collide because the date
   differs each time. The unique index will not need loosening.
3. **Wettkaempfe stays filled when past.** Measured `ink` blended over
   `--color-cal-wettkaempfe` (gold) at various opacities against WCAG AA
   (4.5:1 normal text):
   - ink/60 → `#6a582b` → **4.30:1 — fails**
   - ink/65 → `#5d4f2b` → 4.99:1
   - ink/70 → `#51462c` → **5.78:1 — used**
   `ink/60` is the site's documented minimum *on paper specifically*
   (`docs/design-system.md`); it does not transfer to a gold fill, which is
   much brighter than paper. Past wettkaempfe rows keep the gold fill and use
   `ink/70` for title/meta text instead of the `ink/60` the six outline
   categories use on paper. Wandering back into design-system.md as a
   documented exception, with the measured value.
4. **`content/events.ts` confirmed dead, not the Journeys data.** Grepped
   `content/journeys.ts` (four real, board-confirmed trips: FSS26 St. Gallen,
   FSS25 Berlin, HWS24 München, FSS24 Berlin — different schema: `key/order/
   destination/year`) against `content/events.ts` (four `null`-everything
   placeholders, schema `slug/title/date/location/externalUrl`, `title` a
   message key `Events.event-N.title`). Grepped `src/messages/{de,en}.json`
   for `Events.event` — zero matches, the key was never even added to the
   catalogs. Grepped the whole repo for `content/events` imports — only
   `tests/unit/content/events.test.ts`. `/events` renders `JourneysSection`
   from `content/journeys.ts` entirely separately. Confirmed genuinely dead:
   deleted, alongside its test.
5. **22 events, not 23.** Recounted per category: bewerbung 12, innolab 1,
   wettkaempfe 1, socials 7, workshops 1 = 22. My earlier "23" silently
   double-counted "ConnectUs und offenes Social" (05.09.) — it's one event,
   not two.
6. **English columns added now.** `title_en`, `description_en` — both
   nullable — added to `calendar_events` in 0006. Admin form gets two
   optional fields; empty means fall back to the German text at render time.
   Titles stay German for the 22 seeded rows (the board maintains this table
   directly in German) — noted, not fought.
7. **Timezone rename isolated.** `content/timezone.ts` (new, `SITE_TIMEZONE`)
   with `content/recruiting.ts`'s `RECRUITING_TIMEZONE` re-exporting it, done
   as its own commit before anything (A3's day-boundary logic and A4's ICS
   export) depends on it, with the full recruiting test suite green before
   moving on. Placed before A3, not just before A4, since A3 was found to
   need Europe/Berlin-correct "today" too (see below).

## Notes / open items

- **A3 design call: month-collapse split uses the server's own render-time
  clock, not the ticking `useNow()`.** `EventCalendar` receives
  `initialNowMs` from `page.tsx` (via `getServerNowMs()`, a plain function
  outside any component — `Date.now()` directly inside the page's render
  trips `react-hooks/purity`'s "impure call during render" check). That
  value drives which event is highlighted, which months collapse behind
  "Frühere Termine", and which rows dim as past — all fixed for the
  lifetime of that render, so nothing reorganises itself right after
  hydration. `useNow(60_000)` (real hook, ticking, starting at 0) drives
  only the highlight card's countdown *phrase* — guarded on `now > 0` so
  the server output is the bare date, per the brief, and no nonsense
  day-count against the Unix epoch ever renders. Considered computing month
  boundaries from the ticking clock too, rejected: at `now === 0` every
  real month is "current or later" (1970 < everything), so once the real
  clock arrived, any genuinely past month would visibly vanish behind the
  collapse a moment after mount — a layout shift the "no layout shift on
  load" floor rules out. `getServerNowMs()`/`getCalendarEvents()` share the
  homepage's inherited 1-hour ISR window (confirmed in the build output:
  `/[locale]` now shows `1h / 1y`, matching `/mitmachen`'s existing
  pattern), so "now" is at most an hour stale — irrelevant at day
  granularity.
- **The highlighted event is excluded from the grouped list below it** —
  showing the same event twice (once large, once in the agenda) read as a
  rendering bug in testing, not emphasis.
- **`content/events.ts` and its test are deleted** (see correction 4 above)
  — `docs/content-guide.md`'s events-calendar pointer updated to the new
  admin flow, and its `ASSETS-TODO.md` row removed. `/events` itself is
  unchanged; it never read that file.
- **Known pre-existing flake, not caused by this work:**
  `tests/e2e/projekte.spec.ts`'s "never introduces a horizontal scrollbar…"
  failed once under Mobile Safari with 6 parallel workers, passed cleanly
  alone and on a retry. That spec doesn't touch the homepage or anything
  this run has changed — matches the WebKit-under-load flakiness
  `playwright.config.ts`'s own comment already documents.
- **A4: `csvFilenameSegment` renamed and moved.** Moved out of `lib/csv.ts`
  into its own `lib/filenameSegment.ts` as `filenameSegment` once the ics
  route needed the identical sanitisation for an event title — it was never
  CSV-specific, only its first caller was. Updated the one existing
  consumer (`api/admin/bewerbungen/csv/route.ts`) and its test.
- **A4: a forced-download anchor click isn't reliably interceptable via
  Playwright's `page.route()`** — tried mocking `/api/kalender/[id]/ics` in
  the e2e spec and the real (unmigrated, DB-less) route answered instead in
  both Chromium and WebKit, so the download's content can't be asserted
  end-to-end without a real migrated database. The e2e test instead checks
  the rendered link's `href` is wired to the right event's route; the
  route's actual behaviour (folding, escaping, DTSTART/DTEND, 404/500,
  headers) is covered by `tests/unit/lib/ics.test.ts` (30 cases) and
  `tests/integration/calendarIcs.test.ts` (5 cases) against real
  request/response objects.
- **A5 design call: the category picker is a radio-chip group, not a native
  `<select>`.** The brief asked for "Auswahl mit Farbpunkt und Icon je
  Option" — no browser can render an icon or a color swatch inside an
  `<option>` element, so a real dropdown could only ever show plain
  category names, quietly failing that requirement. Seven fixed categories
  is few enough that showing every one at once, each with its real
  `CategoryBadge` (icon + color + name), as a native radio group (visually
  hidden `<input type="radio">` + `<label>` wrapping the badge, `peer`
  classes for the checked ring) satisfies the requirement literally and
  needed no new dependency. Considered `@radix-ui/react-select` (Radix is
  already the project's sanctioned path for custom primitives beyond native
  HTML) and rejected it: a new dependency for one seven-item admin picker
  when a fully native, already-accessible alternative existed felt like the
  wrong side of "ask when ambiguous" to guess through unattended — noted
  here instead of adding it silently.
- **Aufgabe A ist fertig, alle sechs Commits grün auf CI** (Migration+Schema,
  Kalenderfarben, Timezone-Isolation, Startseiten-Sektion, ICS, Admin,
  Seed-Migration). Ab hier: Aufgabe B (Mobile-Durchgang Startseite).
- **B: "Eyebrow, Überschrift und Buttons zentriert" war schon erfüllt, nicht
  neu umgesetzt.** Geprüft an allen Homepage-Sektionen: nur der Hero hat
  Eyebrow/Überschrift/Button überhaupt als eine zusammengehörige Einheit —
  und der war schon zentriert, vor jeder Änderung dieses Durchgangs. Jede
  andere Sektion (`SectionHeading`) ist absichtlich linksbündig, seit jeher,
  und trägt keinen eigenen Button. Eine Umstellung dort wäre ein
  eigenständiges, nicht angefragtes Redesign von einem Dutzend Sektionen
  gewesen — nicht gemacht, hier nur festgehalten, dass die Regel bereits
  zutrifft und nicht weiter verändert wurde.
- **B: Hero auf 78vh, Logo/Abstände verkleinert, Poster-Fallback.**
  `HomeHero.tsx`: `h-[78vh] md:h-auto`, `Container` wird `flex-1` +
  `justify-center` (bei `md:h-auto` ein No-op, da kein Platz zum Wachsen
  übrig bleibt — Desktop bleibt pixelgleich). `pt-36 pb-24/36` wurde zu
  `pt-16 pb-10 md:pt-36 md:pb-36`, Logo von `h-28` auf `h-20` (nur die
  Mobile-Stufe, `sm:`/`md:`/`lg:` unverändert). Fehlendes
  `mobileImageSrc` (ASSETS-TODO.md) fällt jetzt auf `heroMedia.posterSrc`
  zurück statt auf gar kein Bild — echtes Standbild statt Navy-Fläche,
  verifiziert per Screenshot bei 360/390px.
- **B: Tool-Halbkreis → statisches 2×2-Raster unter `md`, Bogen ab `md`
  (vorher `lg`).** "Tablet" als `md` (768px) gelesen, nicht `lg` (1024px) —
  ab da ist real Platz für den animierten Bogen neben der zweispaltigen
  Benefits-Grid. Raster nutzt dieselben vier Logos (`content/tools.ts`),
  `aria-hidden`, kein neues Content-File.
- **B: Goldener Faden auf Mobile — vollständig neu berechnete `narrow`-Route,
  keine bloße Skalierung.** Die alte `narrow`-Route driftete wie die
  Desktop-Version quer über die Seite (z. B. Benefits: 93→50); eine simple
  "durch drei geteilte" Version davon hätte den Faden immer noch mitten durch
  linksbündigen Fließtext laufen lassen. Stattdessen: `MOBILE_AXIS = 8`
  (≈8 % der Viewportbreite, wie gefordert), jede Sektion beginnt und endet
  narrow-seitig exakt dort (macht die Nahtstetigkeit trivial), nur der `bow`
  wandert pro Sektion 4–7 Punkte — und **nie über die Achse hinaus** in die
  Textspalte hinein, nur Richtung Bildschirmkante. Damit bleibt der Faden
  durchgehend links neben dem Text, nie durch ihn hindurch, verifiziert per
  Screenshot bei 360px (Benefits, Kalender). Gate-Stops liegen narrow-seitig
  jetzt ebenfalls bei 8 statt 50 — sonst würde der Faden an jedem Gate von der
  Kante zurück zur Mitte springen. Strichstärke auf der `narrow`-Path von 2px
  auf 1px.
- **B: Sektionsabstände vereinheitlicht in `Section.tsx` selbst**, nicht pro
  Sektion: `py-24` → `py-16 md:py-24` — die eine gemeinsame Stelle, an der
  praktisch jede Sektion ihren vertikalen Rhythmus zieht. `GateDivider`
  (eigene, bewusst kompaktere Rolle) auf `py-10 md:py-16` mitgezogen, damit er
  auf Mobile weiterhin sichtbar kürzer bleibt als eine volle Sektion.
  `PartnerMarquee`s eigene, schon immer abweichende Werte (`pt-16 pb-10`,
  für das schmale Logoband) unangetastet gelassen — kein Symptom, sondern
  bereits die bewusste Ausnahme.
- **B: KPI-/Säulen-Fixes aus den letzten beiden Commits gegengeprüft** — per
  Screenshot bei 360px, beide sauber (keine Überlappung, Kartentext lesbar
  über dem Hintergrundfoto), auch mit dem neuen `py-16`-Rhythmus.
- **Vorsicht, eigener Fehler:** Beim Server-Neustart für die Screenshot-
  Verifikation wurde einmal `taskkill /F /IM node.exe` verwendet — das
  beendet **alle** Node-Prozesse auf der Maschine, nicht nur den
  Dev-Server dieses Projekts. Funktional folgenlos für dieses Repo, aber zu
  grobkörnig für eine unbeaufsichtigte Aktion; jeder weitere Neustart lief
  danach gezielt über die PID auf Port 3000 (`netstat` + `taskkill /PID`).
  Falls auf dieser Maschine parallel etwas anderes in Node lief, ist das der
  Moment, an dem es gestoppt wurde.
- **Aufgabe B fertig, CI grün.** Ab hier: Aufgabe C (Mobile-Durchgang
  Unterseiten, 360px) — /projekte, /projekte/archiv, /events, /partner,
  /kontakt, /mitmachen, /prozess.
- **C: `/projekte` — Projektbeschreibung lief auf ~80px Spaltenbreite
  zusammen, ein bis zwei Wörter pro Zeile.** `ProjectsActive.tsx`s
  Kartenzeile hatte Logo, Name+OneLiner-Spalte, Badge und Chevron alle in
  EINER Reihe; bei 360px blieb für die `flex-1`-Textspalte nach Logo
  (56px) + Badge (~80px) + Chevron (20px) + drei `gap-4` nur noch gut
  70–80px übrig. Umgebaut: Name und Badge teilen sich jetzt eine eigene,
  umbrechende Zeile, der OneLiner bekommt darunter immer die volle
  Spaltenbreite — unabhängig vom Badge, nicht nur auf Mobile bezogen (die
  Umstellung ist auch am Desktop unauffällig richtig, kein Sonderfall
  nötig).
- **C: `/events` — Platzhalter-Text lief aus einer 56px-Box heraus, direkt in
  den Titeltext daneben hinein.** Der Accordion-Trigger für „Teamwochenende"
  (noch ohne Foto, siehe ASSETS-TODO.md) zeigte `Placeholder kind="Bild"
  label={title}` in einer `size-14`-Box — für ein 14-Zeichen-Wort ohne jede
  Chance, dort hineinzupassen, und der Titel steht ohnehin schon als echter
  Text direkt daneben. `Placeholder.label` jetzt optional gemacht (Regression
  für andere Aufrufer ausgeschlossen — alle bestehenden übergeben weiter ein
  Label, dort ändert sich nichts), `FormatMedia` bekommt ein `compact`-Flag,
  das für den Accordion-Fall das Label weglässt; die Placeholder-Box selbst
  bekommt zusätzlich `overflow-hidden` als Sicherheitsnetz gegen den nächsten
  ähnlichen Fall. Regressionstest ergänzt.
- **C: zwei Touch-Ziele unter 44px gefunden und global behoben** (beide
  Shared Components, die auf allen sieben geprüften Seiten erscheinen, nicht
  Seiten-spezifische Bugs): Header-Hamburger-Button 40×40 → `p-2.5` um den
  24px-Icon macht 44×44; `Button`s Standardgröße (`size="md"`, u. a. „Nachricht
  senden", „Erinnerung aktivieren", „Project Guide herunterladen") landete
  bei 42px Höhe, jetzt mit `min-h-11` (44px) abgesichert. Footer-Links (Text
  in einem Absatz-Kontext, WCAG 2.5.8 nimmt Inline-Textlinks ausdrücklich
  aus) und die Consent-Checkbox (16×16, aber komplett von einem
  klickbaren `<label>`-Satz umschlossen, siehe ApplicationForm.tsx) bewusst
  nicht angefasst — beides keine echten Bedienprobleme, nur Messartefakte
  einer Prüfung, die ausschließlich das native Element misst.
- **C: `/prozess`-Timeline und `/mitmachen`-Formular bei 360px vollständig
  durchgespielt, keine weiteren Bugs gefunden.** Timeline: alle acht
  Stationen, Klick öffnet die Prüfpunkte-Box sauber, keine Überlappung.
  Formular (mit gemocktem offenem Bewerbungsfenster getestet, da das echte
  erst am 01.09. öffnet): alle Textfelder, die Wunschbereich-Mehrfachauswahl
  (2-spaltig, keine abgeschnittenen Labels), die Consent-Checkbox, jede
  einzelne Fehlermeldung (Pflichtfelder, Mindestlänge, „mindestens einen
  Bereich", Einwilligung) und der Erfolgszustand nach Absenden — alle lesbar,
  keine Überlappung, kein Overflow. Nichts zu reparieren; hier bestätigt,
  nicht neu gebaut.
- **Aufgabe C fertig, CI grün.** Ab hier: Aufgabe D (Adminbereich aufwerten).
- **D: ein gemeinsames Status-Vokabular statt zwei lokaler.** Neue
  `components/admin/StatusIndicator.tsx` mit vier Stufen (ok/warning/
  error/neutral), jede mit eigenem Icon UND eigener Farbe UND dem
  übergebenen Text — Farbe ist nirgends allein das Signal. `/admin/system`s
  bisherige lokale `StatusIcon`/`StatusPill` (nur ok/fail) darauf umgestellt,
  `MailStatusIndicator` (pending→neutral, sent→ok, failed→error) neu in
  `/admin/bewerbungen` und `/admin/kontakt`s Mailstatus-Spalte eingesetzt,
  die bisher reiner Text ohne jede Farbe war.
- **D: Icons zentral in `adminSections.ts` statt separat in `AdminNav.tsx`
  gepflegt.** Jeder der acht Bereiche trägt sein Icon jetzt direkt am
  Registry-Eintrag (`Record`-Typ zwingt ohnehin zur Vollständigkeit) — `AdminNav`
  und die Übersichtsseite lesen `section.icon` statt zwei Kopien derselben
  Zuordnung zu riskieren.
- **D: neue Statusleiste auf `/admin`** — genau die fünf im Auftrag genannten
  Signale (Bewerbungen im laufenden Fenster, fehlgeschlagene Mails,
  zukünftiges Bewerbungsfenster vorhanden, Löschroutine zuletzt gelaufen,
  nächster Termin), als eigene, datenlose Präsentationskomponente
  (`AdminStatusBar.tsx`) — die Seite holt und verrechnet die Daten
  (jede Abfrage einzeln abgesichert, eine fehlschlagende darf die anderen
  vier nicht mitreißen, gleiches Muster wie `/admin/system`), die Komponente
  rendert nur. „Kein Fenster offen" und „kein Termin" sind neutral (Uhr-Icon),
  nicht rot — es ist kein Fehler, nur eine Tatsache.
- **D: bei 390px an allen neun Adminseiten geprüft** (Session-Cookie direkt
  gesetzt, nicht über das Login-Formular, um keinen echten Login-Versuch zu
  brauchen) — kein Seiten-Scroll zur Seite irgendwo; einzelne breite Tabellen
  scrollen weiterhin nur innerhalb ihres eigenen Rahmens
  (`AdminTable`s dokumentiertes, bestehendes Verhalten, nicht neu).
- **`Date.now()` vs `new Date().getTime()` und die purity lint.** Both
  `page.tsx` (A3) and `admin/termine/page.tsx` (A5) needed "now" outside a
  component; `Date.now()` directly in a component body trips
  `react-hooks/purity`'s impure-call check (confirmed: it did not fire for
  `new Date()` in the pre-existing `admin/system/page.tsx`, but did fire for
  the equivalent `Date.now()`). `page.tsx` moved the read into
  `lib/calendarEvents.ts`'s `getServerNowMs()`, a plain function outside any
  component. `admin/termine/page.tsx` uses `new Date().getTime()` directly,
  matching the exact pattern `admin/system/page.tsx` already ships — both
  clear lint; noted so a future edit doesn't "simplify" one back to
  `Date.now()` and reintroduce the failure.
