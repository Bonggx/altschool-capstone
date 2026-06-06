import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import MDEditor from "@uiw/react-md-editor";
import { supabase, getStorageUrl } from "../../lib/supabase";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";

// Validation schema —> name, address, phone are required; coordinates must be valid
const schema = z.object({
  name: z.string().min(2, "Name is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(1, "City is required"),
  lga: z.string().min(1, "LGA is required"),
  state: z.string().min(1, "State is required"),
  phone: z.string().regex(/^[0-9+\-\s()]{7,15}$/, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email").or(z.literal("")),
  ownership_type: z.enum(["public", "private"]),
  visiting_hours: z.string().optional(),
  // Using string for lat/lng in the form = converted to number on submit
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const ALL_SPECIALTIES = [
  "Emergency", "Maternity", "Pediatric", "Dental",
  "Cardiology", "Orthopedic", "Neurology", "Oncology",
  "Ophthalmology", "Dermatology", "Psychiatry", "General", "Radiology",
];

export default function HospitalForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [description, setDescription] = useState<string>("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Pre-fills the form when editing an existing hospital
  useEffect(() => {
    if (!isEditing) return;
    async function load() {
      const { data } = await supabase.from("hospitals").select("*").eq("id", id).single();
      if (data) {
        reset({
          name: data.name,
          address: data.address,
          city: data.city,
          lga: data.lga,
          state: data.state,
          phone: data.phone ?? "",
          email: data.email ?? "",
          ownership_type: data.ownership_type,
          visiting_hours: data.visiting_hours ?? "",
          // Store as string in form, convert to number on submit
          latitude: data.latitude != null ? String(data.latitude) : "",
          longitude: data.longitude != null ? String(data.longitude) : "",
        });
        setDescription(data.description ?? "");
        setSpecialties(data.specialties ?? []);
        if (data.image_url) setImagePreview(data.image_url);
      }
    }
    load();
  }, [id]);

  function toggleSpecialty(spec: string) {
    setSpecialties((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function uploadImage(file: File): Promise<string | null> {
    const ext = file.name.split(".").pop();
    const path = `hospitals/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("carefinder").upload(path, file);
    if (error) return null;
    return getStorageUrl("carefinder", path);
  }

  async function onSubmit(data: FormData) {
    setSaving(true);
    setError(null);

    let imageUrl = imagePreview ?? null;
    if (imageFile) {
      const uploaded = await uploadImage(imageFile);
      if (uploaded) imageUrl = uploaded;
    }

    const payload = {
      ...data,
      description,
      specialties,
      image_url: imageUrl,
      // Convert string back to number, or null if empty
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
    };

    const { error: dbError } = isEditing
      ? await supabase.from("hospitals").update(payload).eq("id", id)
      : await supabase.from("hospitals").insert({ ...payload, is_approved: false });

    if (dbError) setError(dbError.message);
    else navigate("/admin");

    setSaving(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-serif text-3xl font-bold text-gray-900 mb-8">
        {isEditing ? "Edit Hospital" : "Add New Hospital"}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

        {/* Basic info */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <h2 className="font-serif text-sm font-bold text-gray-700 uppercase tracking-widest">Basic Info</h2>
          <Input label="Hospital name" error={errors.name?.message} {...register("name")} />
          <Input label="Address" error={errors.address?.message} {...register("address")} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="City" error={errors.city?.message} {...register("city")} />
            <Input label="LGA" error={errors.lga?.message} {...register("lga")} />
            <Input label="State" error={errors.state?.message} {...register("state")} />
          </div>

          {/* Ownership type radio */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Ownership type</p>
            <div className="flex gap-4">
              {(["public", "private"] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 capitalize">
                  <input type="radio" value={type} {...register("ownership_type")} className="accent-brand-500" />
                  {type}
                </label>
              ))}
            </div>
            {errors.ownership_type && (
              <p className="text-xs text-red-500 mt-1">{errors.ownership_type.message}</p>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <h2 className="font-serif text-sm font-bold text-gray-700 uppercase tracking-widest">Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Phone" placeholder="+234 800 000 0000" error={errors.phone?.message} {...register("phone")} />
            <Input label="Email (optional)" type="email" error={errors.email?.message} {...register("email")} />
          </div>
          <Input label="Visiting hours (optional)" placeholder="Mon–Fri 8am–6pm" {...register("visiting_hours")} />
        </div>

        {/* Location coordinates */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <h2 className="font-serif text-sm font-bold text-gray-700 uppercase tracking-widest">
            Coordinates <span className="text-gray-400 normal-case font-normal">(for map pin)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Latitude" placeholder="e.g. 6.5244" error={errors.latitude?.message} {...register("latitude")} />
            <Input label="Longitude" placeholder="e.g. 3.3792" error={errors.longitude?.message} {...register("longitude")} />
          </div>
        </div>

        {/* Specialties */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-serif text-sm font-bold text-gray-700 uppercase tracking-widest mb-3">Specialties</h2>
          <div className="flex flex-wrap gap-2">
            {ALL_SPECIALTIES.map((spec) => (
              <Badge
                key={spec}
                label={spec}
                variant={specialties.includes(spec) ? "pink" : "gray"}
                onClick={() => toggleSpecialty(spec)}
              />
            ))}
          </div>
        </div>

        {/* Description — Markdown editor with live preview */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-serif text-sm font-bold text-gray-700 uppercase tracking-widest mb-3">
            Description <span className="text-gray-400 normal-case font-normal">(Markdown supported)</span>
          </h2>
          <MDEditor value={description} onChange={(v) => setDescription(v ?? "")} height={220} />
        </div>

        {/* Image upload */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-serif text-sm font-bold text-gray-700 uppercase tracking-widest mb-3">Cover Image</h2>
          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-xl mb-3" />
          )}
          <label className="flex items-center gap-2 cursor-pointer text-sm text-brand-600 hover:text-brand-800 font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {imagePreview ? "Change image" : "Upload image"}
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
        )}

        {/* Form actions */}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => navigate("/admin")}>Cancel</Button>
          <Button type="submit" loading={saving}>
            {isEditing ? "Save changes" : "Add hospital"}
          </Button>
        </div>
      </form>
    </div>
  );
}