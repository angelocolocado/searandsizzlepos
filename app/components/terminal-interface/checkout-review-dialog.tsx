import { useState } from "react";
import { ArrowLeft, Banknote, Check, CreditCard } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import type { OrderLine } from "~/types/menu-category";

type OrderType = "dine-in" | "takeout";
type PaymentMethod = "cash" | "cashless";

type ComponentProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    cart: OrderLine[]
    itemCount: number
    totalAmount: number | null
    formatPrice: (price: number) => string
    isSubmitting: boolean
    onProcessPayment: (
        paymentMethod: PaymentMethod,
        orderType: "dine_in" | "take_out",
        payLater: boolean
    ) => void
}

export function CheckoutReviewDialog({
    open,
    onOpenChange,
    cart,
    itemCount,
    totalAmount,
    formatPrice,
    isSubmitting,
    onProcessPayment,
}: ComponentProps) {
    const [orderType, setOrderType] = useState<OrderType>("dine-in")
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
    const [payLater, setPayLater] = useState(false)
    const [cashReceived, setCashReceived] = useState("")

    const cashReceivedAmount = Number(cashReceived || 0)
    const changeDue = totalAmount === null
        ? 0
        : Math.max(0, cashReceivedAmount - totalAmount)

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
    }

    const selectPaymentMethod = (method: PaymentMethod) => {
        setPaymentMethod(method);
        setCashReceived("");
        console.log("Payment method selected:", method);
    }

    const processPayment = () => {
        if (paymentMethod === null) return;
        if (totalAmount === null) return;
        if (!payLater && paymentMethod === "cash" && totalAmount !== null && cashReceivedAmount < totalAmount) return;

        onProcessPayment(paymentMethod, orderType === "dine-in" ? "dine_in" : "take_out", payLater);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="max-h-[92dvh] w-[min(96vw,76rem)] max-w-none overflow-y-auto p-0 sm:max-w-none"
            >
                <div className="grid md:grid-cols-[0.95fr_1.05fr] lg:min-h-[min(38rem,86dvh)] lg:grid-cols-[0.9fr_1fr_0.8fr]">
                    <section className="flex min-h-64 min-w-0 flex-col border-b p-4 sm:p-5 md:row-span-2 md:border-r lg:row-span-1 lg:p-6">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                    Order summary
                                </p>
                                <h2 className="mt-1 text-lg font-semibold">Review your order</h2>
                            </div>
                            <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                                {itemCount} {itemCount === 1 ? "item" : "items"}
                            </span>
                        </div>
                        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto md:max-h-[55dvh] lg:max-h-none">
                            {cart.map((line) => (
                                <article key={line.menuId} className="rounded-xl border bg-card p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="truncate text-sm font-semibold">{line.menu.name}</h3>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {formatPrice(line.menu.selling_price)} each · Qty {line.quantity}
                                            </p>
                                        </div>
                                        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">
                                            {line.quantity}x
                                        </span>
                                    </div>
                                    {line.modifiers.length > 0 && (
                                        <ul className="mt-2.5 space-y-1.5 border-t pt-2">
                                            {line.modifiers.map((modifier) => (
                                                <li key={modifier.modifierId} className="flex justify-between gap-3 text-xs">
                                                    <span className="min-w-0 truncate text-muted-foreground">
                                                        + {modifier.modifier.name} × {modifier.quantity}
                                                    </span>
                                                    <span className="shrink-0 font-medium">
                                                        {formatPrice(modifier.modifier.price * modifier.quantity)}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </article>
                            ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-green-50 px-4 py-3 dark:bg-green-950/30">
                            <span className="text-sm font-medium">Total due</span>
                            <span className="text-lg font-bold tabular-nums text-green-700 dark:text-green-400 sm:text-xl">
                                {totalAmount === null ? "—" : formatPrice(totalAmount)}
                            </span>
                        </div>
                    </section>

                    <section className="min-w-0 p-4 sm:p-5 lg:p-6">
                        <DialogHeader className="mb-4 text-left">
                            <DialogTitle className="text-lg">
                                Complete your order
                            </DialogTitle>
                            <DialogDescription>
                                Choose dine-in or takeout, then select how you’ll pay.
                            </DialogDescription>
                        </DialogHeader>

                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Order type
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {(["dine-in", "takeout"] as const).map((type) => (
                                    <Button
                                        key={type}
                                        type="button"
                                        variant={orderType === type ? "default" : "outline"}
                                        aria-pressed={orderType === type}
                                        className={orderType === type ? "h-11 bg-green-600 text-white hover:bg-green-700" : "h-11"}
                                        onClick={() => setOrderType(type)}
                                    >
                                        {orderType === type && <Check />}
                                        {type === "dine-in" ? "Dine in" : "Takeout"}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border p-3.5">
                            <input
                                type="checkbox"
                                checked={payLater}
                                onChange={(event) => setPayLater(event.currentTarget.checked)}
                                className="mt-0.5 size-4 accent-green-600"
                            />
                            <span>
                                <span className="block text-sm font-semibold">Record as pay later</span>
                                <span className="mt-0.5 block text-xs text-muted-foreground">
                                    Collect payment after the order is prepared.
                                </span>
                            </span>
                        </label>

                        <div className="mt-5">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Payment method
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    aria-pressed={paymentMethod === "cash"}
                                    className={`h-auto min-h-16 justify-start gap-2 px-2.5 sm:gap-3 sm:px-3 ${paymentMethod === "cash" ? "border-green-600 bg-green-50 ring-1 ring-green-600 dark:bg-green-950/30" : ""}`}
                                    onClick={() => selectPaymentMethod("cash")}
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
                                    className={`h-auto min-h-16 justify-start gap-2 px-2.5 sm:gap-3 sm:px-3 ${paymentMethod === "cashless" ? "border-green-600 bg-green-50 ring-1 ring-green-600 dark:bg-green-950/30" : ""}`}
                                    onClick={() => selectPaymentMethod("cashless")}
                                >
                                    <CreditCard className="size-5 shrink-0 text-green-700" />
                                    <span className="text-left">
                                        <span className="block font-semibold">Cashless</span>
                                        <span className="block text-[11px] text-muted-foreground sm:text-xs">Card or e-wallet</span>
                                    </span>
                                </Button>
                            </div>
                        </div>

                        <div className="mt-5 rounded-xl border bg-muted/30 p-3.5 sm:p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Payment details
                            </p>
                            <div className="mt-3 flex items-center justify-between gap-3">
                                <span className="text-sm text-muted-foreground">Amount due</span>
                                <span className="text-lg font-bold tabular-nums">
                                    {totalAmount === null ? "—" : formatPrice(totalAmount)}
                                </span>
                            </div>
                            {paymentMethod === "cash" && !payLater && (
                                <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
                                    <span className="text-sm text-muted-foreground">Change</span>
                                    <span className="text-sm font-semibold tabular-nums">
                                        {formatPrice(changeDue)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </section>

                    {paymentMethod === "cash" && !payLater && totalAmount !== null ? (
                        <section className="flex min-w-0 flex-col border-t bg-muted/20 p-4 sm:p-5 md:col-start-2 lg:col-start-auto lg:border-t-0 lg:border-l lg:p-6">
                            <div className="mb-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Cash received
                                </p>
                                <div className="mt-2 rounded-xl border bg-background px-3 py-2.5 text-right sm:px-4">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-left text-xs text-muted-foreground">Amount received</p>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 px-2 text-xs"
                                            onClick={() => setCashReceived("")}
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                    <p className="mt-1 text-xl font-bold tabular-nums sm:text-2xl">
                                        {formatPrice(cashReceivedAmount)}
                                    </p>
                                </div>
                            </div>
                            <div className="grid flex-1 grid-cols-3 gap-2">
                                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "."].map((key) => (
                                    <Button
                                        key={key}
                                        type="button"
                                        variant={key === "⌫" || key === "." ? "outline" : "secondary"}
                                        className="h-10 rounded-xl text-lg font-semibold tabular-nums sm:h-12"
                                        aria-label={key === "⌫" ? "Delete last digit" : key === "." ? "Enter decimal point" : `Enter ${key}`}
                                        onClick={() => {
                                            if (key === "⌫") setCashReceived((current) => current.slice(0, -1));
                                            else appendCashDigit(key);
                                        }}
                                    >
                                        {key}
                                    </Button>
                                ))}
                            </div>
                            {cashReceivedAmount < (totalAmount ?? 0) && (
                                <p className="mt-2 text-center text-xs text-muted-foreground">
                                    Enter at least {totalAmount === null ? "the total" : formatPrice(totalAmount)} to continue.
                                </p>
                            )}
                        </section>
                    ) : (
                        <section className="flex min-w-0 flex-col items-center justify-center border-t bg-muted/20 p-5 text-center md:col-start-2 lg:col-start-auto lg:border-t-0 lg:border-l">
                            <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                                {paymentMethod === "cashless" ? <CreditCard /> : <Banknote />}
                            </span>
                            <p className="font-semibold">
                                {payLater
                                    ? "Payment will be collected later"
                                    : paymentMethod === "cashless"
                                        ? "Cashless payment"
                                        : "Select a payment method"}
                            </p>
                            <p className="mt-1 max-w-52 text-sm text-muted-foreground">
                                {payLater
                                    ? "The kitchen order will be recorded as unpaid."
                                    : paymentMethod === "cashless"
                                        ? "No cash calculator is needed for this payment."
                                        : "Choose cash to enter the amount received."}
                            </p>
                        </section>
                    )}

                    <div className="col-span-full flex flex-col-reverse gap-2 border-t bg-background p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 md:px-5 lg:px-6">
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-10 gap-2"
                            onClick={() => onOpenChange(false)}
                        >
                            <ArrowLeft className="size-4" />
                            Back to order
                        </Button>
                        <Button
                            type="button"
                            className="h-11 bg-green-600 px-6 text-white hover:bg-green-700"
                            disabled={
                                isSubmitting ||
                                totalAmount === null ||
                                paymentMethod === null ||
                                (!payLater && paymentMethod === "cash" && totalAmount !== null && cashReceivedAmount < totalAmount)
                            }
                            onClick={processPayment}
                        >
                            {isSubmitting ? "Processing..." : payLater ? "Place pay-later order" : "Process to payment"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
