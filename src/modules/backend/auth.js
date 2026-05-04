import { supabase } from "./supabaseClient";

export async function loginAdmin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error("Login failed:", error.message);
    throw error;
  }

  return data;
}

export async function logoutAdmin() {
  return await supabase.auth.signOut();
}
