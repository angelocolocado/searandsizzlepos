import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface User {
    id: number
    name: string
    type: number
    username: string
    email: string
}

interface UserContextType {
    user: User | null
    setUser: (user: User | null) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children, initialUser } : { children: ReactNode, initialUser: User | null }){
    const [user, setUser] = useState<User | null>(initialUser)

    useEffect(() => {
        setUser(initialUser)
    }, [initialUser])
    
    return (
        <UserContext.Provider value={{user, setUser}}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser(){
    const context = useContext(UserContext)
    
    if(!context) throw new Error("useUser must be used within a UserProvider");

    return context
}