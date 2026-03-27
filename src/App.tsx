import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Booking from "./pages/Booking.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import AdminServices from "./pages/AdminServices.tsx";
import AdminGallery from "./pages/AdminGallery.tsx";
import Links from "./pages/Links.tsx";
import NotFound from "./pages/NotFound.tsx";
import WhatsAppFloat from "./components/WhatsAppFloat";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Links />} />
          <Route path="/site" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/agendar" element={<Booking />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin/servicos" element={<AdminServices />} />
          <Route path="/admin/galeria" element={<AdminGallery />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <WhatsAppFloat />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
