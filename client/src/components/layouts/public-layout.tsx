import { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-white py-8 text-center text-sm text-gray-500">
        <div className="container">
          <p>© 2025 Fashion Buddy. All rights reserved.</p>
          <div className="mt-4 flex justify-center space-x-6">
            <a href="#" className="text-gray-400 hover:text-gray-600">
              Terms
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-600">
              Privacy
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-600">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}