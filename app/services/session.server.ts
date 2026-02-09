import { getIronSession } from "iron-session";

export interface SessionData {
    isLoggedIn: boolean;
    username?: string;
}

export const getSession = async (request: Request, env: Env) => {
    const response = new Response();
    const session = await getIronSession<SessionData>(request, response, {
        password: env.SESSION_SECRET,
        cookieName: "edge_note_session",
        cookieOptions: {
            secure: true, // Always secure on Cloudflare
            httpOnly: true,
            sameSite: "lax",
            path: "/",
        },
    });

    // Attach response to session for commitSession to access headers
    // Using defineProperty to make it non-enumerable
    Object.defineProperty(session, "response", {
        value: response,
        enumerable: false,
        writable: false,
        configurable: true,
    });

    return session;
}

export const commitSession = async (session: any) => {
    await session.save();
    const response = session.response as Response;
    return response.headers.get("set-cookie");
}

export const destroySession = async (session: any) => {
    session.destroy();
    await session.save();
    const response = session.response as Response;
    return response.headers.get("set-cookie");
}

export const requireAuth = async (request: Request, env: Env) => {
    const session = await getSession(request, env);
    if (!session.isLoggedIn) {
        throw new Response(null, {
            status: 302,
            headers: { Location: "/login" },
        });
    }
    return session;
}
