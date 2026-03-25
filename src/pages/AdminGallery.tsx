import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sparkles, ArrowLeft, Plus, Pencil, Trash2, Upload, X, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { GalleryPhoto } from "@/hooks/useGallery";

type FormData = Omit<GalleryPhoto, "id">;

const emptyForm: FormData = {
  image_url: "",
  caption: "",
  sort_order: 0,
  active: true,
};

const AdminGallery = () => {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<GalleryPhoto | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (!roles?.some((r: any) => r.role === "admin")) {
        toast.error("Acesso negado.");
        navigate("/dashboard");
        return;
      }

      await fetchPhotos();
    };
    init();
  }, [navigate]);

  const fetchPhotos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gallery_photos")
      .select("*")
      .order("sort_order");
    if (error) toast.error("Erro ao carregar galeria.");
    else setPhotos(data as GalleryPhoto[]);
    setLoading(false);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `gallery-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("service-images")
        .upload(fileName, file, { upsert: true });
      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("service-images")
        .getPublicUrl(fileName);

      setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
      toast.success("Imagem enviada!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.image_url) {
      toast.error("Envie uma imagem.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from("gallery_photos")
          .update({
            image_url: form.image_url,
            caption: form.caption || null,
            active: form.active,
            sort_order: form.sort_order,
          })
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Foto atualizada!");
      } else {
        const { error } = await supabase
          .from("gallery_photos")
          .insert({
            image_url: form.image_url,
            caption: form.caption || null,
            active: form.active,
            sort_order: form.sort_order,
          });
        if (error) throw error;
        toast.success("Foto adicionada!");
      }
      cancel();
      await fetchPhotos();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta foto?")) return;
    const { error } = await supabase.from("gallery_photos").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir.");
    else {
      toast.success("Foto excluída!");
      await fetchPhotos();
    }
  };

  const startEdit = (p: GalleryPhoto) => {
    setEditing(p);
    setCreating(false);
    setForm({
      image_url: p.image_url,
      caption: p.caption,
      sort_order: p.sort_order,
      active: p.active,
    });
  };

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({ ...emptyForm, sort_order: photos.length + 1 });
  };

  const cancel = () => {
    setEditing(null);
    setCreating(false);
    setForm(emptyForm);
  };

  const showForm = editing || creating;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center h-16 gap-4">
          <Link to="/dashboard" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <span className="font-display text-lg font-semibold text-foreground">
            <Sparkles className="inline w-4 h-4 mr-1 text-primary" />
            Galeria de Trabalhos
          </span>
        </div>
      </nav>

      <div className="container max-w-3xl py-12 space-y-8" style={{ animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>
        {!showForm && (
          <>
            <div className="flex items-center justify-between">
              <h1 className="font-display text-2xl font-bold text-foreground">Galeria</h1>
              <Button onClick={startCreate} variant="hero" size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" />
                Nova foto
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground animate-pulse">Carregando...</div>
            ) : photos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Nenhuma foto cadastrada.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {photos.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      "group relative bg-card rounded-xl border overflow-hidden",
                      !p.active && "opacity-60"
                    )}
                  >
                    <img src={p.image_url} alt={p.caption || "Galeria"} className="w-full h-40 object-cover" />
                    {p.caption && (
                      <p className="p-2 text-xs text-muted-foreground truncate">{p.caption}</p>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => startEdit(p)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {showForm && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-foreground">
                {editing ? "Editar foto" : "Nova foto"}
              </h2>
              <Button variant="ghost" size="sm" onClick={cancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-card rounded-xl border p-6 space-y-5">
              <div className="space-y-2">
                <Label>Imagem *</Label>
                <div className="flex items-center gap-4">
                  {form.image_url ? (
                    <div className="relative">
                      <img src={form.image_url} alt="Preview" className="w-32 h-32 rounded-lg object-cover" />
                      <button
                        onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mt-1">
                        {uploading ? "Enviando..." : "Upload"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="caption">Legenda</Label>
                <Input
                  id="caption"
                  value={form.caption || ""}
                  onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
                  placeholder="Ex: Fio a fio clássico"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Ordem</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    checked={form.active}
                    onCheckedChange={(checked) => setForm((f) => ({ ...f, active: checked }))}
                  />
                  <Label>Ativa</Label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={cancel}>Cancelar</Button>
                <Button variant="hero" onClick={handleSave} disabled={saving} className="gap-1.5">
                  <Save className="w-4 h-4" />
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminGallery;
