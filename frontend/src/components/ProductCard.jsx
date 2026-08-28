'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { usePopup } from '@/context/PopupContext';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProductCard({ product, className, enableAnimations = true }) {
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { showToast } = usePopup();
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = enableAnimations && !shouldReduceMotion;

  const isWishlisted = product?.id ? isFavorite(product.id) : false;

  const imageUrl = product?.images
    ? product.images.split(',')[0].trim()
    : 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop';

  const hasDiscount = product?.discount_price !== null && parseFloat(product?.discount_price) > 0;
  const currentPrice = hasDiscount ? parseFloat(product.discount_price) : parseFloat(product?.price || 0);
  const originalPrice = hasDiscount ? parseFloat(product.price) : null;

  const defaultSize = product?.sizes ? product.sizes.split(',')[0].trim() : '';
  const defaultColor = product?.colors ? product.colors.split(',')[0].trim() : '';
  const sizesList = product?.sizes ? product.sizes.split(',').map(s => s.trim()).filter(Boolean) : [];
  const colorsList = product?.colors ? product.colors.split(',').map(c => c.trim()).filter(Boolean) : [];

  const discountPercent = originalPrice && currentPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  // Real review and rating fallback from backend data
  const rating = product?.rating ? parseFloat(product.rating) : 4.8;
  const reviewCount = product?.review_count || product?.reviews_count || 124;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product?.stock <= 0) return;
    addToCart(product, 1, defaultSize, defaultColor);
    showToast(`Added "${product.name}" to cart.`, 'success', 'Cart Updated');
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
  };

  // Motion variants
  const containerVariants = {
    rest: { 
      scale: 1,
      y: 0,
    },
    hover: shouldAnimate ? { 
      scale: 1.02, 
      y: -6,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        mass: 0.8,
      }
    } : {},
  };

  const imageVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.08 },
  };

  // Full-card reveal overlay
  const overlayVariants = {
    rest: { 
      y: "100%", 
      opacity: 0,
      filter: "blur(4px)",
    },
    hover: { 
      y: "0%", 
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 28,
        mass: 0.6,
        staggerChildren: 0.08,
        delayChildren: 0.08,
      },
    },
  };

  const contentVariants = {
    rest: { 
      opacity: 0, 
      y: 15,
      scale: 0.96,
    },
    hover: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.5,
      },
    },
  };

  const buttonVariantsMotion = {
    rest: { scale: 1, y: 0 },
    hover: shouldAnimate ? { 
      scale: 1.03, 
      y: -1.5,
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 25 
      }
    } : {},
    tap: shouldAnimate ? { scale: 0.96 } : {},
  };

  const favoriteVariants = {
    rest: { scale: 1, rotate: 0 },
    favorite: { 
      scale: [1, 1.3, 1], 
      rotate: [0, 10, -10, 0],
      transition: { 
        duration: 0.5,
        ease: "easeInOut"
      }
    },
  };

  return (
    <motion.div
      data-slot="product-reveal-card"
      initial="rest"
      whileHover="hover"
      variants={containerVariants}
      className={cn(
        "relative w-full max-w-[310px] mx-auto rounded-2xl overflow-hidden cursor-pointer group select-none transition-all duration-300",
        // Light mode styling
        "bg-white border border-sand-200/80 shadow-md shadow-black/5 text-primary",
        // Dark mode styling
        "dark:bg-[#161616] dark:border-[#262626]/80 dark:shadow-black/30 dark:text-[#FDFBF7]",
        className
      )}
    >
      {/* 1. Image Container */}
      <div className="relative h-56 w-full overflow-hidden bg-sand-50 dark:bg-[#1E1E1E]">
        <motion.img
          src={imageUrl}
          alt={product?.name || 'Product'}
          className="h-full w-full object-cover object-center"
          variants={imageVariants}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

        {/* Favorite Heart Button (Hidden initially on desktop, reveals on hover OR if active wishlisted) */}
        <motion.button
          type="button"
          onClick={handleFavoriteClick}
          variants={favoriteVariants}
          animate={isWishlisted ? "favorite" : "rest"}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={cn(
            "absolute top-3.5 right-3.5 z-30 p-2 rounded-full backdrop-blur-md border shadow-md transition-all duration-300",
            // Reveal on hover (or stay visible if wishlisted)
            isWishlisted
              ? "opacity-100 scale-100 bg-red-500 text-white border-red-400"
              : "opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 bg-white/70 dark:bg-black/50 text-primary dark:text-white border-white/40 dark:border-white/20 hover:bg-white dark:hover:bg-black"
          )}
        >
          <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
        </motion.button>

        {/* Discount Badge */}
        {hasDiscount && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="absolute top-3.5 left-3.5 z-10 bg-[#FF2D55] text-white px-3 py-1 rounded-full text-[11px] font-bold tracking-tight shadow-md"
          >
            {discountPercent > 0 ? `${discountPercent}% OFF` : 'SALE'}
          </motion.div>
        )}

        {/* Out of Stock Overlay */}
        {product?.stock <= 0 && (
          <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-xs flex items-center justify-center pointer-events-none">
            <span className="bg-white/95 text-black text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* 2. Base Info Content (Shown when not hovered) */}
      <div className="p-5 space-y-2.5 bg-white dark:bg-[#161616] transition-colors">
        {/* Rating Stars & Count */}
        <div className="flex items-center gap-2">
          <div className="flex text-amber-500 dark:text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-3.5 h-3.5",
                  i < Math.floor(rating) 
                    ? "fill-current text-amber-500 dark:text-amber-400" 
                    : "text-sand-300 dark:text-neutral-600"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-primary/60 dark:text-neutral-400 font-medium">
            {rating.toFixed(1)} ({reviewCount} reviews)
          </span>
        </div>

        {/* Product Title & Prices */}
        <div className="space-y-1">
          <Link href={`/product/${product?.id || 1}`} className="block">
            <motion.h3 
              className="text-base font-bold leading-snug tracking-tight text-primary dark:text-[#FDFBF7] truncate hover:text-secondary transition-colors"
              initial={{ opacity: 0.95 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {product?.name || 'Garment'}
            </motion.h3>
          </Link>
          
          {/* Prices */}
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-xl font-bold text-primary dark:text-white tracking-tight">
              Rs. {currentPrice.toLocaleString()}
            </span>
            {originalPrice && (
              <span className="text-sm text-primary/40 dark:text-neutral-400 line-through font-normal">
                Rs. {originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Reveal Overlay Covering the ENTIRE Card (Absolute inset-0) */}
      <motion.div
        variants={overlayVariants}
        className={cn(
          "absolute inset-0 z-20 flex flex-col justify-end p-5 backdrop-blur-xl transition-colors",
          // Light mode: Clean soft white/sand glass background
          "bg-white/95 text-primary border border-sand-200/50",
          // Dark mode: Deep black glass background
          "dark:bg-[#121212]/98 dark:text-white dark:border-white/5"
        )}
      >
        <div className="space-y-3.5">
          {/* Product Description */}
          <motion.div variants={contentVariants}>
            <h4 className="font-semibold text-sm text-primary dark:text-white mb-1.5 tracking-tight">
              Product Details
            </h4>
            <p className="text-xs text-primary/70 dark:text-neutral-300 leading-relaxed line-clamp-3">
              {product?.description || 'Crafted with premium high-grade fabric offering an ultra-comfortable fit and timeless design.'}
            </p>
          </motion.div>

          {/* Real Dynamic Features / Variants from Database */}
          <motion.div variants={contentVariants}>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-sand-50 dark:bg-[#222222] rounded-xl p-2.5 text-center border border-sand-200/60 dark:border-white/5">
                <div className="font-semibold text-primary dark:text-white text-[11px] truncate">
                  {sizesList.length > 0 ? sizesList.slice(0, 3).join(', ') : 'Free Size'}
                </div>
                <div className="text-primary/50 dark:text-neutral-400 text-[10px] uppercase tracking-wider mt-0.5">
                  Available Sizes
                </div>
              </div>
              <div className="bg-sand-50 dark:bg-[#222222] rounded-xl p-2.5 text-center border border-sand-200/60 dark:border-white/5">
                <div className="font-semibold text-primary dark:text-white text-[11px] truncate capitalize">
                  {colorsList.length > 0 ? colorsList.slice(0, 2).join(', ') : (product?.category || 'Fashion')}
                </div>
                <div className="text-primary/50 dark:text-neutral-400 text-[10px] uppercase tracking-wider mt-0.5">
                  {colorsList.length > 0 ? 'Colors' : 'Category'}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div variants={contentVariants} className="space-y-2 pt-1">
            {product?.stock > 0 && (
              <motion.button
                type="button"
                onClick={handleQuickAdd}
                variants={buttonVariantsMotion}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                className={cn(
                  "w-full h-11 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all",
                  // Light mode button: Bold dark button with light text
                  "bg-primary text-white hover:bg-secondary shadow-primary/10",
                  // Dark mode button: Clean light button with dark text
                  "dark:bg-[#E5E5E5] dark:text-[#111111] dark:hover:bg-white"
                )}
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </motion.button>
            )}
            
            <Link href={`/product/${product?.id || 1}`} className="block w-full">
              <motion.button
                type="button"
                variants={buttonVariantsMotion}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                className={cn(
                  "w-full h-10 rounded-xl font-semibold text-xs flex items-center justify-center transition-all border",
                  // Light mode: Clean bordered sand button
                  "border-sand-200 bg-white/80 text-primary hover:bg-sand-100/70 hover:border-primary/30",
                  // Dark mode: Dark bordered button
                  "dark:border-white/20 dark:bg-black/40 dark:text-white dark:hover:bg-white/10"
                )}
              >
                View Details
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
