import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { config } from "md-editor-rt";
import { lineNumbers } from '@codemirror/view';

config({
  codeMirrorExtensions(extensions, _options) {
    return [
      ...extensions,
      {
        type: 'lineNumbers',
        extension: lineNumbers()
      }
    ];
  }
});

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
];

import { ThemeProvider } from "./components/theme-provider";
import { useRouteLoaderData } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const themeMatch = cookieHeader?.match(/theme-preference=([^;]+)/);
  const theme = (themeMatch?.[1] as "light" | "dark" | "system") || "system";
  return { theme };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData<typeof loader>("root");
  const initialTheme = data?.theme || "system";

  const themeScript = `
    (function() {
      try {
        var storageKey = 'theme-preference';
        var theme = 'system';
        var cookieMatch = document.cookie.match(new RegExp('(^| )' + storageKey + '=([^;]+)'));
        if (cookieMatch) {
          theme = cookieMatch[2];
        } else {
          var local = localStorage.getItem(storageKey);
          if (local) theme = local;
        }

        function applyTheme(t) {
          var root = document.documentElement;
          if (t === 'dark') {
            root.classList.add('dark');
          } else if (t === 'light') {
            root.classList.remove('dark');
          } else {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
              root.classList.add('dark');
            } else {
              root.classList.remove('dark');
            }
          }
        }
        
        applyTheme(theme);
      } catch (e) {}
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Meta />
        <Links />
      </head>
      <body>
        <ThemeProvider specifiedTheme={initialTheme}>
          {children}
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
