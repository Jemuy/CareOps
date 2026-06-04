import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/lib/theme-context";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/Layout";
import NotFound from "@/pages/not-found";

import { Dashboard } from "@/pages/Dashboard";
import { Alerts } from "@/pages/Alerts";
import { ChildrenList } from "@/pages/Children";
import { ChildDetail } from "@/pages/ChildDetail";
import { Safeguarding } from "@/pages/Safeguarding";
import { Incidents } from "@/pages/Incidents";
import { Workforce } from "@/pages/Workforce";
import { StaffDetail } from "@/pages/StaffDetail";
import { Training } from "@/pages/Training";
import { Regulation } from "@/pages/Regulation";
import { Governance } from "@/pages/Governance";
import { Inspection } from "@/pages/Inspection";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/children" component={ChildrenList} />
        <Route path="/children/:id" component={ChildDetail} />
        <Route path="/safeguarding" component={Safeguarding} />
        <Route path="/incidents" component={Incidents} />
        <Route path="/workforce" component={Workforce} />
        <Route path="/workforce/:id" component={StaffDetail} />
        <Route path="/training" component={Training} />
        <Route path="/regulation" component={Regulation} />
        <Route path="/governance" component={Governance} />
        <Route path="/inspection" component={Inspection} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="careops-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
