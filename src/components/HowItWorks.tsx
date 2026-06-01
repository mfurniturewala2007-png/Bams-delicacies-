import React from 'react';

interface HowItWorksCardProps {
  number: number;
  icon: string;
  title: string;
  description: string;
  delayMs: number;
}

const HowItWorksCard: React.FC<HowItWorksCardProps> = ({ number, icon, title, description, delayMs }) => {
  return (
    <div
      className="relative bg-surface border border-border hover:border-primary hover:shadow-yellow rounded-2xl p-6 pt-10 md:p-8 md:pt-10 shadow-card hover:scale-[1.03] hover:-translate-y-1 transition-all duration-300 group opacity-0 animate-fade-slide-up"
      style={{ animationDelay: `${delayMs}ms`, transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      {/* Dynamic Number Badge overlapping the top boundary */}
      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-yellow text-white font-sans font-black text-lg flex items-center justify-center border-4 border-bg shadow-primary group-hover:scale-110 group-hover:shadow-yellow-strong transition-all duration-300">
        {number}
      </div>

      {/* Visual Header / Emoji Icon */}
      <div className="text-4xl mb-4 text-center mt-2 group-hover:animate-float" style={{ animationDuration: '3s' }}>
        {icon}
      </div>

      {/* Card Content */}
      <h3 className="font-serif font-bold text-xl text-heading text-center mb-3">
        {title}
      </h3>
      <p className="font-sans font-medium text-text/75 text-sm md:text-base text-center leading-relaxed">
        {description}
      </p>
    </div>
  );
};

const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: 1,
      icon: '🛒',
      title: 'Browse & Order',
      description: "Choose from Bam's homemade specials, any day of the week.",
      delayMs: 100,
    },
    {
      number: 2,
      icon: '📅',
      title: 'Pick Your Day',
      description: 'Select Saturday or Sunday delivery. Limited to 15 orders per day.',
      delayMs: 200,
    },
    {
      number: 3,
      icon: '🍱',
      title: 'Receive with Love',
      description: 'Fresh homemade food delivered directly to your door, ready to enjoy.',
      delayMs: 300,
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-32 px-4 md:px-12 bg-bg border-t border-border/40 relative">
      {/* Background visual detail */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(circle at 80% 20%, rgba(200,81,27,0.02) 0%, rgba(255,248,238,0) 50%)'
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Title */}
        <div className="text-center mb-12 md:mb-20">
          <h2 className="font-serif font-black text-4xl md:text-6xl text-heading tracking-tight drop-shadow">
            How It Works
          </h2>
          <div className="w-20 h-1 bg-primary mx-auto mt-4 rounded-full shadow-primary" />
          <p className="text-muted text-sm md:text-base mt-4 max-w-md mx-auto leading-relaxed">
            Three simple steps to bring mom's homemade delicacies straight to your dining table.
          </p>
        </div>

        {/* Dynamic 3-Column Stagger-delayed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 pt-4">
          {steps.map((step) => (
            <HowItWorksCard
              key={step.number}
              number={step.number}
              icon={step.icon}
              title={step.title}
              description={step.description}
              delayMs={step.delayMs}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
