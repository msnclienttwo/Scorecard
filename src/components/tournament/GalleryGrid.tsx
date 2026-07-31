"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn } from "lucide-react";

interface GalleryItem {
  id?: string;
  url: string;
  caption?: string;
  type?: string;
}

interface GalleryGridProps {
  items: GalleryItem[];
}

export default function GalleryGrid({ items }: GalleryGridProps) {
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  if (!items || items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center text-white/30">
        No gallery items yet
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item, i) => (
          <motion.div
            key={item.id || i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
            onClick={() => setSelected(item)}
          >
            <img
              src={item.url}
              alt={item.caption || "Gallery image"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white" />
            </div>
            {item.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-xs text-white/80 truncate">
                {item.caption}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selected.url}
                alt={selected.caption || "Gallery image"}
                className="max-w-full max-h-[80vh] rounded-xl object-contain"
              />
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70"
              >
                <X className="w-5 h-5" />
              </button>
              {selected.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white text-sm rounded-b-xl">
                  {selected.caption}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export { GalleryGrid };
