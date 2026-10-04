import { Header } from "./header/app-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { DineInCard } from "./tabs/dine-in-card";
import { MenuCategoryBrowser } from "./menu-category-browser";
import type { KitchenOrder, MenuCategory, MenuItem } from "~/types/menu-category";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";

const formatPayment = (amount: number) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(amount);

function OrderRail({ orders, onSelectOrder }: {
    orders: KitchenOrder[], onSelectOrder: (order: KitchenOrder) => void;
}) {
    if (orders.length === 0) {
        return (
            <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                No cooking orders right now.
            </div>
        );
    }

    return (
        <div className="flex gap-3.5 overflow-x-auto px-1 pb-3 pt-1" aria-label="Orders">
            {orders.map((order) => (
                <DineInCard
                    key={order.orderNumber}
                    order={order}
                    onClick={onSelectOrder}
                />
            ))}
        </div>
    );
}

type ComponentProp = {
    onSelectMenu: (menu: MenuItem) => void
    handleProccessPanelToggle: () => void
    isProccessPanelOpen: boolean
    menuCategory?: MenuCategory
    orders: KitchenOrder[]
    ordersError: string | null
    ordersLoading: boolean
}

export function MainView({
    onSelectMenu,
    handleProccessPanelToggle,
    isProccessPanelOpen,
    menuCategory,
    orders,
    ordersError,
    ordersLoading,
}: ComponentProp){


    const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleOrderClick = (order: KitchenOrder) => {
        setSelectedOrder(order);
        setIsDialogOpen(true);
    };

    return <>
    
        <Header
            handleProccessPanelToggle={handleProccessPanelToggle}
            isProccessPanelOpen={isProccessPanelOpen}
        />

        <main className="scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-amber-500 hover:scrollbar-thumb-amber-600 scrollbar-gutter-stable min-w-0 px-5 py-4 sm:px-7">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">Kitchen orders</p>
                    {ordersLoading && <span className="text-xs text-muted-foreground">Refreshing…</span>}
                </div>
                {ordersError && (
                    <p role="alert" className="text-xs text-destructive">{ordersError}</p>
                )}
            </div>
            <Tabs defaultValue="all" className="w-full gap-3 flex flex-col">
                <TabsList variant="line" className="h-auto w-full justify-start gap-5 border-b px-0 pb-0">
                    <TabsTrigger value="all" className="flex-none px-1 pb-2 text-sm">All</TabsTrigger>
                    <TabsTrigger value="dine-in" className="flex-none px-1 pb-2 text-sm">Dine in</TabsTrigger>
                    <TabsTrigger value="take-out" className="flex-none px-1 pb-2 text-sm">Take out</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                    <OrderRail orders={orders} onSelectOrder={handleOrderClick} />
                </TabsContent>
                <TabsContent value="dine-in">
                    <OrderRail onSelectOrder={handleOrderClick} orders={orders.filter((order) => order.type === "Dine in")} />
                </TabsContent>
                <TabsContent value="take-out">
                    <OrderRail onSelectOrder={handleOrderClick} orders={orders.filter((order) => order.type === "Take out")} />
                </TabsContent>
            </Tabs>
            <MenuCategoryBrowser onSelectMenu={onSelectMenu} category={menuCategory} />
        </main>
    
        <Dialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
        >
            <DialogContent className="w-[calc(100%-2rem)] max-w-lg">
                {selectedOrder && (
                    <>
                        <DialogHeader className="gap-2">
                            <DialogTitle className="text-lg">
                                Order #{selectedOrder.orderNumber}
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground">
                                Elapsed: {selectedOrder.elapsed}
                            </p>
                        </DialogHeader>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800 dark:bg-orange-950/40 dark:text-orange-300">
                                {selectedOrder.type}
                            </span>
                            <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                    selectedOrder.payment_status === "paid"
                                        ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300"
                                        : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                                }`}
                            >
                                {selectedOrder.payment_status === "paid" ? "Paid" : "Pay later"}
                            </span>
                        </div>

                        <section aria-label="Order details" className="space-y-2">
                            <h3 className="text-sm font-semibold">Order details</h3>
                            {selectedOrder.order.length === 0 ? (
                                <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                                    No item details available.
                                </p>
                            ) : (
                                <ul className="max-h-[45vh] space-y-2 overflow-y-auto">
                                    {selectedOrder.order.map((item, itemIndex) => (
                                        <li
                                            key={`${item.name}-${itemIndex}`}
                                            className="rounded-lg border bg-card p-3"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <span className="text-sm font-medium">{item.name}</span>
                                                <span className="shrink-0 text-sm font-semibold tabular-nums">
                                                    × {item.quantity}
                                                </span>
                                            </div>
                                            {item.modifiers.length > 0 && (
                                                <ul className="mt-2 space-y-1 border-t pt-2">
                                                    {item.modifiers.map((modifier, modifierIndex) => (
                                                        <li
                                                            key={`${modifier.name}-${modifierIndex}`}
                                                            className="flex justify-between gap-3 text-xs text-muted-foreground"
                                                        >
                                                            <span>{modifier.name}</span>
                                                            <span className="shrink-0 tabular-nums">
                                                                × {modifier.quantity}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        {selectedOrder.payment_status === "pay_later" && (
                            <div className="flex items-center justify-between gap-3 rounded-lg bg-orange-50 px-4 py-3 dark:bg-orange-950/30">
                                <span className="text-sm font-medium">Total payment</span>
                                <span className="text-base font-bold tabular-nums text-orange-800 dark:text-orange-300">
                                    {selectedOrder.totalPayment === undefined
                                        ? "—"
                                        : formatPayment(selectedOrder.totalPayment)}
                                </span>
                            </div>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>

    </>
}