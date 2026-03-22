import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Service {
  id: string;
  title: string;
  description: string | null;
  duration: string;
  price: number;
  image_url: string | null;
  active: boolean;
  sort_order: number;
}

export const useServices = () => {
  return useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data as Service[];
    },
  });
};
