import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, Calendar, Clock, User, Phone, Settings, Image, Tag, CalendarCog, CheckCircle, XCircle, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type TabKey = "confirmed" | "completed" | "cancelled" | "pending";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "confirmed", label: "Agendados", icon: <Calendar className="w-4 h-4" /> },
  { key: "pending", label: "Pendentes", icon: <Clock className="w-4 h-4" /> },
  { key: "completed", label: "Concluídos", icon: <CheckCircle className="w-4 h-4" /> },
  { key: "cancelled", label: "Cancelados", icon: <XCircle className="w-4 h-4" /> },
];

const statusColors: Record<string, string> = {
  confirmed: "bg-green-900/30 text-green-400",
  cancelled: "bg-red-900/30 text-red-400",
  completed: "bg-blue-900/30 text-blue-400",
  pending: "bg-yellow-900/30 text-yellow-400",
};

const statusLabels: Record<string, string> = {
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Concluído",
  pending: "Pendente",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("confirmed");

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      setUser(session.user);

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (!roles?.some((r: any) => r.role === "admin")) {
        toast.error("Acesso restrito ao administrador.");
        navigate("/");
        return;
      }

      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("appointment_date", { ascending: false })
        .limit(500);

      if (error) toast.error("Erro ao carregar agendamentos.");
      else setAppointments(data || []);
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

  const filtered = appointments.filter((a) => a.status === activeTab);

  const counts = appointments.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/admin/servicos">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Serviços</span>
              </Button>
            </Link>
            <Link to="/admin/categorias">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Tag className="w-4 h-4" />
                <span className="hidden sm:inline">Categorias</span>
              </Button>
            </Link>
            <Link to="/admin/galeria">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Image className="w-4 h-4" />
                <span className="hidden sm:inline">Galeria</span>
              </Button>
            </Link>
            <Link to="/admin/agenda">
              <Button variant="outline" size="sm" className="gap-1.5">
                <CalendarCog className="w-4 h-4" />
                <span className="hidden sm:inline">Agenda</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-muted-foreground">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container py-12 max-w-4xl" style={{ animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Painel Administrativo 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todos os agendamentos do studio.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border text-muted-foreground hover:bg-primary/10 hover:text-primary"
              )}
            >
              {tab.icon}
              {tab.label}
              {counts[tab.key] > 0 && (
                <span className={cn(
                  "ml-1 px-2 py-0.5 rounded-full text-xs font-bold",
                  activeTab === tab.key
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <Filter className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Nenhum agendamento com status "{statusLabels[activeTab]}".
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((apt, i) => (
              <div
                key={apt.id}
                className="bg-card rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition-shadow"
                style={{ animation: `fade-up 0.5s cubic-bezier(0.16,1,0.3,1) ${0.05 * i}s both` }}
              >
                <div className="space-y-1">
                  <h3 className="font-display font-semibold text-foreground">{apt.service_name}</h3>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {apt.client_name && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {apt.client_name}
                      </span>
                    )}
                    {apt.client_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {apt.client_phone}
                      </span>
                    )}
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
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={cn("px-3 py-1 rounded-full text-xs font-medium", statusColors[apt.status] || "bg-muted text-muted-foreground")}>
                    {statusLabels[apt.status] || apt.status}
                  </span>
                  <span className="font-semibold text-primary">
                    R$ {apt.price}
                  </span>
                  {/* Action buttons based on current status */}
                  {(apt.status === "confirmed" || apt.status === "pending") && (
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
                  {apt.status === "cancelled" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleStatusChange(apt.id, "confirmed")}
                    >
                      Reativar
                    </Button>
                  )}
                  {apt.status === "completed" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleStatusChange(apt.id, "confirmed")}
                    >
                      Reabrir
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
