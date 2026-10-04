import api from "~/lib/axios"
import type { Route } from "./+types/sidebar-route"

export async function clientLoader(){


    const [sidebar_data] = await Promise.all([
        api.get('/v1/menu-categories')
    ])


    return sidebar_data.data ?? []

}
