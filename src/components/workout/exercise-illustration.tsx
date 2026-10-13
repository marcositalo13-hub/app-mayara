import Image from "next/image";
import { cn } from "@/lib/utils";

type ExerciseIllustrationProps = {
  images: string[];
  name: string;
  className?: string;
};

/**
 * Fixed 3:2 frame (the source images are 850×567), so nothing shifts while loading.
 * Two images crossfade 0 ↔ 1 every 1.4 s to show the movement (opacity only;
 * static first image under reduced motion). No images → soft placeholder.
 */
export function ExerciseIllustration({ images, name, className }: ExerciseIllustrationProps) {
  const frame = cn("relative aspect-[3/2] w-full overflow-hidden rounded-lg ring-1 ring-border", className);

  if (images.length === 0) {
    const initial = name.trim().charAt(0).toUpperCase() || "?";
    return (
      <div aria-hidden className={cn(frame, "flex aspect-[3/1] items-center justify-center bg-primary-soft")}>
        <span className="text-5xl font-extrabold text-primary">{initial}</span>
      </div>
    );
  }

  const sizes = "(max-width: 480px) 100vw, 448px";
  return (
    <div className={cn(frame, "bg-surface")}>
      <Image src={images[0]} alt={`Ilustração: ${name}`} fill sizes={sizes} className="object-contain" />
      {images[1] && (
        <Image
          src={images[1]}
          alt=""
          aria-hidden
          fill
          sizes={sizes}
          className="illus-swap object-contain"
        />
      )}
    </div>
  );
}
