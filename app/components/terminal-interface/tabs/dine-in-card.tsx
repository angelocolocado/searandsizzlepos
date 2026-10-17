import { useState } from "react";
import { Button } from "~/components/ui/button";
import type { KitchenOrder } from "~/types/menu-category";

type ComponentProps = {
    order: KitchenOrder;
    onClick: (order: KitchenOrder) => void;
};

export function DineInCard({ order, onClick }: ComponentProps) {
    const isPaid = order.payment_status.toLowerCase() === "paid";
    const isDineIn = order.type === "Dine in"
    const itemCount = order.itemCount ?? order.order.reduce(
        (count, item) => count + item.quantity,
        0
    );

    return (
        <article
            className={`flex h-[118px] w-36 shrink-0 animate-in flex-col gap-2 rounded-md border px-2 py-2 shadow-sm fade-in duration-800 ease-out ${
                isDineIn
                    ? "border-orange-300 bg-orange-50/80 dark:border-orange-800 dark:bg-orange-950/20"
                    : "border-rose-400 bg-rose-50/70 dark:border-rose-800 dark:bg-rose-950/20"
            }`}
        >
            <Button
                variant="ghost"
                className="h-auto min-h-0 w-full justify-start p-0 text-left hover:bg-transparent"
                onClick={() => onClick(order)}
                aria-label={`Open order number ${order.orderNumber}, ${itemCount} items, ${order.type}, ${order.elapsed}`}
            >
                <div className="flex flex-col items-start space-y-0.5">
                    <h2 className="text-[11px] font-bold leading-4 text-foreground">
                        ORDER # {order.orderNumber}
                    </h2>
                    <p className="text-[10px] leading-3 font-semibold text-muted-foreground">
                        Item: {itemCount}
                    </p>
                    <p className="text-[9px] leading-3 text-muted-foreground/80">
                        {order.elapsed}
                    </p>
                </div>
            </Button>
            <div className="flex items-center gap-2">
                <span
                    className={`w-fit rounded-full px-2 truncate py-0.5 text-[9px] first-letter:uppercase leading-3 font-semibold text-white ${
                        isPaid ? "bg-green-700" : "bg-red-700"
                    }`}
                >
                    {order.payment_status}
                </span>
                <span
                    className={`w-fit rounded-full px-2 py-0.5 truncate text-[9px] leading-3 font-semibold text-white ${
                        isDineIn ? "bg-amber-700" : "bg-red-700"
                    }`}
                >
                    {order.type}
                </span>
            </div>
        </article>
    );
}
