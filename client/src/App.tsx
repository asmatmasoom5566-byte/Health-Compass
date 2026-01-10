import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import History from "@/pages/History";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Palette } from "lucide-react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/history" component={History} />
      <Route component={NotFound} />
    </Switch>
  );
}

const THEMES = ["teal", "blue", "green", "red", "purple", "orange"];

function App() {
  const [fontSize, setFontSize] = useState(14);
  const [theme, setTheme] = useState("teal");

  useEffect(() => {
    document.documentElement.style.setProperty('--app-font-size', `${fontSize}px`);
  }, [fontSize]);

  useEffect(() => {
    const root = document.documentElement;
    THEMES.forEach(t => root.classList.remove(`theme-${t}`));
    if (theme !== "teal") {
      root.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  const cycleTheme = () => {
    const currentIndex = THEMES.indexOf(theme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setTheme(THEMES[nextIndex]);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-background/80 backdrop-blur shadow-sm p-1.5 rounded-full border border-border">
          <div className="flex items-center gap-1 border-r pr-2">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7 rounded-full" 
              onClick={() => setFontSize(s => Math.max(12, s - 1))}
              title="Decrease font size"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-[10px] font-bold w-4 text-center">{fontSize}</span>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7 rounded-full" 
              onClick={() => setFontSize(s => Math.min(20, s + 1))}
              title="Increase font size"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-7 w-7 rounded-full text-primary" 
            onClick={cycleTheme}
            title="Change theme color"
          >
            <Palette className="h-4 w-4" />
          </Button>
        </div>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
