"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
    id: string;
    titulo: string;
    imagem_url: string;
    link_destino: string | null;
}

interface BannerSliderProps {
    banners: Banner[];
}

export function BannerSlider({ banners }: BannerSliderProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
        Autoplay({ delay: 5000, stopOnInteraction: false }),
    ]);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
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

    if (!banners || banners.length === 0) return null;

    return (
        <div className="relative group">
            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                    {banners.map((banner) => (
                        <div className="relative flex-[0_0_100%] min-w-0" key={banner.id}>
                            {/* Aspect Ratio Container for Responsive Height */}
                            <div className="relative w-full h-[250px] sm:h-[350px] md:h-[450px] lg:h-[500px]">
                                <Image
                                    src={banner.imagem_url}
                                    alt={banner.titulo}
                                    fill
                                    className="object-cover"
                                    priority={true}
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
                                />

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                {/* Content */}
                                <div className="absolute inset-0 flex items-end justify-center pb-12 sm:pb-16 px-4 md:px-0">
                                    <div className="w-full max-w-[1200px] text-center md:text-left md:px-6">
                                        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white drop-shadow-lg mb-4 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards" style={{ animationDelay: '0.2s' }}>
                                            {banner.titulo}
                                        </h2>
                                        {banner.link_destino && (
                                            <Link
                                                href={banner.link_destino}
                                                className="inline-flex items-center justify-center rounded-md bg-white text-[#003366] px-6 py-2.5 text-sm font-bold uppercase tracking-wide transition-transform hover:scale-105 hover:bg-gray-100 shadow-xl opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards"
                                                style={{ animationDelay: '0.4s' }}
                                            >
                                                Saiba Mais
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Arrows (Desktop) */}
            <button
                onClick={scrollPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-all hover:bg-black/50 hover:scale-110 opacity-0 group-hover:opacity-100"
                aria-label="Previous slide"
            >
                <ChevronLeft className="h-6 w-6" />
            </button>

            <button
                onClick={scrollNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-all hover:bg-black/50 hover:scale-110 opacity-0 group-hover:opacity-100"
                aria-label="Next slide"
            >
                <ChevronRight className="h-6 w-6" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {banners.map((_, index) => (
                    <button
                        key={index}
                        className={cn(
                            "h-2 w-2 rounded-full transition-all duration-300 shadow-md",
                            index === selectedIndex
                                ? "bg-white w-6 opacity-100"
                                : "bg-white/50 w-2 hover:bg-white/80"
                        )}
                        onClick={() => emblaApi && emblaApi.scrollTo(index)}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
