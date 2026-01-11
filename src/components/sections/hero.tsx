import React from "react";

/**
 * HeroSection Component
 * Clones the hero intro section featuring the title "Alam (علام)" 
 * with the Arabic text in a muted color.
 * 
 * Path: src/components/sections/hero.tsx
 */
const HeroSection: React.FC = () => {
  return (
    <section 
      className="mb-8"
      style={{
        marginBottom: "2rem", // Replicating mb-8 (2rem/32px based on high-level design)
      }}
    >
      <h1 
        className="text-base font-medium text-foreground tracking-normal"
        style={{
          fontSize: "1rem", // 16px based on computed styles and design system
          fontWeight: 500,
          color: "rgb(0, 0, 0)", // Foreground color
          marginBottom: "0.5rem", // mb-2 is 0.5rem
          lineHeight: "1", // Specific to heading
        }}
      >
        Alam{" "}
        <span 
          className="text-muted-foreground"
          style={{
            color: "rgb(115, 115, 115)", // Equivalent to #737373 / text-muted-foreground
          }}
        >
          (علام)
        </span>
      </h1>
      
      <p 
        className="text-sm leading-relaxed text-muted-foreground text-pretty"
        style={{
          fontSize: "0.875rem", // 14px
          lineHeight: "1.625", // Relaxed leading as specified in instructions
          color: "rgb(115, 115, 115)", // #737373
          textWrap: "pretty", // Optimization for line breaks
          margin: 0,
        }}
      >
        A marker for your digital journey. Signposts to guide you back to the places worth remembering.
      </p>
    </section>
  );
};

export default HeroSection;