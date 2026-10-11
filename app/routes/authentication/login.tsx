import api from "~/lib/axios";
import type { Route } from "./+types/login";
import LoginForm from "./login-form";
import axios from "axios";
import { redirect } from "react-router";
import { toast } from "sonner";
import { useEffect } from "react";


export async function clientLoader(){
  try{
    const response = await api.get('user');
    return response.data
  } catch (err) {
    return null
  }
}

export async function clientAction({ request } : Route.ClientActionArgs){
    if(request.method !== "POST") return


    const formData = await request.formData()
    const data = Object.fromEntries(formData)

    try{
      const response = await api.post('/login', data)

      if(response.data.two_factor){
        toast.info('2FA Enabled')
      }

      return redirect('/')

    } catch (err) {
      if(axios.isAxiosError(err)){
        switch(err.response?.status){
          case 422:
            return {error: true, type: "credentials", message: err.response?.data.message, buster: Date.now()}
          case 429:
            return {error: true, type: "server", message: err.response?.data.message, buster: Date.now()}
        }
      }
    }

    return {error: true, type: "form", message: "Server Error", buster: Date.now()}

}

export default function Login({ actionData, loaderData } : Route.ComponentProps){

    useEffect(() => {
      if(loaderData) window.location.href = "/"
    }, []);

    return (<>
      <main className="animate-in fade-in duration-500 ease-out scroll-smooth w-full h-[99vh] flex items-center justify-center">
        <LoginForm {...actionData} ></LoginForm>
      </main>
    </>)
}