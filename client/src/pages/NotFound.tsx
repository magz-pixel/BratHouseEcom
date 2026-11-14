import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";
import { SiteShell } from "@/components/SiteShell";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <SiteShell>
    <div className="not-found-screen min-h-[55vh] w-full flex items-center justify-center px-4 py-20">
      <Card className="not-found-card w-full max-w-lg mx-4 shadow-lg border-0">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse" />
              <AlertCircle className="relative h-16 w-16 text-red-500" />
            </div>
          </div>

          <h1 className="not-found-code text-4xl font-bold mb-2">404 / NOPE</h1>

          <h2 className="text-xl font-semibold text-slate-700 mb-4">
            That page ghosted.
          </h2>

          <p className="text-slate-600 mb-8 leading-relaxed">
            The link went missing, babe. The hair is still right here.
          </p>

          <div
            id="not-found-button-group"
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              onClick={handleGoHome}
              className="bubble-button bubble-button--pink"
            >
              <Home className="w-4 h-4 mr-2" />
              Find your crown
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    </SiteShell>
  );
}
