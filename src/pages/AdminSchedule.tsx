import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Sparkles, ArrowLeft, Plus, Trash2, Clock, CalendarOff, CalendarCheck,
  CalendarDays, Save, AlertTriangle, Pencil, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAvailableTimes, useBlockedDates, useBookedSlots } from "@/hooks/useSchedule";
import { useQueryClient } from "@tanstack/react-query";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type Section = "dates" | "times" | "blocked";

const AdminSchedule = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: times, isLoading: loadingTimes } = useAvailableTimes();
  const { data: blockedDates, isLoading: loadingBlocked } = useBlockedDates();

  const [activeSection, setActiveSection] = useState<Section>("dates");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [newTime, setNewTime] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [rangeStart, setRangeStart] = useState("09:00");
  const [rangeEnd, setRangeEnd] = useState("18:00");
  const [rangeInterval, setRangeInterval] = useState(30);
  const [blockReason, setBlockReason] = useState("");
  const [selectedBlockDate, setSelectedBlockDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editTimeValue, setEditTimeValue] = useState("");

  // Get booked slots for the selected date
  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const { data: bookedSlots } = useBookedSlots(selectedDateStr);
  const bookedSet = useMemo(() => new Set(bookedSlots || []), [bookedSlots]);

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

  // Times for the selected date's day of week
  const timesForSelectedDate = useMemo(() => {
    if (!selectedDate || !times) return [];
    const dow = selectedDate.getDay();
    return times
      .filter((t) => t.day_of_week.includes(dow))
      .sort((a, b) => a.time_slot.localeCompare(b.time_slot));
  }, [selectedDate, times]);

  // Add single time slot
  const addTime = async () => {
    if (!newTime) return;
    // Check for duplicates
    const exists = times?.some((t) => t.time_slot === newTime && JSON.stringify(t.day_of_week.sort()) === JSON.stringify([...selectedDays].sort()));
    if (exists) { toast.error("Horário já existe com esses dias!"); return; }
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

  // Delete time slot with booked check
  const deleteTime = async (id: string, timeSlot: string) => {
    if (bookedSet.has(timeSlot)) {
      const ok = confirm(`O horário ${timeSlot} já está agendado para ${selectedDate ? format(selectedDate, "dd/MM/yyyy") : "esta data"}. Tem certeza que deseja removê-lo? O agendamento existente NÃO será cancelado.`);
      if (!ok) return;
    } else {
      if (!confirm(`Remover o horário ${timeSlot}?`)) return;
    }
    const { error } = await supabase.from("available_times").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Horário removido.");
      queryClient.invalidateQueries({ queryKey: ["available_times"] });
    }
  };

  // Edit time slot
  const saveEditTime = async (id: string) => {
    if (!editTimeValue) return;
    setLoading(true);
    const { error } = await supabase.from("available_times").update({ time_slot: editTimeValue }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Horário atualizado!");
      setEditingTimeId(null);
      queryClient.invalidateQueries({ queryKey: ["available_times"] });
    }
    setLoading(false);
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

  // Block selected date (quick action from the dates calendar)
  const blockSelectedDate = async () => {
    if (!selectedDate) return;
    setLoading(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const { error } = await supabase.from("blocked_dates").insert({
      blocked_date: dateStr,
      reason: null,
    });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Data já bloqueada!" : error.message);
    } else {
      toast.success(`${format(selectedDate, "dd/MM/yyyy")} bloqueado!`);
      queryClient.invalidateQueries({ queryKey: ["blocked_dates"] });
    }
    setLoading(false);
  };

  // Unblock a date
  const unblockDate = async (id: string) => {
    if (!confirm("Liberar esta data?")) return;
    const { error } = await supabase.from("blocked_dates").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Data liberada.");
      queryClient.invalidateQueries({ queryKey: ["blocked_dates"] });
    }
  };

  const blockedDateSet = new Set(blockedDates?.map((b) => b.blocked_date) || []);
  const isSelectedDateBlocked = selectedDate ? blockedDateSet.has(format(selectedDate, "yyyy-MM-dd")) : false;

  const sections: { key: Section; label: string; icon: React.ReactNode }[] = [
    { key: "dates", label: "Datas Disponíveis", icon: <CalendarDays className="w-4 h-4" /> },
    { key: "times", label: "Horários", icon: <Clock className="w-4 h-4" /> },
    { key: "blocked", label: "Datas Bloqueadas", icon: <CalendarOff className="w-4 h-4" /> },
  ];

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

      <div className="container max-w-5xl py-8 space-y-8" style={{ animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>

        {/* Section Tabs */}
        <div className="flex flex-wrap gap-2">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                activeSection === s.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border text-muted-foreground hover:bg-primary/10 hover:text-primary"
              )}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>

        {/* === SECTION: Datas Disponíveis === */}
        {activeSection === "dates" && (
          <section className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" /> Datas Disponíveis
            </h2>
            <p className="text-muted-foreground text-sm">
              Selecione uma data no calendário para ver e gerenciar os horários disponíveis naquele dia.
            </p>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Calendar */}
              <div className="bg-card rounded-xl border p-4 shadow-sm flex-shrink-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  modifiers={{
                    blocked: (date) => blockedDateSet.has(format(date, "yyyy-MM-dd")),
                  }}
                  modifiersClassNames={{
                    blocked: "bg-destructive/20 text-destructive line-through",
                  }}
                  className="pointer-events-auto"
                />
                {selectedDate && !isSelectedDateBlocked && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full mt-3 gap-1.5"
                    onClick={blockSelectedDate}
                    disabled={loading}
                  >
                    <CalendarOff className="w-4 h-4" />
                    Bloquear dia inteiro
                  </Button>
                )}
              </div>

              {/* Date details panel */}
              <div className="flex-1 space-y-4">
                {!selectedDate ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Selecione uma data no calendário para ver os horários.</p>
                  </div>
                ) : isSelectedDateBlocked ? (
                  <div className="bg-destructive/10 rounded-xl border border-destructive/20 p-6 text-center space-y-3">
                    <CalendarOff className="w-10 h-10 mx-auto text-destructive" />
                    <p className="text-foreground font-semibold">
                      {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-muted-foreground text-sm">Esta data está bloqueada.</p>
                    {(() => {
                      const blocked = blockedDates?.find(b => b.blocked_date === format(selectedDate, "yyyy-MM-dd"));
                      return blocked ? (
                        <div className="space-y-2">
                          {blocked.reason && <p className="text-sm text-muted-foreground">Motivo: {blocked.reason}</p>}
                          <Button variant="outline" size="sm" onClick={() => unblockDate(blocked.id)} className="gap-1.5">
                            <CalendarCheck className="w-4 h-4" /> Liberar esta data
                          </Button>
                        </div>
                      ) : null;
                    })()}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-card rounded-xl border p-5">
                      <h3 className="font-display font-semibold text-foreground mb-1">
                        {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </h3>
                      <p className="text-muted-foreground text-xs mb-4">
                        {DAYS[selectedDate.getDay()]} — {timesForSelectedDate.length} horário(s) disponível(is)
                      </p>

                      {timesForSelectedDate.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-4">
                          Nenhum horário configurado para {DAYS[selectedDate.getDay()]}. Vá em "Horários" para adicionar.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {timesForSelectedDate.map((t) => {
                            const isBooked = bookedSet.has(t.time_slot);
                            const isEditing = editingTimeId === t.id;

                            return (
                              <div
                                key={t.id}
                                className={cn(
                                  "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm",
                                  isBooked
                                    ? "bg-primary/10 border border-primary/20"
                                    : "bg-muted"
                                )}
                              >
                                {isEditing ? (
                                  <div className="flex items-center gap-1 w-full">
                                    <Input
                                      type="time"
                                      value={editTimeValue}
                                      onChange={(e) => setEditTimeValue(e.target.value)}
                                      className="h-7 text-xs w-24"
                                    />
                                    <button onClick={() => saveEditTime(t.id)} className="text-primary p-1">
                                      <Save className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => setEditingTimeId(null)} className="text-muted-foreground p-1">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <span className={cn("font-medium", isBooked ? "text-primary" : "text-foreground")}>
                                        {t.time_slot}
                                      </span>
                                      {isBooked && (
                                        <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium">
                                          Agendado
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                      <button
                                        onClick={() => { setEditingTimeId(t.id); setEditTimeValue(t.time_slot); }}
                                        className="text-muted-foreground hover:text-foreground p-1"
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => deleteTime(t.id, t.time_slot)}
                                        className={cn("p-1", isBooked ? "text-destructive" : "text-destructive/60 hover:text-destructive")}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-muted border" /> Disponível
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-primary/10 border border-primary/20" /> Agendado
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-destructive/20 border border-destructive/20" /> Bloqueado
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* === SECTION: Horários === */}
        {activeSection === "times" && (
          <section className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Gerenciar Horários
            </h2>

            {/* Add single */}
            <div className="bg-card rounded-xl border p-6 space-y-4">
              <h3 className="font-semibold text-foreground text-sm">Adicionar horário</h3>
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
              <h3 className="font-semibold text-foreground text-sm">Gerar horários automáticos</h3>
              <p className="text-muted-foreground text-xs">Crie vários horários de uma vez definindo o intervalo.</p>
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

            {/* All time slots */}
            <div className="bg-card rounded-xl border p-6">
              <h3 className="font-semibold text-foreground text-sm mb-4">
                Todos os horários cadastrados ({times?.length || 0})
              </h3>
              {loadingTimes ? (
                <p className="text-muted-foreground text-sm animate-pulse">Carregando...</p>
              ) : !times || times.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum horário cadastrado. Adicione acima.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {times.map((t) => (
                    <div key={t.id} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2.5">
                      {editingTimeId === t.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <Input
                            type="time"
                            value={editTimeValue}
                            onChange={(e) => setEditTimeValue(e.target.value)}
                            className="h-8 w-28"
                          />
                          <Button size="sm" variant="ghost" onClick={() => saveEditTime(t.id)} disabled={loading}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingTimeId(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <span className="font-medium text-foreground text-sm">{t.time_slot}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {t.day_of_week.map((d) => DAYS[d]).join(", ")}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => { setEditingTimeId(t.id); setEditTimeValue(t.time_slot); }}
                              className="text-muted-foreground hover:text-foreground p-1"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (!confirm(`Remover o horário ${t.time_slot}?`)) return;
                                supabase.from("available_times").delete().eq("id", t.id).then(({ error }) => {
                                  if (error) toast.error(error.message);
                                  else {
                                    toast.success("Horário removido.");
                                    queryClient.invalidateQueries({ queryKey: ["available_times"] });
                                  }
                                });
                              }}
                              className="text-destructive/60 hover:text-destructive p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* === SECTION: Datas Bloqueadas === */}
        {activeSection === "blocked" && (
          <section className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <CalendarOff className="w-5 h-5 text-destructive" /> Datas Bloqueadas
            </h2>
            <p className="text-muted-foreground text-sm">
              Bloqueie datas específicas (feriados, folgas) para que clientes não agendem nesses dias.
            </p>

            <div className="flex flex-col sm:flex-row gap-6">
              {/* Calendar to block */}
              <div className="bg-card rounded-xl border p-4 shadow-sm flex-shrink-0">
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
                  <p className="text-muted-foreground text-sm animate-pulse">Carregando...</p>
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
        )}
      </div>
    </div>
  );
};

export default AdminSchedule;
