import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-surface border-t border-border py-12 px-6 text-center text-muted text-sm font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <img
            src="/logo.jpeg"
            alt="Bam's Delicacies"
            className="h-8 w-8 rounded-full object-cover border border-border"
          />
          <span className="font-serif font-black text-heading text-lg tracking-tight">
            Bam's Delicacies
          </span>
        </div>
        <div className="md:order-last flex flex-col items-center md:items-end gap-1.5">
          <p className="text-xs">
            © {new Date().getFullYear()} Bam's Delicacies. All rights reserved.
          </p>
          <a
            href="/admin"
            className="text-[12px] text-[#555] no-underline md:hover:text-[#F5C200] transition-colors duration-200 py-1.5 px-3 rounded-lg border border-transparent hover:border-border min-h-[44px] flex items-center justify-center"
          >
            Admin
          </a>
        </div>
        <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-text/70 font-semibold select-none">
          <a href="#how-it-works" className="py-2 px-3 md:hover:text-primary transition-colors duration-200 min-h-[44px] flex items-center">About</a>
          <a href="#menu" className="py-2 px-3 md:hover:text-primary transition-colors duration-200 min-h-[44px] flex items-center">Our Menu</a>
          <a href="#order" className="py-2 px-3 md:hover:text-primary transition-colors duration-200 min-h-[44px] flex items-center">Order Online</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
