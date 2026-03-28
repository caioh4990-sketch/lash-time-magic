import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Clock, Star, ArrowRight } from "lucide-react";
import { useServices } from "@/hooks/useServices";
import GallerySection from "@/components/GallerySection";
import { heroImage } from "@/assets/images";

const Index = () => {
  const { data: services, isLoading } = useServices();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="font-display text-xl font-semibold text-foreground tracking-tight">
            <Sparkles className="inline-block w-5 h-5 mr-1.5 text-primary" />
            Studio Karol Negrini
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/agendar">
              <Button variant="hero" size="sm">Agendar</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden">
        <div className="container grid lg:grid-cols-2 gap-12 items-center min-h-[85vh] py-16 lg:py-0">
          <div className="space-y-8" style={{ animation: "fade-up 0.8s cubic-bezier(0.16,1,0.3,1) both" }}>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Cílios, Brow & Designer — Serra, ES 📍
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] text-balance">
              Harmonia, naturalidade e alto padrão ✨
            </h1>
            <p className="text-muted-foreground text-lg max-w-md text-pretty leading-relaxed">
              Formação nacional e internacional. Realce sua beleza natural com extensões de cílios feitas por profissional especializada. Agende seu horário com facilidade.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/agendar">
                <Button variant="hero" size="lg" className="gap-2">
                  Agendar horário
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#servicos">
                <Button variant="outline" size="lg">Ver serviços</Button>
              </a>
            </div>
          </div>

          <div
            className="relative"
            style={{ animation: "fade-in 1s cubic-bezier(0.16,1,0.3,1) 0.3s both" }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10">
              <img
                src={heroImage}
                alt="Extensão de cílios profissional — Studio Karol Negrini"
                className="w-full h-[500px] object-cover"
                loading="eager"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-card rounded-xl p-4 shadow-lg border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Profissional Certificada</p>
                  <p className="text-xs text-muted-foreground">Formação nacional e internacional</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="servicos" className="py-24 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground text-balance">
              Nossos Serviços
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto text-pretty">
              Cada técnica é escolhida para valorizar o formato dos seus olhos.
            </p>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card rounded-xl p-6 border animate-pulse h-48" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {services?.map((service, i) => (
                <div
                  key={service.id}
                  className="group bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md border transition-shadow duration-300"
                  style={{ animation: `fade-up 0.7s cubic-bezier(0.16,1,0.3,1) ${0.1 * i}s both` }}
                >
                  {service.image_url && (
                    <img
                      src={service.image_url}
                      alt={service.title}
                      className="w-full h-36 object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="p-6">
                    <h3 className="font-display text-lg font-semibold text-foreground mb-2">{service.title}</h3>
                    {service.description && (
                      <p className="text-muted-foreground text-sm mb-4 text-pretty leading-relaxed">{service.description}</p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" /> {service.duration}
                      </span>
                      <span className="font-semibold text-primary">R$ {service.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/agendar">
              <Button variant="hero" size="lg" className="gap-2">
                Agendar agora
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <GallerySection />

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5 font-display text-foreground font-semibold">
            <Sparkles className="w-4 h-4 text-primary" />
            Studio Karol Negrini
          </div>
          <div className="flex items-center gap-4">
            <a href="https://www.instagram.com/studio.karolnegrini/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              Instagram
            </a>
            <a href="https://wa.me/5527995764231" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              WhatsApp
            </a>
          </div>
          <p>© {new Date().getFullYear()} Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
