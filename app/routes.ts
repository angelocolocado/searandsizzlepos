import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [

    route("/process-cashless", "routes/cashless/cashless-route.tsx"),
    route("/login", "routes/authentication/login.tsx"),
    route("/logout", "routes/authentication/logout.tsx"),
    route("/two-factor-challenge", "routes/authentication/2fa-challenge.tsx"),

    layout("layout/sidebar-layout.tsx", [
        index("routes/terminal-route.tsx"),
        route("pos/menu/:categoryId", "routes/menu-category-route.tsx")
    ]),

    route('/sidebar', 'routes/sidebar-route.tsx'),
    route('/cart', 'routes/cart/fetch-cartdata-route.tsx'),
    route('/checkout', 'routes/checkout/checkout-route.tsx'),
    route('/kitchen-orders', 'routes/kitchen-orders-route.tsx'),
    


] satisfies RouteConfig;
