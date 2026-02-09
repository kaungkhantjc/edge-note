import type { Route } from "./+types/home";
import { requireAuth } from "../services/session.server";
import { NoteList } from "../components/NoteList";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Edge Note" },
    { name: "description", content: "A secure, edge-based note taking app." },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireAuth(request, context.cloudflare.env);
  return {};
}

export default function Home() {
  return <NoteList />;
}
