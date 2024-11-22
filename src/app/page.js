"use client"
import { Button } from "@/components/ui/button"
import {useAuth} from "@/context/AuthContext"
import { useRouter } from 'next/navigation';
 
import Link from "next/link";
import "./styles.css"  
import { useEffect } from "react";
 
  
export default function Home() {
  const user = useAuth()
  const router = useRouter()
  useEffect(() =>
  
  {
   const maindivider = document.getElementById("maindivider")
   if (maindivider) {
    maindivider.classList.add('page-transition-enter-active')
    const timeout = setTimeout(() => {
      requestAnimationFrame(() => {
        // Remove 'page-transition-enter' and add 'page-transition-enter-active'
        maindivider.classList.remove("page-transition-enter-active");
        maindivider.classList.add("page-transition-enter");
      });}, 500); // Timeout after 5 seconds
  }
   
  }, []) 
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full">
        <div className="flex gap-4 items-center flex-col sm:flex-col w-full">
            <h1 className="text-4xl font-bold text-center">Welcome to Junera</h1>
            <p className="text-center text-muted-foreground">A new way to find STEM jobs.</p>
            <div className="flex gap-4"> 
            <div id="maindivider" className="pointer-events-none fixed inset-0 w-full h-full bg-black bg-opacity-50 z-50"></div>
              <Link href="/login">
                <Button className="w-full">Get Started</Button>
                </Link>
                <Button className="w-full" variant="outline">Learn More</Button>
            </div>
      <div>
    </div>
        </div>
      </main>
    </div>
  );
}
