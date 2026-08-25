import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { IdeathonSignupForm } from "@/components/sections/IdeathonSignupForm";
import { signupSteps } from "@/content/ideathon";
import type { CalendarEvent } from "@/content/calendar";

type StepCopyKey = Parameters<ReturnType<typeof useTranslations<"IdeathonPage.steps">>>[0];

export function IdeathonSteps({
  nextEvent,
  currentEvent,
}: {
  nextEvent: CalendarEvent | null;
  currentEvent: CalendarEvent | null;
}) {
  const t = useTranslations("IdeathonPage.steps");

  return (
    <Section id="anmelden">
      <Container className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2 className="text-display-3 font-display break-words">{t("title")}</h2>
          <p className="max-w-2xl text-body-l opacity-80">{t("lead")}</p>
        </div>
        <ol className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {signupSteps.map((step) => (
            <li key={step.key} className="flex flex-col gap-2 border-t-2 border-gold pt-4">
              <span className="font-mono text-mono-s opacity-60">{String(step.order).padStart(2, "0")}</span>
              <h3 className="text-heading-3 font-medium">{t(`${step.key}.title` as StepCopyKey)}</h3>
              <p className="text-body-s opacity-80">{t(`${step.key}.description` as StepCopyKey)}</p>
            </li>
          ))}
        </ol>
        <p className="mx-auto max-w-2xl rounded-md border border-gold/40 bg-gold/10 px-6 py-4 text-center text-body-s">
          {t("commitmentNote")}
        </p>
        <div className="mx-auto w-full max-w-2xl">
          {nextEvent ? (
            <IdeathonSignupForm />
          ) : (
            <p className="rounded-md border border-dashed border-ink/20 p-6 text-body-m opacity-70">
              {currentEvent ? t("closedNoteLive") : t("closedNote")}
            </p>
          )}
        </div>
      </Container>
    </Section>
  );
}
