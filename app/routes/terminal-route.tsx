import TerminalInterface from "~/components/terminal-interface/app-terminal-interface";
import type { Route } from "./+types/terminal-route";
import api from "~/lib/axios";

export async function clientLoader({ } : Route.ClientActionArgs){

    const [sidebar_data] = await Promise.all([
        api.get('/v1/menu-categories')
    ])

    return{
        sidebar_data: sidebar_data ?? []
    }

}

export default function TerminalRoute({ loaderData } : Route.ComponentProps){

    return <TerminalInterface />
}