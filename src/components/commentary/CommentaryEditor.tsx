"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface CommentaryEditorProps {
  initial: string;
  busy?: boolean;
  onCancel: () => void;
  onSave: (content: string) => void;
}

export function CommentaryEditor({
  initial,
  busy,
  onCancel,
  onSave,
}: CommentaryEditorProps) {
  const [content, setContent] = useState(initial);

  return (
    <div className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={2000}
        autoFocus
        placeholder="Write commentary…"
        className="w-full resize-none rounded-lg border border-white/15 bg-black/30 p-2.5 text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
      />
      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => onSave(content.trim())}
          disabled={!content.trim()}
          loading={busy}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
