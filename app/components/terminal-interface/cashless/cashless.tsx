import { CircleX, Printer, QrCode, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react"
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { echo } from "~/lib/echo";
import { CART_STORAGE_KEY } from "~/lib/order-cart-storage";
import { AnimatedCheckmark } from "~/components/animations/checkmark";
import ButtonPrint from "../print-service/thermal-printer";

type ComponentProps = {
    amount: number
}

export default function CashlessWindow({ amount } : ComponentProps){

    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [intentId, setIntentId] = useState(null);
    const [isPaid, setIsPaid] = useState(false);
    const [isFailed, setIsFailed] = useState(false);
    
    const fetcher = useFetcher()
    const isLoading = fetcher.state !== "idle"


    useEffect(() => {
        if (!fetcher.data?.success || !fetcher.data.data) return

        setIsPaid(false)
        setIsFailed(false)
        setIntentId(fetcher.data.data.payment_intent_id)
        setQrCodeUrl(fetcher.data.data.qr_code_url)

    }, [fetcher.data])

    useEffect(() => {
        if(!intentId) return

        const channel = echo.channel(`payment.${intentId}`)

        channel.listen('.PaymentSuccessful', () => {
            setIsFailed(false)
            setIsPaid(true)
        })

        channel.listen('.PaymentFailed', () => {
            setIsPaid(false)
            setIsFailed(true)
        })

        return () => {
            echo.leaveChannel(`payment.${intentId}`);
        }

    }, [intentId]);

    const handleRequestQrCode = (amount: number) => {

        setIsPaid(false)
        setIsFailed(false)
        const cart_data = window.localStorage.getItem(CART_STORAGE_KEY)

        fetcher.submit({
            amount: amount,
            cart_uuid: cart_data ? JSON.parse(cart_data).cart_uuid : null,
            intent: "request_qr"
        }, {
            method: "POST",
            action: "/process-cashless"
        })
    }

    return <>
    
        <section className="flex min-w-0 flex-col items-center justify-center border-t bg-muted/20 p-5 text-center md:col-start-2 lg:col-start-auto lg:border-t-0 lg:border-l">
            <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                <QrCode />
            </span>
            <p className="font-semibold">
                Cashless Payment - QR PH
            </p>

            {isPaid ? (
                <div
                    role="status"
                    className="mt-6 flex w-full max-w-sm flex-col items-center rounded-2xl border border-green-200 bg-green-50 px-6 py-7 shadow-sm dark:border-green-900 dark:bg-green-950/30"
                >
                    <span className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/60">
                        <AnimatedCheckmark loop={false} size={42} className="text-green-700 dark:text-green-300" />
                    </span>
                    <h2 className="mt-4 text-xl font-bold text-green-800 dark:text-green-200">
                        Payment successful
                    </h2>
                    <p className="mt-1 text-sm text-green-800/80 dark:text-green-200/80">
                        Your payment of{" "}
                        {new Intl.NumberFormat("en-PH", {
                            style: "currency",
                            currency: "PHP",
                        }).format(amount)}{" "}
                        has been received.
                    </p>
                </div>
            ) : isFailed ? (
                <div
                    role="alert"
                    className="mt-6 flex w-full max-w-sm flex-col items-center rounded-2xl border border-red-200 bg-red-50 px-6 py-7 shadow-sm dark:border-red-900 dark:bg-red-950/30"
                >
                    <span className="flex size-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/60 dark:text-red-300">
                        <CircleX className="size-9" />
                    </span>
                    <h2 className="mt-4 text-xl font-bold text-red-800 dark:text-red-200">
                        Payment not completed
                    </h2>
                    <p className="mt-1 text-sm text-red-800/80 dark:text-red-200/80">
                        The payment was declined or cancelled. You can try again with a new QR code.
                    </p>
                    <Button
                        type="button"
                        disabled={isLoading}
                        onClick={() => {
                            setIntentId(null)
                            setQrCodeUrl(null)
                            handleRequestQrCode(amount)
                        }}
                        className="mt-5 gap-2 bg-red-700 text-white hover:bg-red-800"
                    >
                        {isLoading ? <Spinner /> : <RotateCcw />}
                        Generate a new QR
                    </Button>
                </div>
            ) : !qrCodeUrl || !intentId ? <>
            
                <Button disabled={isLoading} onClick={() => handleRequestQrCode(amount)} className="mt-5 bg-green-600 px-6 text-white hover:bg-green-700">
                    {isLoading && !qrCodeUrl && !intentId ? <><Spinner /> Generating QR</> : 'Generate QR'}
                </Button>

            </> : <>
            
                <div className="w-full flex flex-col items-center">
                    <h3>Scan using GCash, Maya, or any Bank App</h3>
                    <img src={qrCodeUrl} alt="QR Ph Code" style={{ width: '250px', height: '250px' }} />
                    <p className="text-[10px] font-light">Screen will automatically update or perform manually check.</p>

                    <div className="mt-5 flex w-full flex-wrap items-center justify-center gap-2">
                        <ButtonPrint mode="print_qr" text="Print Receipt" isDisabled={isLoading} qr_object={qrCodeUrl} />
                        <Button disabled={isLoading} className="bg-green-900 text-white hover:bg-green-700">
                            {isLoading ? <><Spinner /> Generating QR</> : <><RotateCcw /> Manual Check</>}
                        </Button>
                    </div>
                </div>
            
            </>}

        </section>
    
    </>
}
