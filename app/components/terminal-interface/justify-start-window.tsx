import { Header } from "./header/app-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { DineInCard, type OrderCardData } from "./tabs/dine-in-card";
import { MenuCategoryBrowser } from "./menu-category-browser";
import type { MenuCategory } from "~/types/menu-category";

const orders: OrderCardData[] = [
    { orderNumber: 1, itemCount: 3, elapsed: "1 min ago", type: "Dine in" },
    { orderNumber: 2, itemCount: 2, elapsed: "5 mins ago", type: "Take out" },
    { orderNumber: 3, itemCount: 3, elapsed: "6 mins ago", type: "Take out" },
    { orderNumber: 4, itemCount: 4, elapsed: "10 mins ago", type: "Take out" },
    { orderNumber: 5, itemCount: 4, elapsed: "16 mins ago", type: "Dine in" },
];

function OrderRail({ orders }: { orders: OrderCardData[] }) {
    return (
        <div className="flex gap-3.5 overflow-x-auto px-1 pb-3 pt-1" aria-label="Orders">
            {orders.map((order) => (
                <DineInCard key={order.orderNumber} order={order} />
            ))}
        </div>
    );
}

type ComponentProp = {
    handleProccessPanelToggle: () => void
    isProccessPanelOpen: boolean
    menuCategory?: MenuCategory
}

export function MainView({ handleProccessPanelToggle, isProccessPanelOpen, menuCategory } : ComponentProp){
    return <>
    
        <Header
            handleProccessPanelToggle={handleProccessPanelToggle}
            isProccessPanelOpen={isProccessPanelOpen}
        />

        <main className="scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-amber-500 hover:scrollbar-thumb-amber-600 scrollbar-gutter-stable min-w-0 px-5 py-4 sm:px-7">
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
            <MenuCategoryBrowser handleOpen={handleProccessPanelToggle} category={menuCategory} />
        </main>
    
    </>
}