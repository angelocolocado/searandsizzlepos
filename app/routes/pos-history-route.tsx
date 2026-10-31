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
                    <CardHeader>
                        <CardTitle>Orders</CardTitle>
                        <CardDescription>Orders created today by your cashier account.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {orders.length === 0 ? (
                            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                                No orders have been recorded today.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[800px] text-sm">
                                    <thead className="border-y bg-muted/40 text-left text-xs text-muted-foreground">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Order</th>
                                            <th className="px-6 py-3 font-medium">Items</th>
                                            <th className="px-6 py-3 font-medium">Type</th>
                                            <th className="px-6 py-3 font-medium">Payment</th>
                                            <th className="px-6 py-3 font-medium">Status</th>
                                            <th className="px-6 py-3 text-right font-medium">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {orders.map((order) => (
                                            <tr key={order.id} className="align-top">
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold">#{order.order_number}</p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {new Intl.DateTimeFormat("en-PH", { timeStyle: "short" }).format(new Date(order.created_at))}
                                                    </p>
                                                </td>
                                                <td className="max-w-xs px-6 py-4">
                                                    {order.order_items.map((item) => (
                                                        <p key={`${order.id}-${item.name}`} className="truncate">
                                                            {item.quantity}× {item.name}
                                                        </p>
                                                    ))}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">{formatOrderType(order.order_type)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap capitalize">
                                                    {order.payment_method ?? "—"} · {(order.payment_status ?? "unknown").replace("_", " ")}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={order.status === "void" ? "font-semibold text-destructive" : "capitalize"}>
                                                        {order.status}
                                                    </span>
                                                    {order.voucher_applied && (
                                                        <p className="mt-1 text-xs text-green-700">
                                                            Voucher {order.voucher_code ?? "applied"} · {formatPrice(order.discount_amount)} off
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold tabular-nums">
                                                    {formatPrice(order.total_amount)}
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
