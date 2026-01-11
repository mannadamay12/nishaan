import React from "react";

/**
 * AboutSection Component
 * 
 * Clones the "About" section with pixel-perfect accuracy based on the provided 
 * design systems, HTML structure, and computed styles.
 * 
 * Features:
 * - Medium-weight small heading (text-sm, font-medium)
 * - Detailed paragraph (text-sm, leading-relaxed, text-muted-foreground)
 * - Constraints: max-width container as per high-level design (max-w-lg)
 * - Minimalist aesthetic with "text-pretty" for optimal text wrapping
 */
const AboutSection: React.FC = () => {
  return (
    <section 
      className="mb-8"
      style={{
        marginBottom: "2rem", // Replicating the 32px spacing from design system
      }}
    >
      {/* 
        Heading 2:
        - Font Size: 0.875rem (text-sm)
        - Font Weight: 500 (font-medium)
        - Color: #000000 (text-foreground)
        - Margin Bottom: 0.5rem (mb-2)
      */}
      <h2 
        className="mb-2 text-sm font-medium text-foreground"
        style={{
          fontSize: "0.875rem",
          fontWeight: 500,
          color: "var(--foreground)",
          marginBottom: "0.5rem",
        }}
      >
        About
      </h2>

      {/* 
        Paragraph:
        - Font Size: 0.875rem (text-sm)
        - Line Height: 1.625 (leading-relaxed)
        - Color: #737373 (text-muted-foreground)
        - Text Wrap: pretty (for cleaner distribution across lines)
      */}
      <p 
        className="text-sm leading-relaxed text-muted-foreground text-pretty"
        style={{
          fontSize: "0.875rem",
          lineHeight: "1.625",
          color: "var(--muted-foreground)",
          textWrap: "pretty",
        }}
      >
        In a world of infinite scroll, Alam is your quiet corner. Drop links, 
        notes, or thoughts, and they become markers on your path. No algorithms 
        deciding what matters. No feeds competing for attention. Just your 
        signposts, waiting patiently until you need them again.
      </p>
    </section>
  );
};

export default AboutSection;