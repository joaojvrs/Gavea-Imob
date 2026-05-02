/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import React from "react";
import { Menu, Search, User } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: id } });
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-12 h-14 md:h-16"
    >
      <div className="absolute inset-0 bg-brand-blue" />
      
      <div className="relative z-10 flex items-center gap-4 md:gap-8 h-full">
        <Link to="/" className="flex items-center group h-full">
          <img 
            src="/logo gavea.webp" 
            alt="Gávea AI Logo" 
            className="w-20 h-20 md:w-32 md:h-32 object-contain group-hover:scale-110 transition-transform duration-500"
          />
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-white/70">
          <a href="#collection" onClick={(e) => handleLinkClick(e, 'collection')} className="hover:text-white transition-colors">Portfólio</a>
          <a href="#visionary" onClick={(e) => handleLinkClick(e, 'visionary')} className="hover:text-brand-accent transition-colors">Gávea AI</a>
          <a href="#about" onClick={(e) => handleLinkClick(e, 'about')} className="hover:text-white transition-colors">Sobre</a>
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-2">
        <button className="p-2 text-white/70 hover:text-white transition-colors" aria-label="Search">
          <Search size={20} />
        </button>
        <button className="p-2 text-white/70 hover:text-white transition-colors hidden sm:block" aria-label="Profile">
          <User size={20} />
        </button>
        <button className="md:hidden p-2 text-white/70 hover:text-white transition-colors" aria-label="Menu">
          <Menu size={20} />
        </button>
        <button className="hidden md:block bg-white text-brand-blue px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-accent hover:text-white transition-all duration-300 active:scale-95 shadow-xl">
          Seja Exclusivo
        </button>
      </div>
    </motion.nav>
  );
}
