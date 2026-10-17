import api from "~/lib/axios";
import type { Route } from "./+types/cashless-route";
import { success } from "zod";

export async function clientAction({ request } : Route.ClientActionArgs){
    if(request.method != "POST") return;

    const formData = await request.formData()
    const data = Object.fromEntries(formData)

    switch(formData.get('intent')){
        case 'request_qr': return await handleSubmitRequestQrCode(data)
    }

}

async function handleSubmitRequestQrCode(data: any){
    try{
        const response = await api.post('/v1/checkout/paymongo', data)

        return {
            success: true,
            intent: "request_qr",
            data: response.data
        }
    } catch(err){
        return {
            success: false,
            intent: "request_qr"
        }
    }
}