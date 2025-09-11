import { Avatar } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { signIn } from "@/lib/auth/auth";
import { LogOut, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export function UserButton() {
    const handleSignOut = async () => {
        try {
            await signOut({ callbackUrl: "/signin" });
        } catch (error) {
            console.error("Sign out failed:", error);
        }
    };
    const { data: session } = useSession();
    return <div>
        <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full border p-3 bg-gray-300 cursor-pointer">
                <User />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="px-3">
                <div>
                    <p>
                        {session?.user?.name}
                    </p>
                    <p>
                        {session?.user?.email}
                    </p>
                </div>
                <Separator />
                <DropdownMenuItem onClick={handleSignOut} >
                    Sign out
                    <LogOut />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
}