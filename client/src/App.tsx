import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import ExamCatalog from "./pages/ExamCatalog";
import ExamRunner from "./pages/ExamRunner";
import Admin from "./pages/Admin";
import History from "./pages/History";
import Home from "./pages/Home";
import { About, Contact } from "./pages/InfoPages";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import Result from "./pages/Result";

function ScrollToTop() { const [location] = useLocation(); return <Route path={location}>{() => { window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); return null; }}</Route>; }

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/exams" component={ExamCatalog} />
    <Route path="/exams/:examId/attempt/:attemptId" component={ExamRunner} />
    <Route path="/results/:attemptId" component={Result} />
    <Route path="/history" component={History} />
    <Route path="/leaderboard" component={Leaderboard} />
    <Route path="/about" component={About} />
    <Route path="/contact" component={Contact} />
    <Route path="/admin" component={Admin} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light" switchable><TooltipProvider><Toaster richColors position="top-right" /><ScrollToTop /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
