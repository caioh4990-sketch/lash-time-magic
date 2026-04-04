import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowLeft, Clock, Check, User, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useServices, type Service } from "@/hooks/useServices";
import { useCategories } from "@/hooks/useCategories";
import { useAvailableTimes, useBlockedDates, useBookedSlots } from "@/hooks/useSchedule";

const Booking = () => {
  const { data: services, isLoading: loadingServices } = useServices();
  const { data: categories } = useCategories();
  const { data: dbTimes } = useAvailableTimes();
  const { data: blockedDates } = useBlockedDates();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-select first category
  useEffect(() => {
    if (categories && categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const filteredServices = services?.filter((s) =>
    selectedCategoryId ? s.category_id === selectedCategoryId : true
  );

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const { data: bookedSlots } = useBookedSlots(selectedDateStr);

  // Build blocked date set for calendar
  const blockedDateSet = new Set(blockedDates?.map((b) => b.blocked_date) || []);

  // Compute available times from DB, filtering by day of week and booked slots
  useEffect(() => {
    if (!selectedDate || !dbTimes) { setAvailableTimes([]); setSelectedTime(null); return; }
    const dayOfWeek = selectedDate.getDay();
    const booked = new Set(bookedSlots || []);
    const times = dbTimes
      .filter((t) => t.day_of_week.includes(dayOfWeek))
      .map((t) => t.time_slot)
      .filter((t) => !booked.has(t));
    setAvailableTimes(times);
    setSelectedTime(null);
  }, [selectedDate, dbTimes, bookedSlots]);

  const service = services?.find((s) => s.id === selectedServiceId);

  const handleConfirm = async () => {
    if (!service || !selectedDate || !selectedTime || !clientName.trim() || !clientPhone.trim()) return;
    setLoading(true);

    const dateFormatted = format(selectedDate, "dd/MM/yyyy");
    const msg = encodeURIComponent(
      `Olá! Acabei de agendar pelo site:\n\n` +
      `\u2022 Nome: ${clientName}\n` +
      `\u2022 Serviço: ${service.title}\n` +
      `\u2022 Data: ${dateFormatted}\n` +
      `\u2022 Horário: ${selectedTime}\n` +
      `\u2022 Valor: R$ ${service.price}\n\n` +
      `\u2022 Endereço: https://maps.app.goo.gl/9i5Xc8LAdvyaRe7M8\n` +
      `\u2022 Ref: Em cima da loja Chica Pitanga\n\n` +
      `Aguardo confirmação!`
    );
    const whatsappUrl = `https://wa.me/5527995764231?text=${msg}`;

    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const { error } = await supabase.from("appointments").insert({
        service_name: service.title,
        appointment_date: dateStr,
        appointment_time: selectedTime,
        price: service.price,
        status: "confirmed",
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
      });
      if (error) throw error;
      toast.success("Agendamento confirmado! Redirecionando para o WhatsApp...");

      setTimeout(() => {
        window.location.href = whatsappUrl;
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || "Erro ao agendar.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center h-16 gap-4">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          ) : (
            <Link to="/site" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao site
            </Link>
          )}
          <span className="font-display text-lg font-semibold text-foreground">
            <Sparkles className="inline w-4 h-4 mr-1 text-primary" />
            Agendar
          </span>
        </div>
      </nav>

      <div className="container max-w-2xl py-12 space-y-8" style={{ animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>
        {/* Steps indicator */}
        <div className="flex items-center gap-2 justify-center">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 4 && <div className={cn("w-12 h-0.5", step > s ? "bg-primary" : "bg-muted")} />}
            </div>
          ))}
        </div>

        {/* Step 1: Service */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-center">Escolha o serviço</h2>

            {/* Category tabs */}
            {categories && categories.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategoryId(cat.id); setSelectedServiceId(null); }}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all",
                      selectedCategoryId === cat.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {loadingServices ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-xl border animate-pulse bg-muted" />)}
              </div>
            ) : filteredServices && filteredServices.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {filteredServices.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedServiceId(s.id)}
                    className={cn(
                      "p-5 rounded-xl border text-left transition-all hover:shadow-md active:scale-[0.98]",
                      selectedServiceId === s.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    <div className="flex gap-3">
                      {s.image_url && (
                        <img src={s.image_url} alt={s.title} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-display font-semibold text-foreground">{s.title}</h3>
                        {s.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-2 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" /> {s.duration}
                          </span>
                          {s.price > 0 && (
                            <span className="font-semibold text-primary">R$ {s.price}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum serviço nesta categoria.</p>
            )}
            <div className="text-center">
              <Button onClick={() => setStep(2)} disabled={!selectedServiceId} variant="hero" size="lg">
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Client info */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-center">Seus dados</h2>
            <div className="bg-card rounded-xl border p-6 space-y-4 max-w-sm mx-auto">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nome completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Maria Silva"
                    className="pl-10"
                    maxLength={100}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPhone">WhatsApp *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="clientPhone"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(27) 99999-9999"
                    className="pl-10"
                    maxLength={20}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
              <Button onClick={() => setStep(3)} disabled={!clientName.trim() || !clientPhone.trim()} variant="hero" size="lg">
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Date & Time */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-center">Escolha a data e horário</h2>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <div className="bg-card rounded-xl border p-4 shadow-sm">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  disabled={(date) => {
                    const dateStr = format(date, "yyyy-MM-dd");
                    return date < new Date() || blockedDateSet.has(dateStr);
                  }}
                  modifiers={{ blocked: (date) => blockedDateSet.has(format(date, "yyyy-MM-dd")) }}
                  modifiersClassNames={{ blocked: "bg-destructive/20 text-destructive line-through" }}
                  className="pointer-events-auto"
                />
              </div>
              {selectedDate && availableTimes.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </p>
                  <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                    {availableTimes.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.96]",
                          selectedTime === time
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        )}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {selectedDate && availableTimes.length === 0 && (
                <p className="text-muted-foreground text-sm">Sem horários disponíveis neste dia.</p>
              )}
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
              <Button onClick={() => setStep(4)} disabled={!selectedDate || !selectedTime} variant="hero" size="lg">
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && service && selectedDate && selectedTime && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-center">Confirmar agendamento</h2>
            <div className="bg-card rounded-xl border p-6 shadow-sm space-y-4 max-w-sm mx-auto">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cliente</span>
                <span className="font-medium text-foreground">{clientName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">WhatsApp</span>
                <span className="font-medium text-foreground">{clientPhone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Serviço</span>
                <span className="font-medium text-foreground">{service.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Data</span>
                <span className="font-medium text-foreground">{format(selectedDate, "dd/MM/yyyy")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Horário</span>
                <span className="font-medium text-foreground">{selectedTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duração</span>
                <span className="font-medium text-foreground">{service.duration}</span>
              </div>
              <hr />
              <div className="flex justify-between">
                <span className="font-medium text-foreground">Total</span>
                <span className="font-bold text-primary text-lg">R$ {service.price}</span>
              </div>
              <hr />
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">📍 Endereço:</p>
                <a href="https://maps.app.goo.gl/9i5Xc8LAdvyaRe7M8" target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">
                  Ver no Google Maps
                </a>
                <p className="text-muted-foreground">📌 Ref: Em cima da loja Chica Pitanga</p>
              </div>
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setStep(3)}>Voltar</Button>
              <Button onClick={handleConfirm} disabled={loading} variant="hero" size="lg">
                {loading ? "Confirmando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Booking;
