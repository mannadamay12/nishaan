import React from "react";

/**
 * Footer component cloned from the provided design instructions and HTML structure.
 * Features a top border, versioning in italics (left), and credits with an underlined link (right).
 */
const Footer = () => {
  return (
    <footer className="border-t border-border pt-6 mt-8">
      <div 
        className="flex items-center justify-between text-xs text-muted-foreground"
        style={{
          fontFamily: 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
        }}
      >
        <span className="italic">v0.01</span>
        <span>
          Crafted by{" "}
          <a
            className="underline underline-offset-4 hover:text-foreground transition-colors"
            href="https://x.com/zaidmukaddam"
            target="_blank"
            rel="noopener noreferrer"
          >
            Zaid
          </a>
        </span>
      </div>
    </footer>
  );
};

export default Footer;