import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { roleServices, type ServiceName } from "@/lib/permissions";

/** Service (Bar / Cuisine) consulté, limité aux services autorisés pour l'utilisateur. */
export function useServiceChoice() {
  const { user } = useAuth();
  const allowed = user ? roleServices(user.role) : (["Bar"] as ServiceName[]);
  const [service, setService] = useState<ServiceName>(allowed[0]!);
  return { service: allowed.includes(service) ? service : allowed[0]!, setService, allowed };
}
