import { useGallery } from "@/hooks/useGallery";
import { useState } from "react";
import { X } from "lucide-react";

const GallerySection = () => {
  const { data: photos, isLoading } = useGallery();
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (isLoading) {
    return (
      <section className="py-24">
        <div className="container">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Nossos Trabalhos</h2>
            <p className="text-muted-foreground text-lg">Resultados que falam por si.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-card rounded-xl border animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!photos || photos.length === 0) return null;

  return (
    <>
      <section id="galeria" className="py-24">
        <div className="container">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground text-balance">
              Nossos Trabalhos
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto text-pretty">
              Resultados que falam por si. Confira alguns dos nossos trabalhos.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                onClick={() => setLightbox(photo.image_url)}
                className="group relative aspect-square rounded-xl overflow-hidden border bg-card cursor-pointer"
                style={{ animation: `fade-up 0.7s cubic-bezier(0.16,1,0.3,1) ${0.08 * i}s both` }}
              >
                <img
                  src={photo.image_url}
                  alt={photo.caption || "Trabalho realizado"}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {photo.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-sm font-medium truncate">{photo.caption}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={lightbox}
            alt="Foto ampliada"
            className="max-w-full max-h-[90vh] rounded-xl object-contain"
            style={{ animation: "fade-in 0.3s ease both" }}
          />
        </div>
      )}
    </>
  );
};

export default GallerySection;
