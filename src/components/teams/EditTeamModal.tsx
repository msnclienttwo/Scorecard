"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: {
    id: string;
    name: string;
    shortName: string | null;
    logo: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    city: string | null;
    country: string | null;
    description: string | null;
  } | null;
}

interface TeamFormData {
  name: string;
  shortName: string;
  logo: string;
  city: string;
  country: string;
  primaryColor: string;
  secondaryColor: string;
  description: string;
}

export function EditTeamModal({ isOpen, onClose, team }: EditTeamModalProps) {
  const [form, setForm] = useState<TeamFormData>({
    name: "",
    shortName: "",
    logo: "",
    city: "",
    country: "",
    primaryColor: "#2563EB",
    secondaryColor: "#00D4FF",
    description: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof TeamFormData, string>>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (team) {
      setForm({
        name: team.name,
        shortName: team.shortName || "",
        logo: team.logo || "",
        city: team.city || "",
        country: team.country || "",
        primaryColor: team.primaryColor || "#2563EB",
        secondaryColor: team.secondaryColor || "#00D4FF",
        description: team.description || "",
      });
    }
  }, [team]);

  const updateTeam = useMutation({
    mutationFn: async (data: TeamFormData) => {
      if (!team) throw new Error("No team selected");
      const res = await fetch(`/api/teams/${team.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          shortName: data.shortName,
          logo: data.logo || null,
          city: data.city || null,
          country: data.country || null,
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          description: data.description || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to update team" }));
        throw new Error(err.error || "Failed to update team");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team", team?.id] });
      toast({ message: "Team updated successfully.", type: "success" });
      onClose();
    },
    onError: (error: Error) => {
      toast({ message: error.message, type: "error" });
    },
  });

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof TeamFormData, string>> = {};
    if (!form.name.trim()) newErrors.name = "Team name is required";
    if (!form.shortName.trim()) newErrors.shortName = "Short name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    updateTeam.mutate(form);
  };

  const updateField = (field: keyof TeamFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Team" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Team Name *"
            placeholder="e.g. Mumbai Indians"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            error={errors.name}
          />
          <Input
            label="Short Name *"
            placeholder="e.g. MI"
            value={form.shortName}
            onChange={(e) => updateField("shortName", e.target.value)}
            error={errors.shortName}
          />
        </div>

        <Input
          label="Team Logo URL"
          placeholder="https://example.com/logo.png"
          value={form.logo}
          onChange={(e) => updateField("logo", e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="City"
            placeholder="e.g. Mumbai"
            value={form.city}
            onChange={(e) => updateField("city", e.target.value)}
          />
          <Input
            label="Country"
            placeholder="e.g. India"
            value={form.country}
            onChange={(e) => updateField("country", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Primary Color"
            type="color"
            value={form.primaryColor}
            onChange={(e) => updateField("primaryColor", e.target.value)}
          />
          <Input
            label="Secondary Color"
            type="color"
            value={form.secondaryColor}
            onChange={(e) => updateField("secondaryColor", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm text-white/70 mb-1.5">Description</label>
          <textarea
            placeholder="About this team..."
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={updateTeam.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={updateTeam.isPending} disabled={updateTeam.isPending}>
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
