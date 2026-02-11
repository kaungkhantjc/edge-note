import { type RouteConfig, index } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    {
        path: "login",
        file: "routes/login.tsx",
    },
    {
        path: "logout",
        file: "routes/logout.tsx",
    },
    {
        path: "new",
        file: "routes/new.tsx",
    },

    {
        path: "api-notes",
        file: "routes/api-notes.tsx",
    },
    {
        path: ":id",
        file: "routes/note-view.tsx",
    },
    {
        path: ":id/edit",
        file: "routes/note-edit.tsx",
    },
] satisfies RouteConfig;
