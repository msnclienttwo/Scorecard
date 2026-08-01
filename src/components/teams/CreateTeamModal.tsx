"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LogoUploadButton } from "@/components/teams/LogoUploadButton";
import { getLogoValidationError } from "@/lib/logo";
import { useToast } from "@/hooks/useToast";

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated: (team: { id: string; name: string; shortName?: string }) => void;
}

interface TeamFormData {
  name: string;
  shortName: string;
  logo: string;
  captain: string;
  coach: string;
  homeGround: string;
  description: string;
}

const initialForm: TeamFormData = {
  name: "",
  shortName: "",
  logo: "",
  captain: "",
  coach: "",
  homeGround: "",
  description: "",
};

export function CreateTeamModal({ isOpen, onClose, onTeamCreated }: CreateTeamModalProps) {
  const [form, setForm] = useState<TeamFormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof TeamFormData, string>>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createTeam = useMutation({
    mutationFn: async (data: TeamFormData) => {
      const descriptionParts: string[] = [];
      if (data.captain) descriptionParts.push(`Captain: ${data.captain}`);
      if (data.coach) descriptionParts.push(`Coach: ${data.coach}`);
      if (data.description) descriptionParts.push(data.description);

      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          shortName: data.shortName,
          logo: data.logo || undefined,
          city: data.homeGround || undefined,
          description: descriptionParts.join("\n") || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to create team" }));
        throw new Error(err.error || "Failed to create team");
      }

      return res.json();
    },
    onSuccess: (data) => {
      const team = data.team;
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast({ message: "Team created successfully.", type: "success" });
      setForm(initialForm);
      setErrors({});
      onTeamCreated({ id: team.id, name: team.name, shortName: team.shortName });
      onClose();
    },
    onError: (error: Error) => {
      toast({ message: error.message, type: "error" });
    },
  });

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof TeamFormData, string>> = {};

    if (!form.name.trim()) {
      newErrors.name = "Team name is required";
    } else if (form.name.trim().length > 100) {
      newErrors.name = "Team name must be under 100 characters";
    }

    if (!form.shortName.trim()) {
      newErrors.shortName = "Short name is required";
    } else if (form.shortName.trim().length > 10) {
      newErrors.shortName = "Short name must be under 10 characters";
    }

    if (form.logo) {
      const logoError = getLogoValidationError(form.logo);
      if (logoError) newErrors.logo = logoError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    createTeam.mutate(form);
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

  const handleClose = () => {
    if (createTeam.isPending) return;
    setForm(initialForm);
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Team" size="lg">
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

        <div className="space-y-2">
          <Input
            label="Team Logo URL"
            placeholder="https://example.com/logo.png"
            value={form.logo}
            onChange={(e) => updateField("logo", e.target.value)}
            error={errors.logo}
          />
          <LogoUploadButton
            onUploaded={(url) => updateField("logo", url)}
            onError={(message) =>
              setErrors((prev) => ({ ...prev, logo: message }))
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Captain"
            placeholder="Captain name"
            value={form.captain}
            onChange={(e) => updateField("captain", e.target.value)}
          />
          <Input
            label="Coach"
            placeholder="Coach name"
            value={form.coach}
            onChange={(e) => updateField("coach", e.target.value)}
          />
        </div>

        <Input
          label="Home Ground"
          placeholder="e.g. Wankhede Stadium"
          value={form.homeGround}
          onChange={(e) => updateField("homeGround", e.target.value)}
        />

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
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={createTeam.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={createTeam.isPending}
            disabled={createTeam.isPending}
          >
            <Plus className="w-4 h-4" />
            Create Team
          </Button>
        </div>
      </form>
    </Modal>
  );
}
