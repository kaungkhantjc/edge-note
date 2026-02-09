import type { Route } from "./+types/logout";
import { getSession, destroySession } from "../services/session.server";
import { redirect } from "react-router";

export async function action({ request, context }: Route.ActionArgs) {
    const session = await getSession(request, context.cloudflare.env);
    const cookie = await destroySession(session);
    return redirect("/login", {
        headers: {
            "Set-Cookie": cookie || "",
        },
    });
}

export async function loader() {
    return redirect("/");
}
