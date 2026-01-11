import React from "react";

/**
 * Header component for the Alam website.
 * 
 * Features:
 * - A black circular logo placeholder (6x6 rounded-full div) on the left.
 * - A "Login" text link with an underline and muted-foreground color on the right.
 * - Margin-bottom of 16 (4rem) for spacing as per design requirements and computed styles.
 */
export default function Header() {
  return (
    <header className="flex items-center justify-between mb-16">
      {/* Black circular logo placeholder */}
      <div 
        className="h-6 w-6 rounded-full bg-foreground" 
        aria-hidden="true"
      />
      
      {/* Login link */}
      <a 
        href="/auth/login" 
        className="text-sm text-muted-foreground underline underline-offset-4 transition-colors duration-200 hover:text-foreground"
      >
        Login
      </a>
    </header>
  );
}