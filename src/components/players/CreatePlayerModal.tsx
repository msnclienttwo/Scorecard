"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";

interface CreatePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName?: string;
  onPlayerCreated?: (player: { id: string; name: string }) => void;
}

const ROLES = ["Batsman", "Bowler", "All Rounder", "Wicket Keeper"] as const;
const BATTING_STYLES = ["Right Hand", "Left Hand"] as const;
const BOWLING_STYLES = ["Fast", "Medium", "Spin"] as const;

interface PlayerFormData {
  name: string;
  jerseyNumber: string;
  role: string;
  battingStyle: string;
  bowlingStyle: string;
  image: string;
  age: string;
  phone: string;
  email: string;
}

const initialForm: PlayerFormData = {
  name: "",
  jerseyNumber: "",
  role: "Batsman",
  battingStyle: "Right Hand",
  bowlingStyle: "",
  image: "",
  age: "",
  phone: "",
  email: "",
};

export function CreatePlayerModal({
  isOpen,
  onClose,
  teamId,
  teamName,
  onPlayerCreated,
}: CreatePlayerModalProps) {
  const [form, setForm] = useState<PlayerFormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof PlayerFormData, string>>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createPlayer = useMutation({
    mutationFn: async (data: PlayerFormData) => {
      const payload: Record<string, unknown> = {
        name: data.name,
        role: data.role,
        battingStyle: data.battingStyle || undefined,
        bowlingStyle: data.bowlingStyle || undefined,
        teamId,
      };
      if (data.jerseyNumber) payload.shortName = data.jerseyNumber;
      if (data.image) payload.image = data.image;
      if (data.age) {
        const birthYear = new Date().getFullYear() - parseInt(data.age);
        payload.dateOfBirth = new Date(`${birthYear}-01-01`).toISOString();
      }

      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to create player" }));
        throw new Error(err.error || "Failed to create player");
      }

      return res.json();
    },
    onSuccess: (data) => {
      const player = data.player;
      queryClient.invalidateQueries({ queryKey: ["players"] });
      queryClient.invalidateQueries({ queryKey: ["players", teamId] });
      toast({ message: `${player.name} added successfully.`, type: "success" });
      setForm(initialForm);
      setErrors({});
      onPlayerCreated?.({ id: player.id, name: player.name });
      onClose();
    },
    onError: (error: Error) => {
      toast({ message: error.message, type: "error" });
    },
  });

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PlayerFormData, string>> = {};
    if (!form.name.trim()) newErrors.name = "Player name is required";
    if (form.jerseyNumber && (isNaN(Number(form.jerseyNumber)) || Number(form.jerseyNumber) < 0 || Number(form.jerseyNumber) > 99)) {
      newErrors.jerseyNumber = "Jersey number must be 0-99";
    }
    if (form.age && (isNaN(Number(form.age)) || Number(form.age) < 10 || Number(form.age) > 60)) {
      newErrors.age = "Age must be between 10 and 60";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    createPlayer.mutate(form);
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

  const handleClose = () => {
    if (createPlayer.isPending) return;
    setForm(initialForm);
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Add Player ${teamName ? `to ${teamName}` : ""}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <Input
              label="Player Name *"
              placeholder="e.g. Virat Kohli"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              error={errors.name}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Input
              label="Jersey Number"
              placeholder="e.g. 18"
              type="number"
              min={0}
              max={99}
              value={form.jerseyNumber}
              onChange={(e) => updateField("jerseyNumber", e.target.value)}
              error={errors.jerseyNumber}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Role *</label>
            <div className="relative">
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
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Batting Style</label>
            <div className="relative">
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
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Bowling Style</label>
            <div className="relative">
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
          <Input
            label="Photo URL"
            placeholder="https://..."
            value={form.image}
            onChange={(e) => updateField("image", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Age"
            placeholder="e.g. 25"
            type="number"
            min={10}
            max={60}
            value={form.age}
            onChange={(e) => updateField("age", e.target.value)}
            error={errors.age}
          />
          <Input
            label="Phone"
            placeholder="+91..."
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
          />
          <Input
            label="Email"
            placeholder="player@email.com"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={createPlayer.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={createPlayer.isPending}
            disabled={createPlayer.isPending}
          >
            <Plus className="w-4 h-4" />
            Add Player
          </Button>
        </div>
      </form>
    </Modal>
  );
}
