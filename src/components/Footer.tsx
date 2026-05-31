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
            className="text-[12px] text-[#555] no-underline hover:text-[#F5C200] transition-colors duration-200"
          >
            Admin
          </a>
        </div>
        <div className="flex gap-6 text-text/70">
          <a href="#how-it-works" className="hover:text-primary transition-colors duration-200">About</a>
          <a href="#menu" className="hover:text-primary transition-colors duration-200">Our Menu</a>
          <a href="#order" className="hover:text-primary transition-colors duration-200">Order Online</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
