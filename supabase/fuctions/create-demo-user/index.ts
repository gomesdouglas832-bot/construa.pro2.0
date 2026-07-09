import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: existing } = await admin.auth.admin.listUsers();
    const found = existing.users.find((u) => u.email === "demo@obralink.com.br");
    if (found) {
      return new Response(
        JSON.stringify({ message: "Demo user already exists", user_id: found.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data, error } = await admin.auth.admin.createUser({
      email: "demo@obralink.com.br",
      password: "obralink2026",
      email_confirm: true,
      user_metadata: { full_name: "Marcos Silva" },
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userId = data.user.id;

    // Create profile
    const { error: profileError } = await admin.from("profiles").upsert({
      id: userId,
      full_name: "Marcos Silva",
      title: "Pedreiro especializado em acabamento e reformas",
      bio: "Ha mais de 12 anos transformando casas em lares. Especialista em acabamento fino, hidraulica e reformas completas. Trabalho com pontualidade, limpeza e qualidade garantida. Atendo Sao Paulo e Grande ABC.",
      city: "Sao Paulo",
      state: "SP",
      whatsapp: "11999998888",
      avatar_url: "https://images.pexels.com/photos/8961065/pexels-photo-8961065.jpeg?auto=compress&cs=tinysrgb&w=600",
      cover_url: "https://images.pexels.com/photos/5562769/pexels-photo-5562769.jpeg?auto=compress&cs=tinysrgb&w=1200",
      specialties: ["Pedreiro", "Azulejista", "Pintor"],
      years_experience: 12,
      verified: true,
      rating: 4.9,
      is_active: true,
    });

    if (profileError) {
      return new Response(
        JSON.stringify({ error: "User created but profile failed: " + profileError.message, user_id: userId }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Seed portfolio
    await admin.from("portfolio_items").insert([
      { profile_id: userId, title: "Reforma completa de cozinha", description: "Cozinha planejada com acabamento em porcelanato, troca de toda hidraulica e eletrica. Prazo de 18 dias.", image_url: "https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Acabamento" },
      { profile_id: userId, title: "Banheiro luxo com revestimento 3D", description: "Revestimento de parede em marmore e box temperado. Trabalho de azulejista de alta precisao.", image_url: "https://images.pexels.com/photos/6621337/pexels-photo-6621337.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Azulejista" },
      { profile_id: userId, title: "Pintura externa de sobrado", description: "Pintura completa da fachada com selador, massa acrilica e tinta de alta resistencia. 5 dias de execucao.", image_url: "https://images.pexels.com/photos/5829886/pexels-photo-5829886.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Pintura" },
      { profile_id: userId, title: "Muro de alvenaria com acabamento rustico", description: "Construcao de muro de 25 metros com pedras aparentes e iluminacao embutida.", image_url: "https://images.pexels.com/photos/5824889/pexels-photo-5824889.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Alvenaria" },
      { profile_id: userId, title: "Sala de estar com parede de destaque", description: "Trabalho de gesso e pintura com parede em cimento queimado. Cliente apaixonado pelo resultado.", image_url: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800", category: "Acabamento" },
    ]);

    // Seed stories
    await admin.from("stories").insert([
      { profile_id: userId, image_url: "https://images.pexels.com/photos/8961342/pexels-photo-8961342.jpeg?auto=compress&cs=tinysrgb&w=600", caption: "Iniciando a reforma da cozinha hoje! Equipe pronta.", status: "active", expires_at: new Date(Date.now() + 20 * 3600 * 1000).toISOString() },
      { profile_id: userId, image_url: "https://images.pexels.com/photos/8961082/pexels-photo-8961082.jpeg?auto=compress&cs=tinysrgb&w=600", caption: "Acabamento do rejunte saindo perfeito.", status: "active", expires_at: new Date(Date.now() + 18 * 3600 * 1000).toISOString() },
      { profile_id: userId, image_url: "https://images.pexels.com/photos/4787657/pexels-photo-4787657.jpeg?auto=compress&cs=tinysrgb&w=600", caption: "Mais um dia de obra entregue no prazo.", status: "active", expires_at: new Date(Date.now() + 22 * 3600 * 1000).toISOString() },
    ]);

    // Seed analytics
    const views = Array.from({ length: 28 }, (_, i) => ({
      profile_id: userId,
      viewer_source: "marketplace",
      created_at: new Date(Date.now() - (i + 1) * 3600 * 1000).toISOString(),
    }));
    await admin.from("profile_views").insert(views);

    const clicks = Array.from({ length: 9 }, (_, i) => ({
      profile_id: userId,
      origin: "profile",
      created_at: new Date(Date.now() - (i + 1) * 3600 * 1000).toISOString(),
    }));
    await admin.from("whatsapp_clicks").insert(clicks);

    return new Response(
      JSON.stringify({ message: "Demo user created successfully", user_id: userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
