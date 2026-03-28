import { Sparkles, Globe, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { avatarImage } from "@/assets/images";

const WHATSAPP_URL =
  "https://wa.me/5527995764231?text=Ol%C3%A1%2C%20gostaria%20de%20agendar%20um%20hor%C3%A1rio%20ou%20tirar%20d%C3%BAvidas";

const Links = () => (
  <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#1a1118]">
    {/* Subtle gradient overlay */}
    <div className="fixed inset-0 pointer-events-none" style={{
      background: "radial-gradient(ellipse at 50% 0%, hsl(340 30% 20% / 0.4) 0%, transparent 60%)"
    }} />

    <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">
      {/* Avatar */}
      <div className="relative">
        <div className="w-28 h-28 rounded-full overflow-hidden ring-[3px] ring-[hsl(340_35%_55%)] ring-offset-4 ring-offset-[#1a1118] shadow-xl shadow-[hsl(340_35%_55%_/_0.2)]">
           <img
20:             src={avatarImage}
21:             alt="Studio Karol Negrini"
22:             className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[hsl(340,35%,55%)] flex items-center justify-center shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      </div>

      {/* Name & tagline */}
      <div className="text-center space-y-2">
        <h1 className="font-display text-2xl font-bold text-[hsl(40,20%,92%)] tracking-tight">
          Studio Karol Negrini
        </h1>
        <p className="text-sm text-[hsl(40,10%,60%)] max-w-[260px] mx-auto leading-relaxed">
          Realçando sua beleza com cuidado e profissionalismo ✨
        </p>
      </div>

      {/* Links */}
      <div className="w-full flex flex-col gap-4">
        {/* WhatsApp — primary CTA */}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-semibold text-white text-base shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-xl active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
            boxShadow: "0 8px 24px -6px rgba(37, 211, 102, 0.35)"
          }}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white shrink-0">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          WhatsApp Atendimento
        </a>

        {/* Site — secondary CTA */}
        <Link
          to="/site"
          className="group flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-semibold text-base transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] border-2"
          style={{
            borderColor: "hsl(340 35% 55%)",
            color: "hsl(340 35% 70%)",
            background: "hsl(340 35% 55% / 0.08)",
            boxShadow: "0 8px 24px -6px hsl(340 35% 55% / 0.15)"
          }}
        >
          <Globe className="w-5 h-5 shrink-0" />
          Entrar no Site
          <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 pt-4">
        <a
          href="https://www.instagram.com/studio.karolnegrini/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[hsl(40,10%,45%)] hover:text-[hsl(340,35%,65%)] transition-colors"
        >
          @studio.karolnegrini
        </a>
        <span className="w-1 h-1 rounded-full bg-[hsl(40,10%,30%)]" />
        <span className="text-xs text-[hsl(40,10%,35%)]">Serra, ES 📍</span>
      </div>
    </div>
  </div>
);

export default Links;
