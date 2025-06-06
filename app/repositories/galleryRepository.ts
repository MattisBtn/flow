import type {
  Gallery,
  IGalleryFilters,
  IGalleryRepository,
  IPagination,
} from "~/types/gallery";

export const galleryRepository: IGalleryRepository = {
  async findMany(
    filters: IGalleryFilters,
    pagination: IPagination
  ): Promise<Gallery[]> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour accéder aux galeries");
    }

    let query = supabase
      .from("galleries")
      .select(
        `
        *,
        project:projects!inner(
          id,
          title,
          status,
          user_id
        )
      `
      )
      .eq("project.user_id", user.value.id)
      .order("created_at", { ascending: false })
      .range(
        (pagination.page - 1) * pagination.pageSize,
        pagination.page * pagination.pageSize - 1
      );

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.project_id) {
      query = query.eq("project_id", filters.project_id);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch galleries: ${error.message}`);
    }

    return data || [];
  },

  async findById(id: string): Promise<Gallery | null> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour accéder à cette galerie");
    }

    const { data, error } = await supabase
      .from("galleries")
      .select(
        `
        *,
        project:projects!inner(
          id,
          title,
          status,
          user_id
        )
      `
      )
      .eq("id", id)
      .eq("project.user_id", user.value.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Failed to fetch gallery: ${error.message}`);
    }

    return data;
  },

  async findByProjectId(projectId: string): Promise<Gallery | null> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour accéder à cette galerie");
    }

    const { data, error } = await supabase
      .from("galleries")
      .select(
        `
        *,
        project:projects!inner(
          id,
          title,
          status,
          user_id
        )
      `
      )
      .eq("project_id", projectId)
      .eq("project.user_id", user.value.id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch gallery: ${error.message}`);
    }

    return data;
  },

  async create(
    galleryData: Omit<Gallery, "id" | "created_at" | "updated_at">
  ): Promise<Gallery> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("galleries")
      .insert(galleryData)
      .select(
        `
        *,
        project:projects(
          id,
          title,
          status
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to create gallery: ${error.message}`);
    }

    return data;
  },

  async update(id: string, galleryData: Partial<Gallery>): Promise<Gallery> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour modifier cette galerie");
    }

    // First verify the gallery belongs to the user
    const existingGallery = await supabase
      .from("galleries")
      .select(
        `
        id,
        project:projects!inner(
          user_id
        )
      `
      )
      .eq("id", id)
      .eq("project.user_id", user.value.id)
      .single();

    if (existingGallery.error) {
      throw new Error("Galerie non trouvée ou accès non autorisé");
    }

    const { data, error } = await supabase
      .from("galleries")
      .update(galleryData)
      .eq("id", id)
      .select(
        `
        *,
        project:projects(
          id,
          title,
          status
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to update gallery: ${error.message}`);
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour supprimer cette galerie");
    }

    // First verify the gallery belongs to the user
    const existingGallery = await supabase
      .from("galleries")
      .select(
        `
        id,
        project:projects!inner(
          user_id
        )
      `
      )
      .eq("id", id)
      .eq("project.user_id", user.value.id)
      .single();

    if (existingGallery.error) {
      throw new Error("Galerie non trouvée ou accès non autorisé");
    }

    const { error } = await supabase.from("galleries").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete gallery: ${error.message}`);
    }
  },
};
