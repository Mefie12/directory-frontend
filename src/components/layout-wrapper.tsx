"use client"
import { usePathname } from "next/navigation";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
// import BecomeVendor from "@/app/become-a-vendor/page";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname.startsWith("/auth");
    const isDashboard = pathname.startsWith("/dashboard")
    
    return (
        <>
            {!isAuthPage && !isDashboard && pathname !== "/become-a-vendor" && <Navbar />}
            {children}
            {!isAuthPage && !isDashboard && pathname !== "/become-a-vendor" && <Footer />}
        </>
    );
}

