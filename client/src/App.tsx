import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import LandingPage from "@/pages/landing";
import { PublicLayout } from "@/components/layouts/public-layout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <PublicLayout>
          <LandingPage />
        </PublicLayout>
      )} />
      <Route path="/dashboard" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;