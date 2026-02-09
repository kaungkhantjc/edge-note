import { Form, redirect, useActionData } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { getSession, commitSession } from "../services/session.server";

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

    // Check against env variables
    if (
        username === env.AUTH_USERNAME &&
        password === env.AUTH_PASSWORD
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

    return { error: "Invalid credentials" };
}

export default function Login() {
    const actionData = useActionData<typeof action>();

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
                <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Login</h1>
                <Form method="post" className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Username
                        </label>
                        <input
                            type="text"
                            name="username"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    {actionData?.error && (
                        <div className="text-red-500 text-sm text-center">
                            {actionData.error}
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
                    >
                        Sign In
                    </button>
                </Form>
            </div>
        </div>
    );
}
