import Image from "next/image";
import type { ImageRef } from "@/content";
import { cn } from "@/lib/utils";

type Props = {
  image: ImageRef;
  sizes?: string;
  priority?: boolean;
  className?: string;
  fill?: boolean;
};

/** Eneste måten bilder rendres på. Tar ImageRef fra kontrakten. */
export function SmartImage({ image, sizes, priority, className, fill }: Props) {
  const position = image.focal
    ? `${Math.round(image.focal.x * 100)}% ${Math.round(image.focal.y * 100)}%`
    : undefined;
  const isSvg = image.url.endsWith(".svg");
  if (fill) {
    return (
      <Image
        src={image.url}
        alt={image.alt}
        fill
        sizes={sizes ?? "100vw"}
        priority={priority}
        unoptimized={isSvg}
        placeholder={image.blurDataURL ? "blur" : undefined}
        blurDataURL={image.blurDataURL}
        className={cn("object-cover", className)}
        style={{ objectPosition: position }}
      />
    );
  }
  return (
    <Image
      src={image.url}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes={sizes ?? "(min-width: 1024px) 50vw, 100vw"}
      priority={priority}
      unoptimized={isSvg}
      placeholder={image.blurDataURL ? "blur" : undefined}
      blurDataURL={image.blurDataURL}
      className={cn("h-auto w-full", className)}
      style={{ objectPosition: position }}
    />
  );
}
