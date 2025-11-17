"use client"
import { usePathname } from "next/navigation";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname.startsWith("/auth");
    const isDashboard = pathname.startsWith("/dashboard")
    
    return (
        <>
            {!isAuthPage && !isDashboard && <Navbar />}
            {children}
            {!isAuthPage && !isDashboard && <Footer />}
        </>
    );
}

