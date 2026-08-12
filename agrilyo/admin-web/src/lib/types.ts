// Types miroir des schémas Pydantic backend — à garder synchronisés manuellement
// (pas de génération automatique dans ce squelette).

export interface UserProfile {
  id: string;
  phone_number: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  region: string | null;
  bio: string | null;
  roles: string[];
  status: string;
  phone_verified: boolean;
  language: string;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthResponse {
  tokens: TokenPair;
  user: UserProfile;
  is_new_user: boolean;
  requires_password_setup: boolean;
  requires_role_setup: boolean;
}

export interface UserAdminResume {
  id: string;
  phone_number: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  region: string | null;
  roles: string[];
  status: string;
  phone_verified: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface KPIResponse {
  total_users: number;
  users_par_role: Record<string, number>;
  agronomes_en_attente: number;
  agronomes_verifies: number;
  fournisseurs_en_attente: number;
  fournisseurs_verifies: number;
  annonces_actives: number;
  litiges_ouverts: number;
  demandes_conseil_par_statut: Record<string, number>;
}

export interface AgronomeResume {
  id: string;
  titre: string;
  organisation: string | null;
  specialites: string[];
  cultures: string[];
  regions_couvertes: string[];
  langues: string[];
  annees_experience: number;
  tarif_session: number | null;
  note_moyenne: number;
  nombre_sessions: number;
  statut: string;
}

export interface FournisseurResume {
  id: string;
  nom_commercial: string;
  region: string;
  ville: string | null;
  statut: string;
  label_ivoire: string | null; // BRONZE | ARGENT | OR | null
  note_moyenne: number;
  nombre_produits_actifs: number;
  created_at: string;
}

export interface Litige {
  id: string;
  contrat_id: string;
  declarant_id: string;
  admin_id: string | null;
  description: string;
  statut: string;
  resolution: string | null;
  created_at: string;
  updated_at: string;
}