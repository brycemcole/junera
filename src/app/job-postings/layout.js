
import Navbar from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/toast";
import { ToastViewport } from "@/components/ui/toast";
import Footer from "@/components/footer";


export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <link rel="manifest" href="/manifest.json" />
            <meta name="description" content="Your App Description" />
            <link rel="apple-touch-icon" href="/icon-192x192.png" />
            <body
                className={`antialiased min-w-full root`}
            >
                <ToastProvider>
                    <AuthProvider>
                        <ThemeProvider
                            attribute="class"
                            defaultTheme="system"
                            enableSystem
                            disableTransitionOnChange
                        >
                            <Navbar />
                            <main className="mt-24">
                                {children}
                            </main>
                            <Footer />
                            <ToastViewport />
                        </ThemeProvider>
                    </AuthProvider>
                </ToastProvider>
            </body>
        </html>
    );
}