import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Sparkles, ArrowLeft, Plus, Trash2, Clock, CalendarOff, CalendarCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAvailableTimes, useBlockedDates } from "@/hooks/useSchedule";
import { useQueryClient } from "@tanstack/react-query";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const AdminSchedule = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: times, isLoading: loadingTimes } = useAvailableTimes();
  const { data: blockedDates, isLoading: loadingBlocked } = useBlockedDates();

  const [newTime, setNewTime] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [rangeStart, setRangeStart] = useState("09:00");
  const [rangeEnd, setRangeEnd] = useState("18:00");
  const [rangeInterval, setRangeInterval] = useState(30);
  const [blockReason, setBlockReason] = useState("");
  const [selectedBlockDate, setSelectedBlockDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);

  // Auth check
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
      if (!roles?.some((r: any) => r.role === "admin")) { toast.error("Acesso restrito."); navigate("/"); }
    };
    check();
  }, [navigate]);

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  // Add single time slot
  const addTime = async () => {
    if (!newTime) return;
    setLoading(true);
    const { error } = await supabase.from("available_times").insert({
      time_slot: newTime,
      day_of_week: selectedDays,
    });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Horário já existe!" : error.message);
    } else {
      toast.success(`Horário ${newTime} adicionado!`);
      setNewTime("");
      queryClient.invalidateQueries({ queryKey: ["available_times"] });
    }
    setLoading(false);
  };

  // Generate range of times
  const generateRange = async () => {
    const slots: string[] = [];
    const [sh, sm] = rangeStart.split(":").map(Number);
    const [eh, em] = rangeEnd.split(":").map(Number);
    let current = sh * 60 + sm;
    const end = eh * 60 + em;
    while (current < end) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      current += rangeInterval;
    }
    if (slots.length === 0) { toast.error("Intervalo inválido."); return; }

    setLoading(true);
    // Filter out duplicates
    const existing = new Set(times?.map((t) => t.time_slot) || []);
    const newSlots = slots.filter((s) => !existing.has(s));
    if (newSlots.length === 0) { toast.info("Todos os horários já existem."); setLoading(false); return; }

    const { error } = await supabase.from("available_times").insert(
      newSlots.map((s) => ({ time_slot: s, day_of_week: selectedDays }))
    );
    if (error) toast.error(error.message);
    else {
      toast.success(`${newSlots.length} horários adicionados!`);
      queryClient.invalidateQueries({ queryKey: ["available_times"] });
    }
    setLoading(false);
  };

  // Delete time slot
  const deleteTime = async (id: string) => {
    const { error } = await supabase.from("available_times").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Horário removido.");
      queryClient.invalidateQueries({ queryKey: ["available_times"] });
    }
  };

  // Block a date
  const blockDate = async () => {
    if (!selectedBlockDate) return;
    setLoading(true);
    const dateStr = format(selectedBlockDate, "yyyy-MM-dd");
    const { error } = await supabase.from("blocked_dates").insert({
      blocked_date: dateStr,
      reason: blockReason.trim() || null,
    });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Data já bloqueada!" : error.message);
    } else {
      toast.success(`${format(selectedBlockDate, "dd/MM/yyyy")} bloqueado!`);
      setSelectedBlockDate(undefined);
      setBlockReason("");
      queryClient.invalidateQueries({ queryKey: ["blocked_dates"] });
    }
    setLoading(false);
  };

  // Unblock a date
  const unblockDate = async (id: string) => {
    const { error } = await supabase.from("blocked_dates").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Data liberada.");
      queryClient.invalidateQueries({ queryKey: ["blocked_dates"] });
    }
  };

  const blockedDateSet = new Set(blockedDates?.map((b) => b.blocked_date) || []);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center h-16 gap-4">
          <Link to="/dashboard" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Painel
          </Link>
          <span className="font-display text-lg font-semibold text-foreground">
            <Sparkles className="inline w-4 h-4 mr-1 text-primary" />
            Agenda & Horários
          </span>
        </div>
      </nav>

      <div className="container max-w-4xl py-12 space-y-12" style={{ animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>

        {/* === SECTION: Time Slots === */}
        <section className="space-y-6">
          <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Horários Disponíveis
          </h2>

          {/* Add single */}
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <h3 className="font-semibold text-foreground text-sm">Adicionar horário individual</h3>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <Label>Horário</Label>
                <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="w-32" />
              </div>
              <div className="space-y-1">
                <Label>Dias da semana</Label>
                <div className="flex gap-1">
                  {DAYS.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => toggleDay(i)}
                      className={cn(
                        "w-9 h-9 rounded-lg text-xs font-medium transition-colors",
                        selectedDays.includes(i) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={addTime} disabled={loading || !newTime} className="gap-1.5">
                <Plus className="w-4 h-4" /> Adicionar
              </Button>
            </div>
          </div>

          {/* Generate range */}
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <h3 className="font-semibold text-foreground text-sm">Gerar intervalo automático</h3>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <Label>Início</Label>
                <Input type="time" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} className="w-28" />
              </div>
              <div className="space-y-1">
                <Label>Fim</Label>
                <Input type="time" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} className="w-28" />
              </div>
              <div className="space-y-1">
                <Label>Intervalo (min)</Label>
                <Input type="number" value={rangeInterval} onChange={(e) => setRangeInterval(Number(e.target.value))} className="w-20" min={10} max={120} />
              </div>
              <Button onClick={generateRange} disabled={loading} variant="secondary" className="gap-1.5">
                Gerar horários
              </Button>
            </div>
          </div>

          {/* Time list */}
          <div className="bg-card rounded-xl border p-6">
            <h3 className="font-semibold text-foreground text-sm mb-4">Horários cadastrados</h3>
            {loadingTimes ? (
              <p className="text-muted-foreground text-sm">Carregando...</p>
            ) : !times || times.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum horário cadastrado. Adicione acima.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {times.map((t) => (
                  <div key={t.id} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                    <div>
                      <span className="font-medium text-foreground text-sm">{t.time_slot}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {t.day_of_week.map((d) => DAYS[d]).join(", ")}
                      </span>
                    </div>
                    <button onClick={() => deleteTime(t.id)} className="text-destructive hover:text-destructive/80 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* === SECTION: Blocked Dates === */}
        <section className="space-y-6">
          <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarOff className="w-5 h-5 text-destructive" /> Datas Bloqueadas
          </h2>

          <div className="flex flex-col sm:flex-row gap-6">
            {/* Calendar to block */}
            <div className="bg-card rounded-xl border p-4 shadow-sm">
              <Calendar
                mode="single"
                selected={selectedBlockDate}
                onSelect={setSelectedBlockDate}
                locale={ptBR}
                disabled={(date) => date < new Date()}
                modifiers={{ blocked: (date) => blockedDateSet.has(format(date, "yyyy-MM-dd")) }}
                modifiersClassNames={{ blocked: "bg-destructive/20 text-destructive line-through" }}
                className="pointer-events-auto"
              />
              {selectedBlockDate && (
                <div className="mt-4 space-y-2">
                  <Input
                    placeholder="Motivo (ex: Feriado)"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                  />
                  <Button onClick={blockDate} disabled={loading} variant="destructive" className="w-full gap-1.5">
                    <CalendarOff className="w-4 h-4" />
                    Bloquear {format(selectedBlockDate, "dd/MM")}
                  </Button>
                </div>
              )}
            </div>

            {/* Blocked list */}
            <div className="flex-1 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Datas bloqueadas</h3>
              {loadingBlocked ? (
                <p className="text-muted-foreground text-sm">Carregando...</p>
              ) : !blockedDates || blockedDates.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhuma data bloqueada.</p>
              ) : (
                <div className="space-y-2">
                  {blockedDates.map((b) => (
                    <div key={b.id} className="flex items-center justify-between bg-muted rounded-lg px-4 py-3">
                      <div>
                        <span className="font-medium text-foreground text-sm">
                          {format(new Date(b.blocked_date + "T12:00:00"), "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                        </span>
                        {b.reason && <span className="text-xs text-muted-foreground ml-2">— {b.reason}</span>}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => unblockDate(b.id)} className="gap-1 text-xs">
                        <CalendarCheck className="w-3.5 h-3.5" /> Liberar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminSchedule;
