import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthenticatedRequest } from "@/lib/adminSession";
import { listIdeathonSignups } from "@/lib/db";
import { csvDocument } from "@/lib/csv";

const CSV_COLUMNS = [
  "Name",
  "E-Mail",
  "Studiengang",
  "Idee vorhanden",
  "Team",
  "Teammitglieder",
  "Motivation und bisherige Erfahrung",
  "Essenspräferenz",
  "Eingangsdatum",
  "Mailstatus",
];

const MAIL_STATUS_LABEL: Record<string, string> = {
  pending: "ausstehend",
  sent: "gesendet",
  failed: "fehlgeschlagen",
};

const DIETARY_PREFERENCE_LABEL: Record<string, string> = {
  omnivore: "omnivor",
  vegetarian: "vegetarisch",
  vegan: "vegan",
  halal: "halal",
  kosher: "koscher",
  noAnswer: "keine Angabe",
};

export async function GET(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let signups;
  try {
    signups = await listIdeathonSignups();
  } catch (error) {
    console.error("Failed to read Ideathon signups for CSV export", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const dateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });
  const csv = csvDocument(
    CSV_COLUMNS,
    signups.map((signup) => [
      `${signup.firstName} ${signup.lastName}`,
      signup.email,
      signup.studyProgram,
      signup.hasIdea ? "ja" : "nein",
      signup.registeringAsTeam ? `ja (${signup.teamSize ?? "?"})` : "nein",
      signup.teamMembers ?? "",
      signup.motivationExperience ?? "",
      DIETARY_PREFERENCE_LABEL[signup.dietaryPreference] ?? signup.dietaryPreference,
      dateFormatter.format(signup.createdAt),
      MAIL_STATUS_LABEL[signup.mailStatus] ?? signup.mailStatus,
    ]),
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="ideathon-anmeldungen.csv"',
    },
  });
}
