import type { KitchenOrder } from "~/types/menu-category";

type ComponentProps = {
    order: KitchenOrder;
};

export function DineInCard({ order }: ComponentProps) {
    const isPaid = order.payment_status.toLowerCase() === "paid";

    return (
        <button
            type="button"
            onClick={() => console.log("Kitchen order selected:", order)}
            className={`w-52 shrink-0 rounded-lg border-2 bg-white p-3.5 text-left shadow-sm transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                order.type === "Dine in" ? "border-orange-400" : "border-red-400"
            }`}
            aria-label={`Order ${order.orderNumber}, ${order.itemCount} items, ${order.type}, ${isPaid ? "paid" : "pay later"}`}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-foreground">
                    Order #
                </span>
                <span className="text-lg font-bold leading-none tabular-nums text-foreground">
                    {order.orderNumber}
                </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">Item:</span>
                <span className="font-semibold tabular-nums">{order.itemCount}x</span>
            </div>

            <div className="mt-1 flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">Elapsed:</span>
                <span className="font-medium">{order.elapsed}</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        order.type === "Dine in"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-red-100 text-red-800"
                    }`}
                >
                    {order.type}
                </span>
                <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isPaid
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                    }`}
                >
                    {isPaid ? "Paid" : "Pay later"}
                </span>
            </div>
        </button>
    );
}
