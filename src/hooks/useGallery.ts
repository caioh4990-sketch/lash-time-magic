import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GalleryPhoto {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  active: boolean;
}

export const useGallery = () => {
  return useQuery({
    queryKey: ["gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_photos")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data as GalleryPhoto[];
    },
  });
};
