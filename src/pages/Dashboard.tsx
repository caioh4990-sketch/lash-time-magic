import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, CalendarPlus, Calendar, Clock, User, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);

      // Check admin role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      
      if (roles?.some((r: any) => r.role === "admin")) {
        setIsAdmin(true);
      }

      // Fetch appointments
      let query = supabase.from("appointments").select("*").order("appointment_date", { ascending: true });
      
      if (!roles?.some((r: any) => r.role === "admin")) {
        query = query.eq("user_id", session.user.id);
      }

      const { data, error } = await query;
      if (error) {
        toast.error("Erro ao carregar agendamentos.");
      } else {
        setAppointments(data || []);
      }
      setLoading(false);
    };

    init();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar status.");
    } else {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
      toast.success("Status atualizado!");
    }
  };

  const statusColors: Record<string, string> = {
    confirmed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-blue-100 text-blue-700",
    pending: "bg-yellow-100 text-yellow-700",
  };

  const statusLabels: Record<string, string> = {
    confirmed: "Confirmado",
    cancelled: "Cancelado",
    completed: "Concluído",
    pending: "Pendente",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="font-display text-lg font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-primary" />
            Studio Karol Negrini
          </Link>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link to="/admin/servicos">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Settings className="w-4 h-4" />
                  Serviços
                </Button>
              </Link>
            )}
            {!isAdmin && (
              <Link to="/agendar">
                <Button variant="hero" size="sm" className="gap-1.5">
                  <CalendarPlus className="w-4 h-4" />
                  Novo
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-muted-foreground">
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </nav>

      <div className="container py-12 max-w-4xl" style={{ animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Olá, {user?.user_metadata?.full_name || "Cliente"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin
              ? "Gerencie todos os agendamentos do studio."
              : "Veja e gerencie seus agendamentos."}
          </p>
        </div>

        {appointments.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhum agendamento encontrado.</p>
            {!isAdmin && (
              <Link to="/agendar">
                <Button variant="hero">Agendar agora</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt, i) => (
              <div
                key={apt.id}
                className="bg-card rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition-shadow"
                style={{ animation: `fade-up 0.5s cubic-bezier(0.16,1,0.3,1) ${0.05 * i}s both` }}
              >
                <div className="space-y-1">
                  <h3 className="font-display font-semibold text-foreground">{apt.service_name}</h3>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {apt.appointment_date
                        ? format(new Date(apt.appointment_date + "T12:00:00"), "dd/MM/yyyy")
                        : "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {apt.appointment_time || "—"}
                    </span>
                    {isAdmin && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {apt.user_id?.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("px-3 py-1 rounded-full text-xs font-medium", statusColors[apt.status] || "bg-muted text-muted-foreground")}>
                    {statusLabels[apt.status] || apt.status}
                  </span>
                  <span className="font-semibold text-primary">
                    R$ {apt.price}
                  </span>
                  {isAdmin && apt.status === "confirmed" && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleStatusChange(apt.id, "completed")}
                      >
                        Concluir
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive"
                        onClick={() => handleStatusChange(apt.id, "cancelled")}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                  {!isAdmin && apt.status === "confirmed" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive"
                      onClick={() => handleStatusChange(apt.id, "cancelled")}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
