"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: {
    id: string;
    name: string;
    shortName: string | null;
    role: string | null;
    battingStyle: string | null;
    bowlingStyle: string | null;
    nationality: string | null;
    image: string | null;
    dateOfBirth: string | null;
    team?: { id: string; name: string } | null;
  } | null;
}

const ROLES = ["Batsman", "Bowler", "All Rounder", "Wicket Keeper"] as const;
const BATTING_STYLES = ["Right Hand", "Left Hand"] as const;
const BOWLING_STYLES = ["Fast", "Medium", "Spin"] as const;

interface PlayerFormData {
  name: string;
  shortName: string;
  role: string;
  battingStyle: string;
  bowlingStyle: string;
  nationality: string;
  image: string;
}

export function EditPlayerModal({ isOpen, onClose, player }: EditPlayerModalProps) {
  const [form, setForm] = useState<PlayerFormData>({
    name: "",
    shortName: "",
    role: "Batsman",
    battingStyle: "Right Hand",
    bowlingStyle: "",
    nationality: "",
    image: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof PlayerFormData, string>>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (player) {
      setForm({
        name: player.name,
        shortName: player.shortName || "",
        role: player.role || "Batsman",
        battingStyle: player.battingStyle || "Right Hand",
        bowlingStyle: player.bowlingStyle || "",
        nationality: player.nationality || "",
        image: player.image || "",
      });
    }
  }, [player]);

  const updatePlayer = useMutation({
    mutationFn: async (data: PlayerFormData) => {
      if (!player) throw new Error("No player selected");
      const res = await fetch(`/api/players/${player.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          shortName: data.shortName || null,
          role: data.role,
          battingStyle: data.battingStyle || null,
          bowlingStyle: data.bowlingStyle || null,
          nationality: data.nationality || null,
          image: data.image || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to update player" }));
        throw new Error(err.error || "Failed to update player");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      queryClient.invalidateQueries({ queryKey: ["player", player?.id] });
      toast({ message: "Player updated successfully.", type: "success" });
      onClose();
    },
    onError: (error: Error) => {
      toast({ message: error.message, type: "error" });
    },
  });

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PlayerFormData, string>> = {};
    if (!form.name.trim()) newErrors.name = "Player name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    updatePlayer.mutate(form);
  };

  const updateField = (field: keyof PlayerFormData, value: string) => {
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
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Player" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Player Name *"
            placeholder="e.g. Virat Kohli"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            error={errors.name}
          />
          <Input
            label="Jersey Number"
            placeholder="e.g. 18"
            value={form.shortName}
            onChange={(e) => updateField("shortName", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Role</label>
            <select
              value={form.role}
              onChange={(e) => updateField("role", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {ROLES.map((r) => (
                <option key={r} value={r} className="bg-[#0d1320]">{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Batting Style</label>
            <select
              value={form.battingStyle}
              onChange={(e) => updateField("battingStyle", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {BATTING_STYLES.map((s) => (
                <option key={s} value={s} className="bg-[#0d1320]">{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Bowling Style</label>
            <select
              value={form.bowlingStyle}
              onChange={(e) => updateField("bowlingStyle", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="" className="bg-[#0d1320]">None</option>
              {BOWLING_STYLES.map((s) => (
                <option key={s} value={s} className="bg-[#0d1320]">{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nationality"
            placeholder="e.g. Indian"
            value={form.nationality}
            onChange={(e) => updateField("nationality", e.target.value)}
          />
          <Input
            label="Photo URL"
            placeholder="https://..."
            value={form.image}
            onChange={(e) => updateField("image", e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={updatePlayer.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={updatePlayer.isPending} disabled={updatePlayer.isPending}>
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
