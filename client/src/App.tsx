import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Router as WouterRouter, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { HASH_ROUTER } from "@/lib/routing";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { StoreProvider } from "@/contexts/StoreContext";

const WigsPage = lazy(() => import("./pages/WigsPage"));
const BuildPage = lazy(() => import("./pages/BuildPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const LookbookPage = lazy(() => import("./pages/InfoPages").then((module) => ({ default: module.LookbookPage })));
const AboutPage = lazy(() => import("./pages/InfoPages").then((module) => ({ default: module.AboutPage })));
const FAQPage = lazy(() => import("./pages/InfoPages").then((module) => ({ default: module.FAQPage })));
const ContactPage = lazy(() => import("./pages/InfoPages").then((module) => ({ default: module.ContactPage })));
const ShippingPage = lazy(() => import("./pages/InfoPages").then((module) => ({ default: module.ShippingPage })));
const CarePage = lazy(() => import("./pages/InfoPages").then((module) => ({ default: module.CarePage })));
const CartPage = lazy(() => import("./pages/CheckoutPages").then((module) => ({ default: module.CartPage })));
const CheckoutPage = lazy(() => import("./pages/CheckoutPages").then((module) => ({ default: module.CheckoutPage })));
const OrderPreviewPage = lazy(() => import("./pages/CheckoutPages").then((module) => ({ default: module.OrderPreviewPage })));
const OrderStatusPage = lazy(() => import("./pages/CheckoutPages").then((module) => ({ default: module.OrderStatusPage })));

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/build" component={BuildPage} />
      <Route path="/shop/wigs" component={WigsPage} />
      <Route path="/shop/bundles">{() => <Redirect to="/shop/wigs" />}</Route>
      <Route path="/product/:slug" component={ProductPage} />
      <Route path="/lookbook" component={LookbookPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/shipping" component={ShippingPage} />
      <Route path="/care" component={CarePage} />
      <Route path="/cart" component={CartPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/order/preview" component={OrderPreviewPage} />
      <Route path="/order/:id" component={OrderStatusPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  useEffect(() => {
    document.querySelector(".seo-prerender")?.remove();
  }, []);
  return (
    <ErrorBoundary>
      <StoreProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Suspense fallback={<div className="route-loading" role="status" aria-live="polite">Loading your next look…</div>}>
              {HASH_ROUTER ? <WouterRouter hook={useHashLocation}><Router /></WouterRouter> : <Router />}
            </Suspense>
          </TooltipProvider>
        </ThemeProvider>
      </StoreProvider>
    </ErrorBoundary>
  );
}

export default App;
