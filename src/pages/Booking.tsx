import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Sparkles, ArrowLeft, Clock, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const services = [
  { id: "fio-a-fio", title: "Fio a Fio", duration: "2h", price: 250 },
  { id: "volume-russo", title: "Volume Russo", duration: "2h30", price: 350 },
  { id: "volume-brasileiro", title: "Volume Brasileiro", duration: "2h", price: 300 },
  { id: "manutencao", title: "Manutenção", duration: "1h", price: 120 },
];

const Booking = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.info("Faça login para agendar.");
        navigate("/login");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (!selectedDate) return;
    const dayOfWeek = selectedDate.getDay();
    // Simple default: Mon-Fri 9-18, Sat 9-14
    const times: string[] = [];
    const start = 9;
    const end = dayOfWeek === 6 ? 14 : dayOfWeek === 0 ? 0 : 18;
    for (let h = start; h < end; h++) {
      times.push(`${String(h).padStart(2, "0")}:00`);
      if (h + 1 < end) times.push(`${String(h).padStart(2, "0")}:30`);
    }
    setAvailableTimes(times);
    setSelectedTime(null);
  }, [selectedDate]);

  const handleConfirm = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !user) return;
    setLoading(true);
    try {
      const service = services.find((s) => s.id === selectedService);
      const dateStr = format(selectedDate, "yyyy-MM-dd");

      const { error } = await supabase.from("appointments").insert({
        user_id: user.id,
        service_name: service?.title,
        appointment_date: dateStr,
        appointment_time: selectedTime,
        price: service?.price,
        status: "confirmed",
      });

      if (error) throw error;
      toast.success("Agendamento confirmado!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Erro ao agendar.");
    } finally {
      setLoading(false);
    }
  };

  const service = services.find((s) => s.id === selectedService);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center h-16 gap-4">
          <Link to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <span className="font-display text-lg font-semibold text-foreground">
            <Sparkles className="inline w-4 h-4 mr-1 text-primary" />
            Agendar
          </span>
        </div>
      </nav>

      <div className="container max-w-2xl py-12 space-y-8" style={{ animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>
        {/* Steps indicator */}
        <div className="flex items-center gap-2 justify-center">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={cn("w-12 h-0.5", step > s ? "bg-primary" : "bg-muted")} />}
            </div>
          ))}
        </div>

        {/* Step 1: Service */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-center">Escolha o serviço</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedService(s.id)}
                  className={cn(
                    "p-5 rounded-xl border text-left transition-all hover:shadow-md active:scale-[0.98]",
                    selectedService === s.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <h3 className="font-display font-semibold text-foreground">{s.title}</h3>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" /> {s.duration}
                    </span>
                    <span className="font-semibold text-primary">R$ {s.price}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="text-center">
              <Button onClick={() => setStep(2)} disabled={!selectedService} variant="hero" size="lg">
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-center">Escolha a data e horário</h2>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <div className="bg-card rounded-xl border p-4 shadow-sm">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  disabled={(date) => date < new Date() || date.getDay() === 0}
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
              <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
              <Button onClick={() => setStep(3)} disabled={!selectedDate || !selectedTime} variant="hero" size="lg">
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && service && selectedDate && selectedTime && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-center">Confirmar agendamento</h2>
            <div className="bg-card rounded-xl border p-6 shadow-sm space-y-4 max-w-sm mx-auto">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Serviço</span>
                <span className="font-medium text-foreground">{service.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Data</span>
                <span className="font-medium text-foreground">
                  {format(selectedDate, "dd/MM/yyyy")}
                </span>
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
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
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
