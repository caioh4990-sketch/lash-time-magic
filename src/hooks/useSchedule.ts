import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AvailableTime {
  id: string;
  time_slot: string;
  day_of_week: number[];
  active: boolean;
}

export interface BlockedDate {
  id: string;
  blocked_date: string;
  reason: string | null;
}

export function useAvailableTimes() {
  return useQuery({
    queryKey: ["available_times"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("available_times")
        .select("*")
        .order("time_slot");
      if (error) throw error;
      return data as AvailableTime[];
    },
  });
}

export function useBlockedDates() {
  return useQuery({
    queryKey: ["blocked_dates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_dates")
        .select("*")
        .order("blocked_date");
      if (error) throw error;
      return data as BlockedDate[];
    },
  });
}

/** Returns booked time slots for a given date */
export function useBookedSlots(date: string | null) {
  return useQuery({
    queryKey: ["booked_slots", date],
    enabled: !!date,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("appointment_time")
        .eq("appointment_date", date!)
        .in("status", ["confirmed", "pending"]);
      if (error) throw error;
      return (data || []).map((a) => a.appointment_time);
    },
  });
}
