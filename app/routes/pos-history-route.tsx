import api from "~/lib/axios";
import type { Route } from "./+types/pos-history-route";
import { data } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Link } from "react-router";
import { ArrowLeft, CircleDollarSign, ClipboardList, CreditCard, RefreshCw, XCircle } from "lucide-react";

type TerminalKpi = {
    date: string;
    revenue: number;
    total_orders: number;
    successful_orders: number;
    voided_orders: number;
    paid_orders: number;
};

type TerminalOrderItem = {
    name: string;
    quantity: number;
    modifiers: { name: string; quantity: number }[];
};

type TerminalOrder = {
    id: number;
    order_number: number;
    cart_id: string;
    order_type: "dine_in" | "take_out";
    payment_method: "cash" | "cashless";
    payment_status: string;
    status: string;
    subtotal_amount: number;
    total_amount: number;
    voucher_applied: boolean;
    voucher_code: string | null;
    discount_amount: number;
    void_reason: string | null;
    admin_void_reason: string | null;
    voided_by: number | null;
    voided_at: string | null;
    order_items: TerminalOrderItem[];
    created_at: string;
    updated_at: string;
};

export async function clientLoader(_args: Route.ClientLoaderArgs) {
    try {
        const response = await api.get("v1/orders/terminal-history");
        return data(response.data as { kpi: TerminalKpi; orders: TerminalOrder[] });
    } catch (error) {
        console.error("Failed to load cashier terminal history.", error);
        return data(
            { error: "Could not load today’s POS history. Please try again." },
            { status: 502 }
        );
    }
}

const formatPrice = (value: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);

const formatOrderType = (value: TerminalOrder["order_type"]) =>
    value === "dine_in" ? "Dine in" : "Take out";

export default function PosHistoryRoute({ loaderData }: Route.ComponentProps) {
    if ("error" in loaderData) {
        return (
            <main className="flex min-h-screen items-center justify-center p-6">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Unable to load POS history</CardTitle>
                        <CardDescription>{loaderData.error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button render={<Link to="/pos" />}>
                            Try again
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    const { kpi, orders } = loaderData;

    return (
        <main className="min-h-screen min-w-0 bg-muted/20 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Cashier terminal
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight">Today’s POS history</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {new Intl.DateTimeFormat("en-PH", { dateStyle: "long" }).format(new Date(`${kpi.date}T00:00:00`))}
                        </p>
                    </div>
                    <Button render={<Link to="/" />} variant="outline">
                            <ArrowLeft />
                            Back to POS
                    </Button>
                </header>

                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Today’s sales summary">
                    {[
                        { label: "Revenue", value: formatPrice(kpi.revenue), icon: CircleDollarSign },
                        { label: "Total orders", value: kpi.total_orders, icon: ClipboardList },
                        { label: "Successful", value: kpi.successful_orders, icon: CreditCard },
                        { label: "Paid orders", value: kpi.paid_orders, icon: RefreshCw },
                        { label: "Voided", value: kpi.voided_orders, icon: XCircle },
                    ].map(({ label, value, icon: Icon }) => (
                        <Card key={label}>
                            <CardContent className="flex items-center justify-between gap-3 p-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                    <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
                                </div>
                                <Icon className="size-5 text-muted-foreground" />
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <Card>
                    <CardHeader className="border-b bg-card/80">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <CardTitle>Orders</CardTitle>
                                <CardDescription className="mt-1">Orders created today by your cashier account.</CardDescription>
                            </div>
                            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                                {orders.length} {orders.length === 1 ? "order" : "orders"}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {orders.length === 0 ? (
                            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                                No orders have been recorded today.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px] border-collapse text-sm">
                                    <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                                        <tr>
                                            <th className="w-36 px-6 py-3.5 font-semibold">Order</th>
                                            <th className="w-[30%] px-6 py-3.5 font-semibold">Items</th>
                                            <th className="w-28 px-6 py-3.5 font-semibold">Type</th>
                                            <th className="w-40 px-6 py-3.5 font-semibold">Payment</th>
                                            <th className="w-48 px-6 py-3.5 font-semibold">Status</th>
                                            <th className="w-32 px-6 py-3.5 text-right font-semibold">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {orders.map((order) => (
                                            <tr key={order.id} className="group align-top transition-colors hover:bg-muted/30">
                                                <td className="px-6 py-5">
                                                    <p className="font-semibold tracking-tight">#{order.order_number}</p>
                                                    <p className="mt-1.5 text-xs text-muted-foreground">
                                                        {new Intl.DateTimeFormat("en-PH", { timeStyle: "short" }).format(new Date(order.created_at))}
                                                    </p>
                                                </td>
                                                <td className="max-w-xs px-6 py-5">
                                                    <div className="space-y-1">
                                                        {order.order_items.slice(0, 3).map((item) => (
                                                            <p key={`${order.id}-${item.name}`} className="truncate font-medium">
                                                                <span className="mr-1.5 text-muted-foreground">{item.quantity}×</span>
                                                                {item.name}
                                                            </p>
                                                        ))}
                                                        {order.order_items.length > 3 && (
                                                            <p className="text-xs text-muted-foreground">
                                                                +{order.order_items.length - 3} more item{order.order_items.length - 3 === 1 ? "" : "s"}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-muted-foreground">
                                                    {formatOrderType(order.order_type)}
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <p className="font-medium capitalize">{order.payment_method ?? "—"}</p>
                                                    <p className="mt-1 text-xs capitalize text-muted-foreground">
                                                        {(order.payment_status ?? "unknown").replace("_", " ")}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                                                        order.status === "void"
                                                            ? "bg-destructive/10 text-destructive"
                                                            : order.status === "cooked"
                                                                ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                                                                : "bg-muted text-muted-foreground"
                                                    }`}>
                                                        {order.status}
                                                    </span>
                                                    {order.voucher_applied && (
                                                        <p className="mt-2 text-xs font-medium text-green-700 dark:text-green-400">
                                                            {order.voucher_code ?? "Voucher"} · {formatPrice(order.discount_amount)} off
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <p className="font-bold tabular-nums tracking-tight">
                                                    {formatPrice(order.total_amount)}
                                                    </p>
                                                    {order.voucher_applied && (
                                                        <p className="mt-1 text-xs text-muted-foreground line-through">
                                                            {formatPrice(order.subtotal_amount)}
                                                        </p>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
