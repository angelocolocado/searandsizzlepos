export type OrderCardData = {
	orderNumber: number;
	itemCount: number;
	elapsed: string;
	type: "Dine in" | "Take out";
};

type DineInCardProps = {
	order: OrderCardData;
};

export function DineInCard({ order }: DineInCardProps) {
	const isDineIn = order.type === "Dine in";

	return (
		<article
			aria-label={`Order number ${order.orderNumber}, ${order.itemCount} items, ${order.type}, ${order.elapsed}`}
			className={`flex h-[90px] animate-in fade-in duration-800 ease-out w-32 shrink-0 flex-col justify-between rounded-md border px-2 py-2 shadow-sm ${
				isDineIn
					? "border-orange-300 bg-orange-50/80 dark:border-orange-800 dark:bg-orange-950/20"
					: "border-rose-400 bg-rose-50/70 dark:border-rose-800 dark:bg-rose-950/20"
			}`}
		>
			<div className="space-y-0.5">
				<h2 className="text-[11px] leading-4 font-bold text-foreground">
					ORDER # {order.orderNumber}
				</h2>
				<p className="text-[10px] leading-3 font-semibold text-muted-foreground">
					Item: {order.itemCount}x
				</p>
				<p className="text-[9px] leading-3 text-muted-foreground/80">
					{order.elapsed}
				</p>
			</div>
			<span
				className={`w-fit rounded-full px-2 py-0.5 text-[9px] leading-3 font-semibold text-white ${
					isDineIn ? "bg-amber-700" : "bg-red-700"
				}`}
			>
				{order.type}
			</span>
		</article>
	);
}
