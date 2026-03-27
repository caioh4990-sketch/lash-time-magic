import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowLeft, Plus, Pencil, Trash2, X, Save, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ServiceCategory } from "@/hooks/useCategories";

const AdminCategories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
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
      await fetchCategories();
    };
    init();
  }, [navigate]);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("service_categories")
      .select("*")
      .order("sort_order");
    if (error) toast.error("Erro ao carregar categorias.");
    else setCategories(data as ServiceCategory[]);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("service_categories").insert({
      name: newName.trim(),
      sort_order: categories.length,
    });
    if (error) toast.error("Erro ao criar categoria.");
    else {
      toast.success("Categoria criada!");
      setNewName("");
      setCreating(false);
      await fetchCategories();
    }
    setSaving(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("service_categories")
      .update({ name: editName.trim() })
      .eq("id", id);
    if (error) toast.error("Erro ao atualizar.");
    else {
      toast.success("Categoria atualizada!");
      setEditingId(null);
      await fetchCategories();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta categoria? Serviços vinculados ficarão sem categoria.")) return;
    const { error } = await supabase.from("service_categories").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir.");
    else {
      toast.success("Categoria excluída!");
      await fetchCategories();
    }
  };

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
            Categorias de Serviços
          </span>
        </div>
      </nav>

      <div className="container max-w-2xl py-12 space-y-8" style={{ animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground">Categorias</h1>
          {!creating && (
            <Button onClick={() => { setCreating(true); setEditingId(null); }} variant="hero" size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              Nova categoria
            </Button>
          )}
        </div>

        {creating && (
          <div className="bg-card rounded-xl border p-5 space-y-4">
            <Label htmlFor="newCat">Nome da categoria</Label>
            <div className="flex gap-3">
              <Input
                id="newCat"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Cílios"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              <Button variant="hero" size="sm" onClick={handleCreate} disabled={saving || !newName.trim()} className="gap-1.5">
                <Save className="w-4 h-4" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setCreating(false); setNewName(""); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-muted-foreground animate-pulse">Carregando...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhuma categoria cadastrada.</div>
        ) : (
          <div className="space-y-3">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-card rounded-xl border p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                <GripVertical className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                {editingId === cat.id ? (
                  <div className="flex-1 flex gap-3">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleUpdate(cat.id)}
                      autoFocus
                    />
                    <Button variant="hero" size="sm" onClick={() => handleUpdate(cat.id)} disabled={saving}>
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 font-display font-semibold text-foreground">{cat.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => { setEditingId(cat.id); setEditName(cat.name); setCreating(false); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(cat.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;
