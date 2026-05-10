import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";

import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Dashboard from "@/pages/dashboard";
import Trips from "@/pages/trips/index";
import NewTrip from "@/pages/trips/new";
import TripDetail from "@/pages/trips/detail";
import Cities from "@/pages/cities/index";
import CityDetail from "@/pages/cities/detail";
import Activities from "@/pages/activities/index";
import Community from "@/pages/community/index";
import PublicTripView from "@/pages/community/public-trip";
import Profile from "@/pages/profile";
import AdminDashboard from "@/pages/admin/index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected Routes Wrapper */}
      <Route path="/dashboard" component={() => <AppLayout><Dashboard /></AppLayout>} />
      <Route path="/trips" component={() => <AppLayout><Trips /></AppLayout>} />
      <Route path="/trips/new" component={() => <AppLayout><NewTrip /></AppLayout>} />
      <Route path="/trips/:tripId" component={({params}) => <AppLayout><TripDetail params={params} /></AppLayout>} />
      
      <Route path="/cities" component={() => <AppLayout><Cities /></AppLayout>} />
      <Route path="/cities/:cityId" component={({params}) => <AppLayout><CityDetail params={params} /></AppLayout>} />
      
      <Route path="/activities" component={() => <AppLayout><Activities /></AppLayout>} />
      
      <Route path="/community" component={() => <AppLayout><Community /></AppLayout>} />
      <Route path="/community/:shareCode" component={({params}) => <AppLayout><PublicTripView params={params} /></AppLayout>} />
      
      <Route path="/profile" component={() => <AppLayout><Profile /></AppLayout>} />
      <Route path="/admin" component={() => <AppLayout><AdminDashboard /></AppLayout>} />
      
      {/* Root redirect handles auth state in useAuthRedirect */}
      <Route path="/" component={() => <AppLayout><Dashboard /></AppLayout>} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
