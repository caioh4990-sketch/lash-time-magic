import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, ArrowLeft, Plus, Pencil, Trash2, Upload, X, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Service } from "@/hooks/useServices";
import type { ServiceCategory } from "@/hooks/useCategories";

const emptyService: Omit<Service, "id"> = {
  title: "",
  description: "",
  duration: "",
  price: 0,
  image_url: null,
  active: true,
  sort_order: 0,
  category_id: null,
};

const AdminServices = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Omit<Service, "id">>(emptyService);
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

      await Promise.all([fetchServices(), fetchCategories()]);
    };
    init();
  }, [navigate]);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("sort_order");
    if (error) toast.error("Erro ao carregar serviços.");
    else setServices(data as Service[]);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("service_categories")
      .select("*")
      .order("sort_order");
    if (data) setCategories(data as ServiceCategory[]);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
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
    if (!form.title || !form.duration || form.price <= 0) {
      toast.error("Preencha título, duração e preço.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from("services")
          .update({
            title: form.title,
            description: form.description,
            duration: form.duration,
            price: form.price,
            image_url: form.image_url,
            active: form.active,
            sort_order: form.sort_order,
            category_id: form.category_id,
          })
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Serviço atualizado!");
      } else {
        const { error } = await supabase
          .from("services")
          .insert({
            title: form.title,
            description: form.description,
            duration: form.duration,
            price: form.price,
            image_url: form.image_url,
            active: form.active,
            sort_order: form.sort_order,
            category_id: form.category_id,
          });
        if (error) throw error;
        toast.success("Serviço criado!");
      }
      setEditing(null);
      setCreating(false);
      setForm(emptyService);
      await fetchServices();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este serviço?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir.");
    else {
      toast.success("Serviço excluído!");
      await fetchServices();
    }
  };

  const startEdit = (s: Service) => {
    setEditing(s);
    setCreating(false);
    setForm({
      title: s.title,
      description: s.description,
      duration: s.duration,
      price: s.price,
      image_url: s.image_url,
      active: s.active,
      sort_order: s.sort_order,
      category_id: s.category_id,
    });
  };

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({ ...emptyService, sort_order: services.length + 1 });
  };

  const cancel = () => {
    setEditing(null);
    setCreating(false);
    setForm(emptyService);
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
            Gerenciar Serviços
          </span>
        </div>
      </nav>

      <div className="container max-w-3xl py-12 space-y-8" style={{ animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>
        {!showForm && (
          <>
            <div className="flex items-center justify-between">
              <h1 className="font-display text-2xl font-bold text-foreground">Serviços</h1>
              <Button onClick={startCreate} variant="hero" size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" />
                Novo serviço
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground animate-pulse">Carregando...</div>
            ) : services.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Nenhum serviço cadastrado.</div>
            ) : (
              <div className="space-y-3">
                {services.map((s) => (
                  <div
                    key={s.id}
                    className={cn(
                      "bg-card rounded-xl border p-4 flex items-center gap-4 transition-shadow hover:shadow-sm",
                      !s.active && "opacity-60"
                    )}
                  >
                    {s.image_url ? (
                      <img src={s.image_url} alt={s.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-foreground truncate">{s.title}</h3>
                      <p className="text-sm text-muted-foreground">{s.duration} · R$ {s.price}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(s)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="w-4 h-4" />
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
                {editing ? "Editar serviço" : "Novo serviço"}
              </h2>
              <Button variant="ghost" size="sm" onClick={cancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-card rounded-xl border p-6 space-y-5">
              {/* Image */}
              <div className="space-y-2">
                <Label>Imagem</Label>
                <div className="flex items-center gap-4">
                  {form.image_url ? (
                    <div className="relative">
                      <img src={form.image_url} alt="Preview" className="w-24 h-24 rounded-lg object-cover" />
                      <button
                        onClick={() => setForm((f) => ({ ...f, image_url: null }))}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
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

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input id="title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex: Fio a Fio" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duração *</Label>
                  <Input id="duration" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} placeholder="Ex: 2h" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={form.category_id || ""}
                  onValueChange={(val) => setForm((f) => ({ ...f, category_id: val || null }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={form.description || ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Descreva o serviço..."
                  rows={3}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    step={10}
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Ordem</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={form.active}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, active: checked }))}
                />
                <Label>Ativo</Label>
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

export default AdminServices;
