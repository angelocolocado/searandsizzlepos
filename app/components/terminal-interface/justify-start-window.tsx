import { Header } from "./header/app-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { DineInCard } from "./tabs/dine-in-card";
import { MenuCategoryBrowser } from "./menu-category-browser";
import type { KitchenOrder, MenuCategory, MenuItem } from "~/types/menu-category";
import { useState } from "react";
import type { RefObject } from "react";
import axios from "axios";
import { Banknote, Check, CreditCard, Printer } from "lucide-react";
import { toast } from "sonner";
import api from "~/lib/axios";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { getKitchenOrderPricing } from "~/lib/kitchen-order-pricing";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import ButtonPrint, { type OrderPrinterHandle } from "./print-service/thermal-printer";

const VOID_REASONS = [
    { value: "1", label: "Customer Changed Mind" },
    { value: "2", label: "Cashier Encoding Error" },
    { value: "3", label: "Out of Stock / Unavailable" },
    { value: "4", label: "Quality Issue / Damaged" },
] as const;

type PaymentMethod = "cash" | "cashless";

function getActionErrorMessage(error: unknown, fallback: string) {
    if (axios.isAxiosError(error)) {
        const responseData: unknown = error.response?.data;
        if (typeof responseData === "object" && responseData !== null) {
            const data = responseData as Record<string, unknown>;
            if (typeof data.message === "string") return data.message;
            if (typeof data.errors === "object" && data.errors !== null) {
                const messages = Object.values(data.errors)
                    .flatMap((value) => Array.isArray(value) ? value : [])
                    .filter((value): value is string => typeof value === "string");
                if (messages.length > 0) return messages.join(" ");
            }
        }
        if (!error.response) return "The service could not be reached. Check your connection and try again.";
    }

    return error instanceof Error ? error.message : fallback;
}

const formatPayment = (amount: number) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(amount);

function OrderRail({ orders, onSelectOrder }: {
    orders: KitchenOrder[],
    onSelectOrder: (order: KitchenOrder) => void;
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
    onKitchenOrderUpdated: () => void
    orderPrinterRef: RefObject<OrderPrinterHandle | null>
    onReprintOrder: (order: KitchenOrder) => Promise<void>
}

export function MainView({
    onSelectMenu,
    handleProccessPanelToggle,
    isProccessPanelOpen,
    menuCategory,
    orders,
    ordersError,
    ordersLoading,
    onKitchenOrderUpdated,
    orderPrinterRef,
    onReprintOrder,
}: ComponentProp){


    const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isActionSubmitting, setIsActionSubmitting] = useState(false);
    const [isReprintingOrder, setIsReprintingOrder] = useState(false);
    const [voidReason, setVoidReason] = useState<string | null>(null);
    const [isPayMethodSelectionOpen, setIsPayMethodSelectionOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [cashReceived, setCashReceived] = useState("");
    const cashReceivedAmount = Number(cashReceived || 0);
    const selectedOrderPricing = selectedOrder
        ? getKitchenOrderPricing(selectedOrder, menuCategory)
        : null;
    const totalPayment = selectedOrderPricing?.totalAmount ?? null;
    const changeDue = totalPayment === null
        ? 0
        : Math.max(0, cashReceivedAmount - totalPayment);

    const appendCashDigit = (digit: string) => {
        setCashReceived((current) => {
            if (current.length >= 12) return current;
            if (digit === ".") {
                if (current.includes(".")) return current;
                return current ? `${current}.` : "0.";
            }
            if (current.includes(".") && current.split(".")[1].length >= 2) return current;
            if (current === "0") return digit;
            return `${current}${digit}`;
        });
    };

    const handleOrderClick = (order: KitchenOrder) => {
        setSelectedOrder(order);
        setVoidReason(null);
        setIsPayMethodSelectionOpen(false);
        setPaymentMethod(null);
        setCashReceived("");
        setIsDialogOpen(true);
    };

    const handleReprintSelectedOrder = async () => {
        if (!selectedOrder || isReprintingOrder) return;

        setIsReprintingOrder(true);
        try {
            await onReprintOrder(selectedOrder);
        } finally {
            setIsReprintingOrder(false);
        }
    };

    const handleOrderStatus = async (status: "cooked" | "void") => {
        if (!selectedOrder || isActionSubmitting) return;

        const reason = VOID_REASONS.find((option) => option.value === voidReason);
        if (status === "void" && !reason) return;

        setIsActionSubmitting(true);
        try {
            await api.patch(`v1/orders/${selectedOrder.orderNumber}/status`, {
                status,
                ...(status === "void" && reason ? { void_reason: Number(reason.value) } : {}),
            });
            toast.success(status === "cooked" ? "Order marked as cooked." : "Order voided.");
            setIsDialogOpen(false);
            setVoidReason(null);
            onKitchenOrderUpdated();
        } catch (error) {
            toast.error(getActionErrorMessage(error, "Could not update this order."));
        } finally {
            setIsActionSubmitting(false);
        }
    };

    const handlePayLaterOrder = async () => {
        if (!selectedOrder || !paymentMethod || isActionSubmitting) return;
        if (
            paymentMethod === "cash" &&
            (totalPayment === null || cashReceivedAmount < totalPayment)
        ) return;

        setIsActionSubmitting(true);
        try {
            await api.post(`v1/orders/${selectedOrder.orderNumber}/pay`, {
                payment_method: paymentMethod,
            });
            toast.success("Pay-later order payment recorded.");
            setSelectedOrder((currentOrder) => currentOrder
                ? { ...currentOrder, payment_status: "paid" }
                : currentOrder);
            setIsPayMethodSelectionOpen(false);
            setPaymentMethod(null);
            onKitchenOrderUpdated();
        } catch (error) {
            toast.error(getActionErrorMessage(error, "Could not process this payment."));
        } finally {
            setIsActionSubmitting(false);
        }
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
                <div className="flex items-center gap-3">
                    {ordersError && (
                        <p role="alert" className="text-xs text-destructive">{ordersError}</p>
                    )}
                    <ButtonPrint
                        ref={orderPrinterRef}
                        mode="print_order"
                        text="Print Order"
                        isDisabled={false}
                    />
                </div>
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
            <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto">
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
                                    {selectedOrderPricing?.items.map((item, itemIndex) => (
                                        <li
                                            key={`${item.name}-${itemIndex}`}
                                            className="rounded-lg border bg-card p-3"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <span className="text-sm font-medium">{item.name}</span>
                                                    {item.unitPrice !== undefined && (
                                                        <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                                                            {formatPayment(item.unitPrice)} each
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <span className="block text-sm font-semibold tabular-nums">
                                                        × {item.quantity}
                                                    </span>
                                                    {item.unitPrice !== undefined && (
                                                        <span className="text-xs text-muted-foreground tabular-nums">
                                                            {formatPayment(item.unitPrice * item.quantity)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {item.modifiers.length > 0 && (
                                                <ul className="mt-2 space-y-1 border-t pt-2">
                                                    {item.modifiers.map((modifier, modifierIndex) => (
                                                        <li
                                                            key={`${modifier.name}-${modifierIndex}`}
                                                            className="flex justify-between gap-3 text-xs text-muted-foreground"
                                                        >
                                                            <span>
                                                                {modifier.name}
                                                                {modifier.unitPrice !== undefined && (
                                                                    <span> · {formatPayment(modifier.unitPrice)} each</span>
                                                                )}
                                                            </span>
                                                            <span className="shrink-0 text-right tabular-nums">
                                                                × {modifier.quantity}
                                                                {modifier.unitPrice !== undefined && (
                                                                    <span className="block">
                                                                        {formatPayment(modifier.unitPrice * modifier.quantity)}
                                                                    </span>
                                                                )}
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

                        <div className="flex items-center justify-between gap-3 rounded-lg bg-orange-50 px-4 py-3 dark:bg-orange-950/30">
                            <span className="text-sm font-medium">Total payment</span>
                            <span className="text-base font-bold tabular-nums text-orange-800 dark:text-orange-300">
                                {totalPayment === null ? "Price unavailable" : formatPayment(totalPayment)}
                            </span>
                        </div>

                        {isPayMethodSelectionOpen ? (
                            <section className="space-y-3 border-t pt-4">
                                <div>
                                    <h3 className="text-sm font-semibold">Settle payment</h3>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Choose how this pay-later order is being paid.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        aria-pressed={paymentMethod === "cash"}
                                        disabled={isActionSubmitting}
                                        className={`h-auto min-h-16 justify-start gap-2 px-2.5 sm:gap-3 sm:px-3 ${paymentMethod === "cash" ? "border-green-600 bg-green-50 ring-1 ring-green-600 dark:bg-green-950/30" : ""}`}
                                        onClick={() => {
                                            setPaymentMethod("cash");
                                            setCashReceived("");
                                        }}
                                    >
                                        <Banknote className="size-5 shrink-0 text-green-700" />
                                        <span className="text-left">
                                            <span className="block font-semibold">Cash</span>
                                            <span className="block text-[11px] text-muted-foreground sm:text-xs">Pay at counter</span>
                                        </span>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        aria-pressed={paymentMethod === "cashless"}
                                        disabled={isActionSubmitting}
                                        className={`h-auto min-h-16 justify-start gap-2 px-2.5 sm:gap-3 sm:px-3 ${paymentMethod === "cashless" ? "border-green-600 bg-green-50 ring-1 ring-green-600 dark:bg-green-950/30" : ""}`}
                                        onClick={() => {
                                            setPaymentMethod("cashless");
                                            setCashReceived("");
                                        }}
                                    >
                                        <CreditCard className="size-5 shrink-0 text-green-700" />
                                        <span className="text-left">
                                            <span className="block font-semibold">Cashless</span>
                                            <span className="block text-[11px] text-muted-foreground sm:text-xs">Card or e-wallet</span>
                                        </span>
                                    </Button>
                                </div>
                                {paymentMethod === "cash" && totalPayment !== null && (
                                    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Cash received
                                            </p>
                                            <div className="mt-2 rounded-lg border bg-background px-3 py-2.5 text-right">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-left text-xs text-muted-foreground">Amount received</p>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 px-2 text-xs"
                                                        disabled={isActionSubmitting}
                                                        onClick={() => setCashReceived("")}
                                                    >
                                                        Clear
                                                    </Button>
                                                </div>
                                                <p className="mt-1 text-xl font-bold tabular-nums">
                                                    {formatPayment(cashReceivedAmount)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "."].map((key) => (
                                                <Button
                                                    key={key}
                                                    type="button"
                                                    variant={key === "⌫" || key === "." ? "outline" : "secondary"}
                                                    className="h-10 rounded-xl text-lg font-semibold tabular-nums"
                                                    aria-label={key === "⌫" ? "Delete last digit" : key === "." ? "Enter decimal point" : `Enter ${key}`}
                                                    disabled={isActionSubmitting}
                                                    onClick={() => {
                                                        if (key === "⌫") {
                                                            setCashReceived((current) => current.slice(0, -1));
                                                        } else {
                                                            appendCashDigit(key);
                                                        }
                                                    }}
                                                >
                                                    {key}
                                                </Button>
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-between gap-3 border-t pt-3">
                                            <span className="text-sm text-muted-foreground">Change</span>
                                            <span className="text-sm font-semibold tabular-nums">
                                                {formatPayment(changeDue)}
                                            </span>
                                        </div>
                                        {cashReceivedAmount < totalPayment && (
                                            <p className="text-center text-xs text-muted-foreground">
                                                Enter at least {formatPayment(totalPayment)} to continue.
                                            </p>
                                        )}
                                    </div>
                                )}
                                {paymentMethod === "cash" && totalPayment === null && (
                                    <p role="alert" className="text-sm text-destructive">
                                        The total payment is unavailable, so cash settlement cannot continue.
                                    </p>
                                )}
                                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={isActionSubmitting}
                                        onClick={() => {
                                            setIsPayMethodSelectionOpen(false);
                                            setPaymentMethod(null);
                                        }}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        type="button"
                                        className="bg-green-600 text-white hover:bg-green-700"
                                        disabled={
                                            !paymentMethod ||
                                            isActionSubmitting ||
                                            (paymentMethod === "cash" &&
                                                (totalPayment === null || cashReceivedAmount < totalPayment))
                                        }
                                        onClick={handlePayLaterOrder}
                                    >
                                        {isActionSubmitting ? "Processing..." : "Confirm payment"}
                                    </Button>
                                </div>
                            </section>
                        ) : (
                            <section className="space-y-3 border-t pt-4">
                                <Button
                                    type="button"
                                    className="w-full bg-green-600 text-white hover:bg-green-700"
                                    disabled={isActionSubmitting}
                                    onClick={() => handleOrderStatus("cooked")}
                                >
                                    <Check />
                                    {isActionSubmitting ? "Updating order..." : "Mark as cooked"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    disabled={isReprintingOrder || isActionSubmitting}
                                    onClick={handleReprintSelectedOrder}
                                >
                                    {isReprintingOrder ? <Spinner /> : <Printer />}
                                    {isReprintingOrder ? "Reprinting order..." : "Reprint order"}
                                </Button>

                                <div className="space-y-2">
                                    <label
                                        htmlFor="void-reason"
                                        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                                    >
                                        Void reason
                                    </label>
                                    <Select
                                        value={voidReason}
                                        onValueChange={setVoidReason}
                                        disabled={isActionSubmitting}
                                    >
                                        <SelectTrigger id="void-reason" className="w-full">
                                            <SelectValue placeholder="Choose a reason" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {VOID_REASONS.map((reason) => (
                                                <SelectItem key={reason.value} value={reason.value}>
                                                    {reason.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        className="w-full"
                                        disabled={!voidReason || isActionSubmitting}
                                        onClick={() => handleOrderStatus("void")}
                                    >
                                        {isActionSubmitting ? "Updating order..." : "Void order"}
                                    </Button>
                                </div>

                                {selectedOrder.payment_status === "pay_later" && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full border-orange-300 text-orange-800 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-950/30"
                                        disabled={isActionSubmitting}
                                        onClick={() => setIsPayMethodSelectionOpen(true)}
                                    >
                                        <Banknote />
                                        Pay order
                                    </Button>
                                )}
                            </section>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>

    </>
}