import React from 'react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      number: 1,
      icon: '🛒',
      title: 'Browse & Order',
      description: "Choose from Bam's delicious homemade specials, any day of the week.",
    },
    {
      number: 2,
      icon: '📅',
      title: 'Pick Your Day',
      description: 'Select Saturday or Sunday delivery. Limited slots available weekly.',
    },
    {
      number: 3,
      icon: '🍱',
      title: 'Receive with Love',
      description: 'Fresh homemade food delivered directly to your door, ready to enjoy.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Frosted Glass Overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
      />

      {/* Modal Box */}
      <div 
        className="relative z-10 w-full bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-2xl animate-fade-slide-up text-center flex flex-col items-center gap-6"
        style={{ maxWidth: '420px', maxHeight: '90vh' }}
      >
        {/* Absolute Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-xl bg-surface-2 border border-border text-text hover:text-primary hover:border-primary active:scale-95 transition-all duration-200"
          aria-label="Close modal"
        >
          ✕
        </button>
        <div>
          <h2 className="font-serif font-black text-2xl md:text-3xl text-heading leading-tight">
            How It Works
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto mt-3 rounded-full shadow-primary" />
          <p className="font-sans text-xs text-muted mt-2">
            Mom's homemade delicacies straight to your dining table!
          </p>
        </div>

        {/* Steps container */}
        <div className="w-full space-y-5 text-left my-2 overflow-y-auto max-h-[45vh] pr-1">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-4 items-start bg-surface-2/40 border border-border/40 p-3.5 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-yellow text-white font-sans font-black flex items-center justify-center shadow-md flex-shrink-0">
                {step.number}
              </div>
              <div className="min-w-0">
                <h4 className="font-serif font-bold text-sm text-heading mb-0.5 leading-snug">
                  {step.icon} {step.title}
                </h4>
                <p className="font-sans text-xs text-text/80 leading-relaxed font-medium">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-4 bg-gradient-to-r from-primary to-yellow md:hover:scale-[1.03] active:scale-95 transition-all text-white font-sans font-black text-sm uppercase tracking-wider rounded-full shadow-yellow select-none focus:outline-none"
        >
          Go! 🎉
        </button>
      </div>
    </div>
  );
};

export default HowItWorksModal;
