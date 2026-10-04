import api from "~/lib/axios";
import type { Route } from "./+types/checkout-route";

export async function clientAction({ request } : Route.ClientActionArgs){

    if(request.method !== "POST") return

    const formData = await request.formData()

    switch(formData.get('intent')){
        case "handle_recalculate": return await handleRecalculate(data)
    }

}

function handleRecalculate(data: any){
    api.post('v1/checkout', data)

    //add intent: prepare on the payload 

    
}