"use client"

import { useSession, signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { LogIn, LogOut, User } from "lucide-react";
import Link from "next/link";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserButton() {
    const { data: session } = useSession();

    if (!session?.user) {
        return (
            <Link href={'/signin'}>
                <button className="group relative inline-flex h-9 items-center justify-center overflow-hidden rounded-full px-4 font-medium shadow-xl transition-all duration-300">
                    <span className="mr-2 text-sm font-semibold">Sign In</span>
                    <LogIn className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    <div className="absolute inset-0 -z-10" />
                </button>
            </Link>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative flex h-9 w-9 items-center justify-center rounded-full ring-offset-zinc-950 transition-all hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2 focus:outline-none">
                    <Avatar className="h-9 w-9 border">
                        {session.user.image ? (
                            <AvatarImage
                                src={session.user.image}
                                alt={session.user.name || "User"}
                                className="object-cover"
                            />
                        ) : null}
                        <AvatarFallback className="font-bold text-xs">
                            {session.user.name ? getInitials(session.user.name) : <User className="h-4 w-4" />}
                        </AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-60 overflow-hidden rounded-xl border p-1 backdrop-blur-xl shadow-2xl"
            >
                <DropdownMenuLabel className="font-normal p-3">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{session.user.name}</p>
                        <p className="text-xs leading-none truncate">{session.user.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-200" />
                <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm text-red-400 focus:bg-red-500/10 focus:text-red-400"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}