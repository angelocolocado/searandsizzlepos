import { Header } from "./header/app-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { DineInCard } from "./tabs/dine-in-card";
import { MenuCategoryBrowser } from "./menu-category-browser";
import type { KitchenOrder, MenuCategory, MenuItem } from "~/types/menu-category";

function OrderRail({ orders }: {
    orders: KitchenOrder[];
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
                    <OrderRail orders={orders} />
                </TabsContent>
                <TabsContent value="dine-in">
                    <OrderRail orders={orders.filter((order) => order.type === "Dine in")} />
                </TabsContent>
                <TabsContent value="take-out">
                    <OrderRail orders={orders.filter((order) => order.type === "Take out")} />
                </TabsContent>
            </Tabs>
            <MenuCategoryBrowser onSelectMenu={onSelectMenu} category={menuCategory} />
        </main>
    
    </>
}