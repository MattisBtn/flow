<template>
    <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <!-- Gallery Content -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Gallery Grid -->
            <div v-if="images.length > 0" class="space-y-8">
                <!-- Gallery Stats -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-6 text-sm text-neutral-600 dark:text-neutral-400">
                        <div class="flex items-center gap-2">
                            <UIcon name="i-heroicons-photo" class="w-4 h-4" />
                            <span>{{ images.length }} / {{ gallery?.imageCount || 0 }} images chargées</span>
                        </div>
                    </div>

                    <!-- View Options -->
                    <div class="flex items-center gap-2">
                        <UButtonGroup size="sm" orientation="horizontal">
                            <UButton :color="gridSize === 'small' ? 'primary' : 'neutral'"
                                :variant="gridSize === 'small' ? 'solid' : 'outline'" icon="i-heroicons-squares-2x2"
                                @click="gridSize = 'small'" />
                            <UButton :color="gridSize === 'medium' ? 'primary' : 'neutral'"
                                :variant="gridSize === 'medium' ? 'solid' : 'outline'" icon="i-heroicons-squares-plus"
                                @click="gridSize = 'medium'" />
                            <UButton :color="gridSize === 'large' ? 'primary' : 'neutral'"
                                :variant="gridSize === 'large' ? 'solid' : 'outline'" icon="i-heroicons-rectangle-group"
                                @click="gridSize = 'large'" />
                        </UButtonGroup>
                    </div>
                </div>

                <!-- Images Grid -->
                <div ref="galleryContainer" :class="gridClasses">
                    <div v-for="(image, index) in images" :key="image.id"
                        class="group relative aspect-square bg-neutral-200 dark:bg-neutral-700 rounded-xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                        @click="openLightbox(image, index)">
                        <GalleryImageClient :image="image" :gallery-id="gallery?.id || ''"
                            class="transition-transform duration-300 group-hover:scale-105" />

                        <!-- Overlay -->
                        <div
                            class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                            <UButton icon="i-heroicons-magnifying-glass-plus" color="neutral" variant="solid" size="lg"
                                @click.stop="openLightbox(image, index)" />
                        </div>

                        <!-- Image Number Badge -->
                        <div
                            class="absolute top-3 left-3 bg-black/50 text-white text-xs font-medium px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {{ index + 1 }}
                        </div>
                    </div>
                </div>

                <!-- Loading More Indicator -->
                <div v-if="loadingMore" class="flex items-center justify-center py-8">
                    <div class="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                        <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
                        <span>Chargement des images suivantes...</span>
                    </div>
                </div>

                <!-- End of Gallery Indicator -->
                <div v-else-if="!hasMore && images.length > 0" class="text-center py-8">
                    <div
                        class="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-lg px-4 py-2">
                        <UIcon name="i-heroicons-check-circle" class="w-4 h-4" />
                        <span>Toutes les images ont été chargées</span>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div v-else class="text-center py-24">
                <div
                    class="w-24 h-24 mx-auto bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                    <UIcon name="i-heroicons-camera" class="w-12 h-12 text-neutral-400" />
                </div>
                <h3 class="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                    Galerie en préparation
                </h3>
                <p class="text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
                    Vos photos sont en cours de traitement. Vous recevrez une notification dès qu'elles seront
                    disponibles.
                </p>
            </div>
        </div>



        <!-- Lightbox Carousel -->
        <UModal v-model:open="lightboxOpen" fullscreen :overlay="true" :transition="true" :close="false">
            <template #content>
                <div class="relative w-full h-full bg-black p-0 m-0">
                    <!-- Header -->
                    <div class="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent p-4">
                        <div class="flex items-center justify-between text-white">
                            <div class="flex items-center gap-4">
                                <h3 class="text-lg font-medium">
                                    {{ project?.title }}
                                </h3>
                                <span class="text-sm opacity-75">
                                    {{ selectedCarouselIndex + 1 }} / {{ images.length }}
                                </span>
                            </div>
                            <UButton icon="i-heroicons-x-mark" color="neutral" variant="ghost" size="lg"
                                @click="closeLightbox" />
                        </div>
                    </div>

                    <!-- Carousel -->
                    <UCarousel ref="carousel" v-slot="{ item }" :items="carouselImages" arrows wheel-gestures :ui="{
                        item: 'basis-full',
                        container: 'h-full items-center',
                    }" class="w-full h-full" @select="selectedCarouselIndex = $event">
                        <div class="relative w-full h-full flex items-center justify-center p-4">
                            <div class="flex items-center justify-center w-full h-full">
                                <GalleryImageClient :image="item.image" :full-size="true"
                                    :gallery-id="gallery?.id || ''"
                                    class="flex items-center justify-center max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl" />
                            </div>
                        </div>
                    </UCarousel>
                </div>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import { useInfiniteScroll } from '@vueuse/core';
import type { ClientGalleryAccess, GalleryImage } from "~/types/gallery";

interface Props {
    galleryId: string;
    project: ClientGalleryAccess["project"];
    gallery: ClientGalleryAccess["gallery"];
    images: readonly GalleryImage[];
    hasMore: boolean;
    loadingMore: boolean;
    loadMore: () => Promise<void>;
}

const props = defineProps<Props>();

// Grid size state
const gridSize = ref<'small' | 'medium' | 'large'>('medium');

// Container ref for infinite scroll
const galleryContainer = ref<HTMLElement | null>(null);

// Computed grid classes
const gridClasses = computed(() => {
    const baseClasses = "grid gap-4";
    const sizeClasses = {
        small: "grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8",
        medium: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
        large: "grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3"
    };
    return `${baseClasses} ${sizeClasses[gridSize.value]}`;
});

// Lightbox state
const lightboxOpen = ref(false);
const selectedCarouselIndex = ref(0);
const carousel = ref();





// Carousel images for UCarousel
const carouselImages = computed(() =>
    props.images.map((image) => ({ image }))
);

// Lightbox methods
const openLightbox = (image: GalleryImage, index: number) => {
    // Set the correct index first
    selectedCarouselIndex.value = index;

    // Open the lightbox
    lightboxOpen.value = true;

    // Wait for DOM update and carousel initialization
    nextTick(() => {
        setTimeout(() => {
            if (carousel.value?.emblaApi) {
                carousel.value.emblaApi.scrollTo(index, false); // false = no smooth scroll for immediate positioning
            }
        }, 100); // Small delay to ensure carousel is fully initialized
    });
};

const closeLightbox = () => {
    lightboxOpen.value = false;
};

// Infinite scroll setup
onMounted(() => {
    if (galleryContainer.value) {
        useInfiniteScroll(
            galleryContainer.value,
            async () => {
                if (props.hasMore && !props.loadingMore) {
                    await props.loadMore();
                }
            },
            {
                distance: 400, // Load more when 400px from bottom
                canLoadMore: () => props.hasMore && !props.loadingMore
            }
        );
    }
});

// Keyboard navigation (UCarousel handles arrow keys automatically)
onMounted(() => {
    const handleKeydown = (event: KeyboardEvent) => {
        if (!lightboxOpen.value) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            closeLightbox();
        }
    };

    document.addEventListener('keydown', handleKeydown);

    onUnmounted(() => {
        document.removeEventListener('keydown', handleKeydown);
    });
});
</script>