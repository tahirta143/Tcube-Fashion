'use client';

import React from 'react';
import Link from 'next/link';
import { useFavorites } from '@/context/FavoritesContext';
import { usePopup } from '@/context/PopupContext';
import ProductCard from '@/components/ProductCard';
import { Heart, Trash2, ArrowRight } from 'lucide-react';

export default function FavoritesPage() {
  const { favorites, clearFavorites } = useFavorites();
  const { showToast, showConfirm } = usePopup();

  const handleClearAll = async () => {
    const confirmed = await showConfirm({
      title: 'Clear Favorites List?',
      message: 'Are you sure you want to remove all saved garments from your wishlist?',
      confirmText: 'Clear All',
      cancelText: 'Cancel',
      variant: 'warning',
    });
    if (confirmed) {
      clearFavorites();
      showToast('Cleared all items from your wishlist.', 'info', 'Wishlist Cleared');
    }
  };

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-6 text-center animate-fade-in">
        <div className="bg-sand-100 dark:bg-sand-100/10 p-6 rounded-full text-secondary animate-pulse">
          <Heart size={44} />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-primary dark:text-foreground">
            Your Wishlist is Empty
          </h1>
          <p className="text-xs text-primary/60 dark:text-foreground/60 uppercase tracking-widest font-semibold max-w-sm">
            Save pieces you love to keep track of their availability and styles.
          </p>
        </div>
        <Link 
          href="/shop" 
          className="bg-primary hover:bg-secondary dark:bg-white dark:text-primary dark:hover:bg-secondary dark:hover:text-white text-white text-xs font-bold uppercase tracking-wider px-8 py-3.5 rounded-xl transition-all shadow-md flex items-center gap-2"
        >
          Browse Catalog
          <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sand-200/60 dark:border-white/10 pb-5">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-primary dark:text-foreground">
            Favorites List ({favorites.length})
          </h1>
          <p className="text-xs text-primary/50 dark:text-foreground/50 uppercase tracking-wider font-semibold mt-1">
            Saved capsule pieces and styles
          </p>
        </div>
        <button
          onClick={handleClearAll}
          className="self-start sm:self-auto text-[10px] text-red-500 font-bold uppercase tracking-wider border border-red-200/60 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/10 hover:bg-red-100/60 dark:hover:bg-red-500/20 px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
        >
          <Trash2 size={12} />
          Clear All
        </button>
      </div>

      {/* Grid of Liked Products using the new Reveal ProductCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {favorites.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
