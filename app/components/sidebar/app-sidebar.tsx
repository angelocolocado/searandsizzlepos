import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar"
import { SidebarNavigations } from "./inventory"
import { navItems } from "./data"
import { useFetcher } from "react-router"
import { useEffect, useState } from "react"
import { NavUser } from "./user"
import { useUser } from "~/context/UserContext"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Button } from "../ui/button"
import { LogOut } from "lucide-react"

export type SidebarData = {
  isHidden?: boolean
  category: string
  id: number
}

export function AppSidebar() {

  const [isSignOutOpen, setIsSignOutOpen] = useState(false)
  const fetcher = useFetcher<{ success: boolean; message?: string }>()
  const isSigningOut = fetcher.state !== "idle"
  const [sidebarData, setSidebarData] = useState<SidebarData[]>([]);
  const { user } = useUser()

  const displayName = user?.name?.trim() || user?.username || "Administrator"


  useEffect(() => {

    if (fetcher.state === "idle" && fetcher.data?.success) {
      window.location.href = "/login"
    }
  }, [fetcher.data, fetcher.state])

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                    
                    <div className="flex aspect-square size-10 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                      <img src="/logo.png" alt="" />
                    </div>
                    <p className="font-logo font-semibold tracking-wide text-xl">Sear and Sizzle</p>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>


        {sidebarData.length > 0 && <SidebarNavigations title="Menu" nav_items={sidebarData}  />}

      </SidebarContent>
      <SidebarFooter>
        {user ? (
          <NavUser
            user={{ name: displayName, email: user.email }}
            onSignOut={() => setIsSignOutOpen(true)}
          />
        ) : null}

      </SidebarFooter>
      <Dialog open={isSignOutOpen} onOpenChange={setIsSignOutOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Sign out?</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out of your account?
            </DialogDescription>
          </DialogHeader>
          {fetcher.data && !fetcher.data.success && (
            <p role="alert" aria-live="assertive" className="text-sm text-destructive">
              {fetcher.data.message ?? "Unable to sign out. Please try again."}
            </p>
          )}
          <DialogFooter>
            <DialogClose
              render={<Button type="button" variant="ghost" disabled={isSigningOut}>Cancel</Button>}
            />
            <fetcher.Form method="post" action="/logout">
              <Button type="submit" variant="destructive" disabled={isSigningOut}>
                <LogOut aria-hidden="true" />
                {isSigningOut ? "Signing out..." : "Yes, sign out"}
              </Button>
            </fetcher.Form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}