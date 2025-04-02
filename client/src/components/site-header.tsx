import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Fashion Buddy Logo" className="h-10" />
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-white">
            Features
          </Link>
          <Link href="#howitworks" className="text-sm font-medium text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-white">
            How It Works
          </Link>
          <Link href="#pricing" className="text-sm font-medium text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-white">
            Pricing
          </Link>
          <Link href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-white">
            Testimonials
          </Link>
        </nav>
        <div className="hidden md:flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
              Start for Free
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="#pricing">
              Premium
            </Link>
          </Button>
        </div>
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-3/4 bg-white dark:bg-gray-900 p-6 shadow-lg">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <img src="/logo.svg" alt="Fashion Buddy Logo" className="h-8" />
              </div>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X />
              </button>
            </div>
            <nav className="flex flex-col gap-4">
              <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-white py-2">
                Features
              </Link>
              <Link href="#howitworks" className="text-sm font-medium text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-white py-2">
                How It Works
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-white py-2">
                Pricing
              </Link>
              <Link href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-white py-2">
                Testimonials
              </Link>
              <div className="mt-6 flex flex-col gap-3">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    Start for Free
                  </Link>
                </Button>
                <Button size="sm" className="w-full" asChild>
                  <Link href="#pricing" onClick={() => setMobileMenuOpen(false)}>
                    Premium
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}