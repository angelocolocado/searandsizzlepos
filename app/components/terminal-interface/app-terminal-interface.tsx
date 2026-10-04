import { ProccessOrderPanel } from "./justify-end-window";
import { MainView } from "./justify-start-window";
import { useState } from "react";
import type { MenuCategory } from "~/types/menu-category";

type TerminalInterfaceProps = {
    menuCategory?: MenuCategory;
}

export default function TerminalInterface({ menuCategory }: TerminalInterfaceProps){

    const [isPrcOrderPanelOpen, setIsPrcOrderPanelOpen] = useState(false)
    const handleProccessPanelToggle = () => setIsPrcOrderPanelOpen(true)

    return <>
        <div className="flex h-screen w-full min-w-0 overflow-hidden animate-in fade-in duration-500 ease-out">
            <div className="min-w-0 flex-1">
                <MainView
                    handleProccessPanelToggle={handleProccessPanelToggle}
                    isProccessPanelOpen={isPrcOrderPanelOpen}
                    menuCategory={menuCategory}
                />
            </div>

            <div
                className={`h-full min-w-0 shrink-0 overflow-hidden transition-[flex-basis] duration-300 ease-in-out motion-reduce:transition-none ${isPrcOrderPanelOpen ? "basis-[30%]" : "basis-0"}`}
                aria-hidden={!isPrcOrderPanelOpen}
                inert={!isPrcOrderPanelOpen}
            >
                <ProccessOrderPanel handleClose={() => setIsPrcOrderPanelOpen(false)} />
            </div>
        </div>
    </>
}