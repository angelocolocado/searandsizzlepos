import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [

    layout("layout/sidebar-layout.tsx", [
        index("routes/terminal-route.tsx"),
        route("pos/menu/:categoryId", "routes/menu-category-route.tsx")
    ]),

    route('/sidebar', 'routes/sidebar-route.tsx')
    


] satisfies RouteConfig;
