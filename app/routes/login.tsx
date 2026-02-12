import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, redirect, useActionData } from "react-router";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { useUI } from "~/components/ui/UIProvider";
import { safeCompare } from "~/lib/crypto.server";
import { commitSession, getSession } from "../services/session.server";
import { APP_CONFIG } from "~/config";

export function meta() {
    return [
        { title: `Login - ${APP_CONFIG.name}` },
        { name: "description", content: `Login to ${APP_CONFIG.name}` },
    ];
}

export async function loader({ request, context }: LoaderFunctionArgs) {
    const env = (context as unknown as { cloudflare: { env: Env } }).cloudflare.env;
    const session = await getSession(request, env);
    if (session.isLoggedIn) {
        return redirect("/");
    }
    return null;
}

export async function action({ request, context }: ActionFunctionArgs) {
    const formData = await request.formData();
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const env = (context as unknown as { cloudflare: { env: Env } }).cloudflare.env;

    // Check against env variables using timing-safe comparison
    if (
        safeCompare(username, env.AUTH_USERNAME) &&
        safeCompare(password, env.AUTH_PASSWORD)
    ) {
        const session = await getSession(request, env);
        session.isLoggedIn = true;
        session.username = username;

        const cookie = await commitSession(session);

        return redirect("/", {
            headers: {
                "Set-Cookie": cookie || "",
            },
        });
    }

    return { error: "Invalid credentials", _t: Date.now() };
}

export default function Login() {
    const actionData = useActionData<typeof action>();
    const { showSnackbar } = useUI();

    useEffect(() => {
        if (actionData?.error) {
            showSnackbar(actionData.error);
        }
    }, [actionData, showSnackbar]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <div className="w-full max-w-110 p-8 lg:p-12">

                {/* Let make icon and title on the same line */}
                <div className="flex items-center justify-center mb-10 text-center">
                    <img src="/favicon.svg" alt={APP_CONFIG.name} className="size-16 me-4" />
                    <h1 className="text-3xl font-bold text-on-surface tracking-tight">{APP_CONFIG.name}</h1>
                </div>

                <Form method="post" className="space-y-4">
                    <div className="space-y-5">
                        <Input
                            label="Username"
                            name="username"
                            autoFocus
                            required
                            type="text"
                        />
                        <Input
                            label="Password"
                            name="password"
                            required
                            type="password"
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="filled"
                        size="lg"
                        className="w-full h-14 text-base font-bold mt-4"
                    >
                        Sign In
                    </Button>
                </Form>
            </div>
        </div>
    );
}
