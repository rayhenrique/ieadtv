"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsGalleryCarouselProps {
    images: string[];
}

export function NewsGalleryCarousel({ images }: NewsGalleryCarouselProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: "start",
        loop: false,
    });
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        setScrollSnaps(emblaApi.scrollSnapList());
        onSelect();
        emblaApi.on("select", onSelect);
        emblaApi.on("reInit", onSelect);
    }, [emblaApi, onSelect]);

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
    };

    const closeLightbox = () => {
        setLightboxIndex(null);
    };

    const goToPreviousImage = () => {
        if (lightboxIndex === null) return;
        setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
    };

    const goToNextImage = () => {
        if (lightboxIndex === null) return;
        setLightboxIndex((lightboxIndex + 1) % images.length);
    };

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (lightboxIndex === null) return;
            if (event.key === "Escape") closeLightbox();
            if (event.key === "ArrowLeft") goToPreviousImage();
            if (event.key === "ArrowRight") goToNextImage();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [lightboxIndex]);

    if (images.length === 0) return null;

    return (
        <>
            <div className="relative">
                <div className="overflow-hidden" ref={emblaRef}>
                    <div className="flex gap-3">
                        {images.map((foto, idx) => (
                            <button
                                key={`${foto}-${idx}`}
                                type="button"
                                className="relative h-24 flex-[0_0_42%] overflow-hidden rounded-md border border-gray-200 bg-gray-100 sm:h-28 sm:flex-[0_0_30%] md:flex-[0_0_22%] lg:flex-[0_0_18%]"
                                onClick={() => openLightbox(idx)}
                                title={`Abrir imagem ${idx + 1}`}
                            >
                                <Image
                                    src={foto}
                                    alt={`Foto ${idx + 1}`}
                                    fill
                                    className="object-cover transition-transform duration-300 hover:scale-105"
                                    sizes="(max-width: 640px) 42vw, (max-width: 768px) 30vw, (max-width: 1024px) 22vw, 18vw"
                                />
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={scrollPrev}
                    className="absolute -left-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 md:flex"
                    aria-label="Miniaturas anteriores"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={scrollNext}
                    className="absolute -right-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 md:flex"
                    aria-label="Próximas miniaturas"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>

                {scrollSnaps.length > 1 && (
                    <div className="mt-4 flex justify-center gap-2">
                        {scrollSnaps.map((_, index) => (
                            <button
                                key={index}
                                type="button"
                                className={cn(
                                    "h-2.5 w-2.5 rounded-full transition-colors",
                                    index === selectedIndex
                                        ? "bg-gray-700"
                                        : "bg-gray-300 hover:bg-gray-400"
                                )}
                                onClick={() => emblaApi?.scrollTo(index)}
                                aria-label={`Ir para grupo ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {lightboxIndex !== null && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
                    onClick={closeLightbox}
                >
                    <button
                        type="button"
                        onClick={closeLightbox}
                        className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
                        aria-label="Fechar imagem ampliada"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    {images.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    goToPreviousImage();
                                }}
                                className="absolute left-3 top-1/2 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
                                aria-label="Imagem anterior"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    goToNextImage();
                                }}
                                className="absolute right-3 top-1/2 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
                                aria-label="Próxima imagem"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </button>
                        </>
                    )}

                    <div
                        className="relative h-[75vh] w-full max-w-5xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <Image
                            src={images[lightboxIndex]}
                            alt={`Foto ampliada ${lightboxIndex + 1}`}
                            fill
                            className="object-contain"
                            sizes="100vw"
                            priority
                        />
                    </div>
                </div>
            )}
        </>
    );
}
