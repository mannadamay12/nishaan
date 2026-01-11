import React from 'react';

const JoinSection: React.FC = () => {
  return (
    <section 
      className="mb-8"
      style={{
        marginBottom: '2rem'
      }}
    >
      <h2 
        className="text-foreground font-medium"
        style={{
          fontSize: '0.875rem',
          lineHeight: '1.25rem',
          marginBottom: '0.5rem'
        }}
      >
        Join
      </h2>
      <p 
        className="text-muted-foreground leading-relaxed"
        style={{
          fontSize: '0.875rem',
          lineHeight: '1.625',
          margin: '0px'
        }}
      >
        Create an account to start organizing your bookmarks.{' '}
        <a 
          href="/auth/sign-up" 
          className="text-foreground underline underline-offset-4 transition-opacity duration-200 hover:opacity-80 decoration-1"
          style={{
            color: 'rgb(0, 0, 0)',
            textDecoration: 'underline',
            textUnderlineOffset: '4px'
          }}
        >
          Sign up here
        </a>{' '}
        to get started.
      </p>
    </section>
  );
};

export default JoinSection;