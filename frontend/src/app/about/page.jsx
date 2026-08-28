'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { usePopup } from '@/context/PopupContext';
import {
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  ChevronDown,
  Truck,
  RotateCcw,
  ShieldCheck,
  FileText,
  Ruler,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Lock,
  Layers,
  Leaf,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AboutPage() {
  const { showToast } = usePopup();
  const [activeSection, setActiveSection] = useState('about');
  
  // Contact form state
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  // FAQ Accordion active indices
  const [openFaq, setOpenFaq] = useState([0]); // First FAQ opened by default

  // Size Guide category & unit tabs
  const [sizeCategory, setSizeCategory] = useState('women');
  const [sizeUnit, setSizeUnit] = useState('in'); // 'in' or 'cm'

  const navItems = [
    { id: 'about', label: 'About Us' },
    { id: 'contact', label: 'Contact Us' },
    { id: 'faq', label: 'FAQ' },
    { id: 'shipping', label: 'Shipping & Returns' },
    { id: 'privacy', label: 'Privacy Policy' },
    { id: 'terms', label: 'Terms & Conditions' },
    { id: 'size-guide', label: 'Size Guide' },
  ];

  // Scroll spy to update active section in sticky nav
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;
      for (const item of navItems) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -120; // Offset for sticky headers
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      showToast('Please fill out all required fields.', 'warning', 'Missing Details');
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
      showToast('Thank you! Your message has been received by our concierge.', 'success', 'Message Dispatched');
    }, 1000);
  };

  const toggleFaq = (index) => {
    if (openFaq.includes(index)) {
      setOpenFaq(openFaq.filter((i) => i !== index));
    } else {
      setOpenFaq([...openFaq, index]);
    }
  };

  const faqs = [
    {
      q: 'How does TCUBE Fashions ensure sustainable and ethical production?',
      a: 'We exclusively partner with certified organic flax and merino wool mills that operate under zero-waste water recycling and fair living wage protocols. Every capsule collection is manufactured in limited runs to eliminate surplus fabric waste.',
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept all major credit and debit cards (Visa, MasterCard, American Express), Cash on Delivery (COD) across Pakistan, and secure bank wire transfers. All transactions are protected via 256-bit SSL encryption.',
    },
    {
      q: 'How long will it take to receive my order?',
      a: 'Standard domestic delivery takes 2–4 business days. Express shipping arrives in 24–48 hours for major metropolitan hubs. International orders generally arrive in 5–8 business days via DHL Express.',
    },
    {
      q: 'Can I exchange or return an item if the size does not fit?',
      a: 'Yes, we offer a hassle-free 14-day complimentary exchange and return policy on all unworn items with original tags intact. Simply initiate a return from your dashboard or contact our customer concierge.',
    },
    {
      q: 'Do you offer bespoke tailoring or custom sizing?',
      a: 'Selected coats, blazers, and evening slip dresses in our Atelier Collection can be customized to your exact body measurements. Reach out via our Contact form with your specifications.',
    },
    {
      q: 'How should I care for my organic linen and silk garments?',
      a: 'We recommend gentle hand washing with cold water and eco-friendly detergent or professional dry cleaning. For linen, steam or press while slightly damp to retain natural softness.',
    },
  ];

  // Size Charts Data
  const sizeTables = {
    women: {
      headers: ['Size', 'Bust', 'Waist', 'Hips', 'Length'],
      rows: [
        { size: 'XS (UK 6)', bust: sizeUnit === 'in' ? '32 - 33"' : '81 - 84 cm', waist: sizeUnit === 'in' ? '24 - 25"' : '61 - 64 cm', hips: sizeUnit === 'in' ? '34 - 35"' : '86 - 89 cm', length: sizeUnit === 'in' ? '40"' : '102 cm' },
        { size: 'S (UK 8)', bust: sizeUnit === 'in' ? '34 - 35"' : '86 - 89 cm', waist: sizeUnit === 'in' ? '26 - 27"' : '66 - 69 cm', hips: sizeUnit === 'in' ? '36 - 37"' : '91 - 94 cm', length: sizeUnit === 'in' ? '41"' : '104 cm' },
        { size: 'M (UK 10)', bust: sizeUnit === 'in' ? '36 - 37"' : '91 - 94 cm', waist: sizeUnit === 'in' ? '28 - 29"' : '71 - 74 cm', hips: sizeUnit === 'in' ? '38 - 39"' : '96 - 99 cm', length: sizeUnit === 'in' ? '42"' : '107 cm' },
        { size: 'L (UK 12)', bust: sizeUnit === 'in' ? '38 - 40"' : '97 - 102 cm', waist: sizeUnit === 'in' ? '30 - 32"' : '76 - 81 cm', hips: sizeUnit === 'in' ? '40 - 42"' : '102 - 107 cm', length: sizeUnit === 'in' ? '43"' : '109 cm' },
        { size: 'XL (UK 14)', bust: sizeUnit === 'in' ? '41 - 43"' : '104 - 109 cm', waist: sizeUnit === 'in' ? '33 - 35"' : '84 - 89 cm', hips: sizeUnit === 'in' ? '43 - 45"' : '109 - 114 cm', length: sizeUnit === 'in' ? '44"' : '112 cm' },
      ],
    },
    men: {
      headers: ['Size', 'Chest', 'Waist', 'Neck', 'Shoulder'],
      rows: [
        { size: 'S (38)', chest: sizeUnit === 'in' ? '36 - 38"' : '91 - 96 cm', waist: sizeUnit === 'in' ? '30 - 31"' : '76 - 79 cm', neck: sizeUnit === 'in' ? '15.0"' : '38 cm', shoulder: sizeUnit === 'in' ? '17.5"' : '44 cm' },
        { size: 'M (40)', chest: sizeUnit === 'in' ? '39 - 41"' : '99 - 104 cm', waist: sizeUnit === 'in' ? '32 - 34"' : '81 - 86 cm', neck: sizeUnit === 'in' ? '15.5"' : '39.5 cm', shoulder: sizeUnit === 'in' ? '18.0"' : '46 cm' },
        { size: 'L (42)', chest: sizeUnit === 'in' ? '42 - 44"' : '107 - 112 cm', waist: sizeUnit === 'in' ? '35 - 37"' : '89 - 94 cm', neck: sizeUnit === 'in' ? '16.5"' : '42 cm', shoulder: sizeUnit === 'in' ? '18.8"' : '48 cm' },
        { size: 'XL (44)', chest: sizeUnit === 'in' ? '45 - 47"' : '114 - 119 cm', waist: sizeUnit === 'in' ? '38 - 40"' : '97 - 102 cm', neck: sizeUnit === 'in' ? '17.5"' : '44.5 cm', shoulder: sizeUnit === 'in' ? '19.5"' : '50 cm' },
        { size: 'XXL (46)', chest: sizeUnit === 'in' ? '48 - 50"' : '122 - 127 cm', waist: sizeUnit === 'in' ? '41 - 43"' : '104 - 109 cm', neck: sizeUnit === 'in' ? '18.5"' : '47 cm', shoulder: sizeUnit === 'in' ? '20.2"' : '52 cm' },
      ],
    },
    kids: {
      headers: ['Age / Size', 'Height', 'Chest', 'Waist', 'Weight'],
      rows: [
        { size: '2 - 3 Years', height: sizeUnit === 'in' ? '35 - 38"' : '89 - 97 cm', chest: sizeUnit === 'in' ? '20 - 21"' : '51 - 53 cm', waist: sizeUnit === 'in' ? '19.5"' : '50 cm', weight: '12 - 15 kg' },
        { size: '4 - 5 Years', height: sizeUnit === 'in' ? '39 - 43"' : '99 - 109 cm', chest: sizeUnit === 'in' ? '22 - 23"' : '56 - 58 cm', waist: sizeUnit === 'in' ? '21.0"' : '53 cm', weight: '16 - 20 kg' },
        { size: '6 - 7 Years', height: sizeUnit === 'in' ? '44 - 48"' : '112 - 122 cm', chest: sizeUnit === 'in' ? '24 - 25"' : '61 - 64 cm', waist: sizeUnit === 'in' ? '22.5"' : '57 cm', weight: '21 - 26 kg' },
        { size: '8 - 9 Years', height: sizeUnit === 'in' ? '49 - 53"' : '124 - 135 cm', chest: sizeUnit === 'in' ? '26 - 27"' : '66 - 69 cm', waist: sizeUnit === 'in' ? '24.0"' : '61 cm', weight: '27 - 33 kg' },
      ],
    },
    shoes: {
      headers: ['EU Size', 'UK Size', 'US Men', 'US Women', 'Foot Length'],
      rows: [
        { size: 'EU 39', uk: 'UK 6', usMen: '6.5', usWomen: '8.0', length: sizeUnit === 'in' ? '9.6"' : '24.5 cm' },
        { size: 'EU 40', uk: 'UK 6.5', usMen: '7.5', usWomen: '9.0', length: sizeUnit === 'in' ? '9.8"' : '25.0 cm' },
        { size: 'EU 41', uk: 'UK 7.5', usMen: '8.0', usWomen: '9.5', length: sizeUnit === 'in' ? '10.2"' : '26.0 cm' },
        { size: 'EU 42', uk: 'UK 8.0', usMen: '8.5', usWomen: '10.0', length: sizeUnit === 'in' ? '10.4"' : '26.5 cm' },
        { size: 'EU 43', uk: 'UK 9.0', usMen: '9.5', usWomen: '11.0', length: sizeUnit === 'in' ? '10.8"' : '27.5 cm' },
        { size: 'EU 44', uk: 'UK 10.0', usMen: '10.5', usWomen: '12.0', length: sizeUnit === 'in' ? '11.0"' : '28.0 cm' },
      ],
    },
  };

  return (
    <div className="min-h-screen text-foreground space-y-16 pb-24 animate-fade-in">
      
      {/* =========================================================================
          HERO BANNER & EDITORIAL INTRODUCTION
          ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-sand-100 dark:bg-sand-100/10 border border-sand-200/60 dark:border-white/10 p-8 md:p-16 lg:p-20 flex flex-col items-center text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-white/10 border border-sand-200/50 dark:border-white/10 text-secondary text-xs uppercase font-bold tracking-widest shadow-xs">
          <Sparkles size={13} />
          <span>Atelier Heritage & Philosophy</span>
        </div>

        <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary dark:text-foreground max-w-3xl leading-[1.15]">
          Elevating Everyday Dressing to Pure Architectural Art.
        </h1>

        <p className="text-sm md:text-base text-primary/70 dark:text-foreground/70 max-w-2xl font-light leading-relaxed">
          Founded in 2024, TCUBE Fashions is a luxury fashion house celebrating minimalist silhouettes, organic raw textures, and mindful artisanal tailoring.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={() => scrollToSection('about')}
            className="px-6 py-3 rounded-xl bg-primary text-white hover:bg-secondary text-xs font-bold uppercase tracking-wider transition-all shadow-md"
          >
            Explore Our Story
          </button>
          <button
            onClick={() => scrollToSection('contact')}
            className="px-6 py-3 rounded-xl border border-sand-300 dark:border-white/20 bg-white/60 dark:bg-white/5 hover:bg-white text-primary dark:text-white text-xs font-bold uppercase tracking-wider transition-all"
          >
            Contact Concierge
          </button>
        </div>
      </section>

      {/* =========================================================================
          STICKY IN-PAGE SUB-NAVIGATION BAR
          ========================================================================= */}
      <div className="sticky top-[72px] z-40 w-full glass-panel border-y border-sand-200/60 dark:border-white/10 backdrop-blur-xl py-3 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-start md:justify-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                activeSection === item.id
                  ? "bg-primary text-white dark:bg-white dark:text-primary shadow-sm"
                  : "text-primary/70 dark:text-foreground/70 hover:text-secondary hover:bg-sand-100/50 dark:hover:bg-white/5"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-24">
        
        {/* =========================================================================
            SECTION 1: ABOUT US & BRAND STORY
            ========================================================================= */}
        <section id="about" className="scroll-mt-32 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-secondary">Section 01</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary dark:text-foreground">About TCUBE Fashions</h2>
            <p className="text-sm text-primary/60 dark:text-foreground/60 leading-relaxed">
              We reject fleeting micro-trends in pursuit of enduring elegance, tactile comfort, and mindful simplicity.
            </p>
          </div>

          {/* Story Split Layout with Images */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-lg border border-sand-200/40 dark:border-white/10">
              <img
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop"
                alt="TCUBE Atelier"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6 md:p-8">
                <span className="text-white font-serif text-xl font-medium italic">
                  "True luxury is felt in the calm simplicity of the cut."
                </span>
              </div>
            </div>

            <div className="space-y-6 text-sm text-primary/80 dark:text-foreground/80 leading-relaxed font-light">
              <h3 className="font-serif text-2xl font-bold text-primary dark:text-foreground leading-snug">
                Crafted for Modern Longevity & Uncompromised Ease
              </h3>
              <p>
                TCUBE Fashions was born out of a desire to curate a timeless wardrobe capsule. We believe that what you wear against your skin should feel effortless, breathable, and deeply intentional.
              </p>
              <p>
                From pure Belgian flax linen to ultra-fine organic Merino wool and hand-buffed suede, every material is thoughtfully sourced to age gracefully and remain your signature pieces season after season.
              </p>
              
              {/* Value Pillars */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-sand-200/60 dark:border-white/10">
                <div className="text-center p-3 rounded-2xl bg-sand-50 dark:bg-white/5 border border-sand-200/40 dark:border-white/5">
                  <Leaf className="w-5 h-5 text-secondary mx-auto mb-1.5" />
                  <span className="block font-bold text-xs text-primary dark:text-white">100% Organic</span>
                  <span className="text-[10px] text-primary/50 dark:text-foreground/50">Natural Fibers</span>
                </div>
                <div className="text-center p-3 rounded-2xl bg-sand-50 dark:bg-white/5 border border-sand-200/40 dark:border-white/5">
                  <Award className="w-5 h-5 text-secondary mx-auto mb-1.5" />
                  <span className="block font-bold text-xs text-primary dark:text-white">Atelier Cut</span>
                  <span className="text-[10px] text-primary/50 dark:text-foreground/50">Master Patterned</span>
                </div>
                <div className="text-center p-3 rounded-2xl bg-sand-50 dark:bg-white/5 border border-sand-200/40 dark:border-white/5">
                  <Layers className="w-5 h-5 text-secondary mx-auto mb-1.5" />
                  <span className="block font-bold text-xs text-primary dark:text-white">Zero Waste</span>
                  <span className="text-[10px] text-primary/50 dark:text-foreground/50">Ethical Batches</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: CONTACT US & STORE CONCIERGE
            ========================================================================= */}
        <section id="contact" className="scroll-mt-32 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-secondary">Section 02</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary dark:text-foreground">Contact Our Concierge</h2>
            <p className="text-sm text-primary/60 dark:text-foreground/60 leading-relaxed">
              Have questions regarding sizing, custom tailoring, or an active order? We are here to assist you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Contact Form */}
            <div className="lg:col-span-7 bg-white dark:bg-[#161616] p-6 md:p-8 rounded-3xl border border-sand-200/80 dark:border-white/10 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-bold text-primary dark:text-white">Send a Message</h3>
                <p className="text-xs text-primary/50 dark:text-foreground/50">Our team replies within 12–24 business hours.</p>
              </div>

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-primary/70 dark:text-foreground/70">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-sand-200 dark:border-white/10 bg-sand-50/50 dark:bg-white/5 text-sm focus:outline-none focus:border-secondary transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-primary/70 dark:text-foreground/70">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="jane@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-sand-200 dark:border-white/10 bg-sand-50/50 dark:bg-white/5 text-sm focus:outline-none focus:border-secondary transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-primary/70 dark:text-foreground/70">Subject</label>
                  <input
                    type="text"
                    placeholder="Order inquiry, sizing question, or styling assistance"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-sand-200 dark:border-white/10 bg-sand-50/50 dark:bg-white/5 text-sm focus:outline-none focus:border-secondary transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-primary/70 dark:text-foreground/70">Message *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Please let us know how we can assist you..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-sand-200 dark:border-white/10 bg-sand-50/50 dark:bg-white/5 text-sm focus:outline-none focus:border-secondary transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3.5 bg-primary dark:bg-white text-white dark:text-primary hover:bg-secondary dark:hover:bg-secondary dark:hover:text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send size={14} />
                  {sending ? 'Sending Message...' : 'Submit Inquiry'}
                </button>
              </form>
            </div>

            {/* Store Information & Map Placeholder */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6 bg-sand-100/60 dark:bg-white/5 p-6 md:p-8 rounded-3xl border border-sand-200/80 dark:border-white/10">
              <div className="space-y-6">
                <h3 className="font-serif text-xl font-bold text-primary dark:text-white">Flagship Concierge</h3>

                <div className="space-y-4 text-xs leading-relaxed text-primary/80 dark:text-foreground/80">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-white/10 text-secondary shadow-xs">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <span className="block font-bold text-primary dark:text-white">Atelier Address</span>
                      <span>Suite 402, Luxury Fashion Avenue, Gulberg III, Lahore, Pakistan</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-white/10 text-secondary shadow-xs">
                      <Mail size={16} />
                    </div>
                    <div>
                      <span className="block font-bold text-primary dark:text-white">Electronic Mail</span>
                      <span>concierge@tcubefashions.com</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-white/10 text-secondary shadow-xs">
                      <Phone size={16} />
                    </div>
                    <div>
                      <span className="block font-bold text-primary dark:text-white">Direct Line</span>
                      <span>+92 (042) 3578-9900</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-white/10 text-secondary shadow-xs">
                      <Clock size={16} />
                    </div>
                    <div>
                      <span className="block font-bold text-primary dark:text-white">Concierge Hours</span>
                      <span>Mon – Sat: 10:00 AM – 8:00 PM (PKT)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stylized Map Placeholder */}
              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-sand-200 dark:border-white/10 bg-sand-200/50 dark:bg-white/10 flex items-center justify-center text-center p-4">
                <div className="space-y-1">
                  <MapPin size={24} className="text-secondary mx-auto animate-bounce" />
                  <span className="block font-bold text-xs text-primary dark:text-white">Gulberg Flagship Studio</span>
                  <span className="text-[10px] text-primary/50 dark:text-foreground/50">Private appointments available upon request</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: FAQ (FREQUENTLY ASKED QUESTIONS)
            ========================================================================= */}
        <section id="faq" className="scroll-mt-32 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-secondary">Section 03</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary dark:text-foreground">Frequently Asked Questions</h2>
            <p className="text-sm text-primary/60 dark:text-foreground/60 leading-relaxed">
              Find quick answers regarding our capsule production, order processing, and garment care.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq.includes(index);
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-sand-200/80 dark:border-white/10 bg-white dark:bg-[#161616] overflow-hidden transition-all shadow-xs"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-primary dark:text-foreground hover:text-secondary transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={cn(
                        "text-secondary shrink-0 transition-transform duration-300",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                      >
                        <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-primary/70 dark:text-foreground/70 leading-relaxed border-t border-sand-100 dark:border-white/5">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            SECTION 4: SHIPPING & RETURNS POLICY
            ========================================================================= */}
        <section id="shipping" className="scroll-mt-32 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-secondary">Section 04</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary dark:text-foreground">Shipping & Returns</h2>
            <p className="text-sm text-primary/60 dark:text-foreground/60 leading-relaxed">
              Transparent transit timelines and effortless 14-day return guarantees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Domestic Delivery */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#161616] border border-sand-200/80 dark:border-white/10 space-y-4 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-sand-100 dark:bg-white/10 text-secondary flex items-center justify-center">
                <Truck size={20} />
              </div>
              <h3 className="font-serif text-lg font-bold text-primary dark:text-white">Domestic Shipping</h3>
              <ul className="space-y-2 text-xs text-primary/70 dark:text-foreground/70 leading-relaxed">
                <li>• <strong>Standard Delivery:</strong> 2–4 business days across all cities. Complimentary on orders over Rs. 10,000.</li>
                <li>• <strong>Express Delivery:</strong> Next-day dispatch available in Lahore, Karachi & Islamabad.</li>
                <li>• <strong>Cash on Delivery (COD):</strong> Fully supported nationwide.</li>
              </ul>
            </div>

            {/* Card 2: International Delivery */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#161616] border border-sand-200/80 dark:border-white/10 space-y-4 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-sand-100 dark:bg-white/10 text-secondary flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-serif text-lg font-bold text-primary dark:text-white">Global Express</h3>
              <ul className="space-y-2 text-xs text-primary/70 dark:text-foreground/70 leading-relaxed">
                <li>• <strong>Worldwide Transit:</strong> 5–8 business days via DHL Express Tracked.</li>
                <li>• <strong>Customs & Duties:</strong> DDU (Delivery Duty Unpaid) basis.</li>
                <li>• <strong>Signature Required:</strong> Insured delivery for luxury piece security.</li>
              </ul>
            </div>

            {/* Card 3: 14-Day Returns */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#161616] border border-sand-200/80 dark:border-white/10 space-y-4 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-sand-100 dark:bg-white/10 text-secondary flex items-center justify-center">
                <RotateCcw size={20} />
              </div>
              <h3 className="font-serif text-lg font-bold text-primary dark:text-white">14-Day Returns & Exchanges</h3>
              <ul className="space-y-2 text-xs text-primary/70 dark:text-foreground/70 leading-relaxed">
                <li>• <strong>Condition:</strong> Unworn, unwashed, with all original atelier tags attached.</li>
                <li>• <strong>Refunds:</strong> Processed to original payment method or store credit within 5 days of receipt.</li>
                <li>• <strong>Free Size Exchange:</strong> Free pickup for size swaps.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 5: PRIVACY POLICY
            ========================================================================= */}
        <section id="privacy" className="scroll-mt-32 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-secondary">Section 05</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary dark:text-foreground">Privacy Policy</h2>
            <p className="text-sm text-primary/60 dark:text-foreground/60 leading-relaxed">
              Last updated: January 2026. How we safeguard and handle your personal data.
            </p>
          </div>

          <div className="p-6 md:p-10 rounded-3xl bg-white dark:bg-[#161616] border border-sand-200/80 dark:border-white/10 text-xs md:text-sm text-primary/80 dark:text-foreground/80 space-y-6 leading-relaxed shadow-xs">
            <div className="space-y-2">
              <h3 className="font-serif text-base font-bold text-primary dark:text-white">1. Data Collection & Usage</h3>
              <p>
                We collect personal information necessary to fulfill your orders, including your full name, shipping destination, email address, phone number, and billing credentials. Your data is used exclusively to facilitate order processing, deliver real-time dispatch alerts, and enhance your browsing experience.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-base font-bold text-primary dark:text-white">2. Payment Security</h3>
              <p>
                TCUBE Fashions does not store your full payment card credentials on our servers. All digital transactions are processed through PCI-DSS Level 1 compliant gateway partners utilizing 256-bit SSL encryption.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-base font-bold text-primary dark:text-white">3. Cookies & Session Storage</h3>
              <p>
                We utilize essential cookies to remember your bag selections, theme preferences (Light/Dark mode), and authentication sessions. You may modify your browser settings to restrict cookies at any time.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-base font-bold text-primary dark:text-white">4. Your Privacy Rights</h3>
              <p>
                You retain the right to access, amend, or request the permanent deletion of your customer profile. To exercise these rights, please contact our data officer at <strong>privacy@tcubefashions.com</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 6: TERMS & CONDITIONS
            ========================================================================= */}
        <section id="terms" className="scroll-mt-32 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-secondary">Section 06</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary dark:text-foreground">Terms & Conditions</h2>
            <p className="text-sm text-primary/60 dark:text-foreground/60 leading-relaxed">
              The rules, guidelines, and legal agreements governing the use of TCUBE Fashions.
            </p>
          </div>

          <div className="p-6 md:p-10 rounded-3xl bg-white dark:bg-[#161616] border border-sand-200/80 dark:border-white/10 text-xs md:text-sm text-primary/80 dark:text-foreground/80 space-y-6 leading-relaxed shadow-xs">
            <div className="space-y-2">
              <h3 className="font-serif text-base font-bold text-primary dark:text-white">1. Agreement to Terms</h3>
              <p>
                By accessing or placing an order through TCUBE Fashions, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-base font-bold text-primary dark:text-white">2. Product Descriptions & Pricing</h3>
              <p>
                We strive to display garment colors, textures, and measurements as accurately as possible. However, actual color tones may vary slightly depending on your monitor display calibration. All prices are listed in Pakistani Rupees (PKR) and are subject to adjustment without prior notice.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-base font-bold text-primary dark:text-white">3. Order Acceptance & Atelier Stock</h3>
              <p>
                All orders are subject to acceptance and raw material availability. In the rare event an item is out of stock after order placement, our concierge will promptly contact you to provide an immediate refund or alternative piece.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-base font-bold text-primary dark:text-white">4. Intellectual Property</h3>
              <p>
                All visual imagery, garment patterns, branding marks, and editorial texts published on this platform are the exclusive intellectual property of TCUBE Fashions. Unauthorized reproduction or commercial use is strictly prohibited.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 7: SIZE GUIDE (CATEGORIZED TABLES)
            ========================================================================= */}
        <section id="size-guide" className="scroll-mt-32 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-secondary">Section 07</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary dark:text-foreground">Atelier Size Guide</h2>
            <p className="text-sm text-primary/60 dark:text-foreground/60 leading-relaxed">
              Find your tailored fit across our women's, men's, kids', and footwear collections.
            </p>
          </div>

          <div className="space-y-6">
            {/* Category Switcher Tabs & Unit Toggle */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 rounded-2xl bg-sand-100/70 dark:bg-white/5 border border-sand-200/60 dark:border-white/10">
              <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                {['women', 'men', 'kids', 'shoes'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSizeCategory(cat)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                      sizeCategory === cat
                        ? "bg-primary text-white dark:bg-white dark:text-primary shadow-sm"
                        : "text-primary/70 dark:text-foreground/70 hover:text-secondary"
                    )}
                  >
                    {cat === 'women' ? "Women's" : cat === 'men' ? "Men's" : cat === 'kids' ? "Kids" : "Footwear"}
                  </button>
                ))}
              </div>

              {/* Units Toggle (Inches / Centimeters) */}
              <div className="flex items-center gap-1 bg-white dark:bg-black/40 p-1 rounded-xl border border-sand-200 dark:border-white/10 self-end sm:self-auto">
                <button
                  onClick={() => setSizeUnit('in')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                    sizeUnit === 'in' ? "bg-secondary text-white" : "text-primary/60 dark:text-foreground/60"
                  )}
                >
                  Inches (in)
                </button>
                <button
                  onClick={() => setSizeUnit('cm')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                    sizeUnit === 'cm' ? "bg-secondary text-white" : "text-primary/60 dark:text-foreground/60"
                  )}
                >
                  Centimeters (cm)
                </button>
              </div>
            </div>

            {/* Size Guide Table */}
            <div className="overflow-x-auto rounded-3xl border border-sand-200/80 dark:border-white/10 bg-white dark:bg-[#161616] shadow-xs">
              <table className="w-full text-left text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-sand-200 dark:border-white/10 bg-sand-50 dark:bg-white/5">
                    {sizeTables[sizeCategory].headers.map((h, i) => (
                      <th key={i} className="p-4 md:p-5 font-serif font-bold uppercase tracking-wider text-primary dark:text-white">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100 dark:divide-white/5">
                  {sizeCategory === 'women' &&
                    sizeTables.women.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-sand-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="p-4 md:p-5 font-bold text-primary dark:text-white">{row.size}</td>
                        <td className="p-4 md:p-5 text-primary/80 dark:text-foreground/80">{row.bust}</td>
                        <td className="p-4 md:p-5 text-primary/80 dark:text-foreground/80">{row.waist}</td>
                        <td className="p-4 md:p-5 text-primary/80 dark:text-foreground/80">{row.hips}</td>
                        <td className="p-4 md:p-5 text-primary/80 dark:text-foreground/80">{row.length}</td>
                      </tr>
                    ))}

                  {sizeCategory === 'men' &&
                    sizeTables.men.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-sand-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="p-4 md:p-5 font-bold text-primary dark:text-white">{row.size}</td>
                        <td className="p-4 md:p-5 text-primary/80 dark:text-foreground/80">{row.chest}</td>
                        <td className="p-4 md:p-5 text-primary/80 dark:text-foreground/80">{row.waist}</td>
                        <td className="p-4 md:p-5 text-primary/80 dark:text-foreground/80">{row.neck}</td>
                        <td className="p-4 md:p-5 text-primary/80 dark:text-foreground/80">{row.shoulder}</td>
                      </tr>
                    ))}

                  {sizeCategory === 'kids' &&
                    sizeTables.kids.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-sand-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="p-4 md:p-5 font-bold text-primary dark:text-white">{row.size}</td>
                        <td className="p-4 md:p-5 text-primary/80 dark:text-foreground/80">{row.height}</td>
                        <td className="p-4 md:p-5 text-primary/80 dark:text-foreground/80">{row.chest}</td>
                        <td className="p-4 md:p-5 text-primary/80 dark:text-foreground/80">{row.waist}</td>
                        <td className="p-4 md:p-5 text-primary/80 dark:text-foreground/80">{row.weight}</td>
                      </tr>
                    ))}

                  {sizeCategory === 'shoes' &&
                    sizeTables.shoes.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-sand-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="p-4 md:p-5 font-bold text-primary dark:text-white">{row.size}</td>
                        <td className="p-4 md:p-5 text-primary/80 dark:text-foreground/80">{row.uk}</td>
                        <td className="p-4 md:p-5 text-primary/80 dark:text-foreground/80">{row.usMen}</td>
                        <td className="p-4 md:p-5 text-primary/80 dark:text-foreground/80">{row.usWomen}</td>
                        <td className="p-4 md:p-5 text-primary/80 dark:text-foreground/80">{row.length}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Measuring Tips Card */}
            <div className="p-5 rounded-2xl bg-sand-50 dark:bg-white/5 border border-sand-200/60 dark:border-white/10 flex items-start gap-3">
              <Ruler className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <div className="text-xs text-primary/70 dark:text-foreground/70 leading-relaxed">
                <strong>How to Measure:</strong> Use a flexible tape measure over form-fitting undergarments. Keep the tape comfortably snug without pulling tight. If you find yourself between sizes, we recommend ordering the larger size for a relaxed drape.
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
