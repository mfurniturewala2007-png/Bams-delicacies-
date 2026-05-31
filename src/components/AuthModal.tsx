import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    needsProfile,
    isEditingProfile,
    closeAuthModal,
    signIn,
    signUp,
    upsertProfile,
    user,
    profile,
  } = useAuth();

  const [tab, setTab] = useState<'signin' | 'signup'>('signup');
  
  // Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Profile fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');

  // States
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Sync profile fields when modal opens or profile changes
  React.useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setPincode(profile.pincode || '');
    } else {
      setName('');
      setPhone('');
      setAddress('');
      setPincode('');
    }
  }, [profile, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  // Decide current active step
  const activeStep = (needsProfile || isEditingProfile) ? 'profile' : tab;

  // Toggle Tab
  const handleTabToggle = (newTab: 'signin' | 'signup') => {
    setTab(newTab);
    setErrorMsg('');
    setFieldErrors({});
    setEmail('');
    setPassword('');
  };

  // Submit Handler: Sign In
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await signIn(email.trim(), password);
      // Success will trigger AuthContext update, which closes modal or forces profile setup
    } catch (err: any) {
      console.error('Sign In error:', err);
      setErrorMsg(err.message || 'Incorrect email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Handler: Sign Up
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    }
    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (!name.trim()) {
      errors.name = 'Full Name is required';
    }
    if (!phone.trim()) {
      errors.phone = 'Phone Number is required';
    } else if (!/^[0-9]{10}$/.test(phone.trim())) {
      errors.phone = 'Phone must be exactly 10 digits';
    }
    if (!address.trim()) {
      errors.address = 'Delivery Address is required';
    }
    if (!pincode.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!/^[0-9]{6}$/.test(pincode.trim())) {
      errors.pincode = 'Pincode must be exactly 6 digits';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      setFieldErrors({});
      await signUp(email.trim(), password, {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        pincode: pincode.trim(),
      });
    } catch (err: any) {
      console.error('Sign Up error:', err);
      setErrorMsg(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Handler: Profile setup
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!name.trim()) {
      errors.name = 'Full Name is required';
    }
    if (!phone.trim()) {
      errors.phone = 'Phone Number is required';
    } else if (!/^[0-9]{10}$/.test(phone.trim())) {
      errors.phone = 'Phone must be exactly 10 digits';
    }
    if (!address.trim()) {
      errors.address = 'Delivery Address is required';
    }
    if (!pincode.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!/^[0-9]{6}$/.test(pincode.trim())) {
      errors.pincode = 'Pincode must be exactly 6 digits';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      setFieldErrors({});
      await upsertProfile({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        pincode: pincode.trim(),
      });
      // Success will close modal inside context
    } catch (err: any) {
      console.error('Profile Upsert error:', err);
      setErrorMsg(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-text">
      {/* Dimmed Overlay */}
      <div
        onClick={() => {
          // Locked: modal cannot be closed if user is not authenticated OR profile setup is mandatory
          if (user && !needsProfile) {
            closeAuthModal();
          }
        }}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />

      {/* Centered Modal Content Card */}
      <div className="w-full max-w-[440px] bg-surface border border-border p-8 rounded-2xl shadow-2xl relative z-10 text-center animate-fade-slide-up flex flex-col max-h-[90vh] overflow-y-auto">
        
        {/* Dismiss Button (only shown if profile setup is not locked and user is authenticated) */}
        {user && !needsProfile && (
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-1 rounded-lg bg-surface-2 border border-border text-text hover:text-primary transition-all duration-200"
            aria-label="Close modal"
          >
            ✕
          </button>
        )}

        <img
          src="/logo.jpeg"
          alt="Bam's Delicacies"
          className="w-16 h-16 rounded-full mx-auto mb-4 object-cover border border-border shadow-md"
        />

        {activeStep === 'signin' && (
          <>
            <h1 className="font-serif font-black text-2xl text-heading mb-1">Welcome Back</h1>
            <p className="font-sans text-xs text-muted mb-6">Sign in to check out and track your gourmet orders.</p>

            {errorMsg && (
              <div className="bg-error/10 border border-error/25 text-error text-xs font-semibold px-4 py-2.5 rounded-xl text-left mb-4 font-sans">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSignInSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-[11px] font-sans font-bold text-text/80 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text font-sans placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-sans font-bold text-text/80 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text font-sans placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-yellow text-bg font-sans font-black uppercase tracking-wider py-3.5 rounded-xl hover:bg-yellow-dim hover:scale-[1.02] shadow-yellow active:scale-98 transition-all duration-300 mt-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center select-none">
              <span className="text-xs text-muted font-sans">
                Don't have an account?{' '}
                <button
                  onClick={() => handleTabToggle('signup')}
                  className="text-primary font-bold hover:underline"
                >
                  Sign Up
                </button>
              </span>
            </div>
          </>
        )}

        {activeStep === 'signup' && (
          <>
            <h1 className="font-serif font-black text-2xl text-heading mb-1">Create Account</h1>
            <p className="font-sans text-xs text-muted mb-6">Sign up to reserve slots and place orders instantly.</p>

            {errorMsg && (
              <div className="bg-error/10 border border-error/25 text-error text-xs font-semibold px-4 py-2.5 rounded-xl text-left mb-4 font-sans">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSignUpSubmit} className="space-y-3.5 text-left">
              <div>
                <label className="block text-[11px] font-sans font-bold text-text/80 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-primary">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder="name@example.com"
                  className={`w-full bg-surface-2 border rounded-xl px-4 py-2.5 text-text font-sans placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                    fieldErrors.email ? 'border-error' : 'border-border'
                  }`}
                />
                {fieldErrors.email && (
                  <span className="text-error text-[10px] font-semibold font-sans mt-1 block">
                    {fieldErrors.email}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-sans font-bold text-text/80 uppercase tracking-wider mb-1.5">
                  Password (min 6 chars) <span className="text-primary">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  placeholder="••••••••"
                  className={`w-full bg-surface-2 border rounded-xl px-4 py-2.5 text-text font-sans placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                    fieldErrors.password ? 'border-error' : 'border-border'
                  }`}
                />
                {fieldErrors.password && (
                  <span className="text-error text-[10px] font-semibold font-sans mt-1 block">
                    {fieldErrors.password}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-sans font-bold text-text/80 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder="e.g. Mohammed Furniturewala"
                  className={`w-full bg-surface-2 border rounded-xl px-4 py-2.5 text-text font-sans placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                    fieldErrors.name ? 'border-error' : 'border-border'
                  }`}
                />
                {fieldErrors.name && (
                  <span className="text-error text-[10px] font-semibold font-sans mt-1 block">
                    {fieldErrors.name}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-sans font-bold text-text/80 uppercase tracking-wider mb-1.5">
                    Phone Number <span className="text-primary">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    maxLength={10}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/[^0-9]/g, ''));
                      if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    placeholder="10-digit mobile"
                    className={`w-full bg-surface-2 border rounded-xl px-4 py-2.5 text-text font-sans placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                      fieldErrors.phone ? 'border-error' : 'border-border'
                    }`}
                  />
                  {fieldErrors.phone && (
                    <span className="text-error text-[10px] font-semibold font-sans mt-1 block">
                      {fieldErrors.phone}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-sans font-bold text-text/80 uppercase tracking-wider mb-1.5">
                    Pincode <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    maxLength={6}
                    onChange={(e) => {
                      setPincode(e.target.value.replace(/[^0-9]/g, ''));
                      if (fieldErrors.pincode) setFieldErrors((prev) => ({ ...prev, pincode: '' }));
                    }}
                    placeholder="6-digit pincode"
                    className={`w-full bg-surface-2 border rounded-xl px-4 py-2.5 text-text font-sans placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                      fieldErrors.pincode ? 'border-error' : 'border-border'
                    }`}
                  />
                  {fieldErrors.pincode && (
                    <span className="text-error text-[10px] font-semibold font-sans mt-1 block">
                      {fieldErrors.pincode}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-sans font-bold text-text/80 uppercase tracking-wider mb-1.5">
                  Delivery Address <span className="text-primary">*</span>
                </label>
                <textarea
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: '' }));
                  }}
                  placeholder="Enter your flat/street, landmark details for hot deliveries..."
                  rows={2}
                  className={`w-full bg-surface-2 border rounded-xl px-4 py-2.5 text-text font-sans placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none ${
                    fieldErrors.address ? 'border-error' : 'border-border'
                  }`}
                />
                {fieldErrors.address && (
                  <span className="text-error text-[10px] font-semibold font-sans mt-1 block">
                    {fieldErrors.address}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-yellow text-bg font-sans font-black uppercase tracking-wider py-3.5 rounded-xl hover:bg-yellow-dim hover:scale-[1.02] shadow-yellow active:scale-98 transition-all duration-300 mt-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center select-none">
              <span className="text-xs text-muted font-sans">
                Already have an account?{' '}
                <button
                  onClick={() => handleTabToggle('signin')}
                  className="text-primary font-bold hover:underline"
                >
                  Sign In
                </button>
              </span>
            </div>
          </>
        )}

        {activeStep === 'profile' && (
          <>
            <h1 className="font-serif font-black text-2xl text-heading mb-1">Tell us about yourself 👋</h1>
            <p className="font-sans text-xs text-muted mb-6">Complete your mandatory profile details to reserve order slots.</p>

            {errorMsg && (
              <div className="bg-error/10 border border-error/25 text-error text-xs font-semibold px-4 py-2.5 rounded-xl text-left mb-4 font-sans">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-[11px] font-sans font-bold text-text/50 uppercase tracking-wider mb-1">
                  Email (read-only)
                </label>
                <input
                  type="text"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-surface-2/50 border border-border/40 rounded-xl px-4 py-2.5 text-text/50 font-sans cursor-not-allowed select-none focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-sans font-bold text-text/80 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder="e.g. Mohammed Furniturewala"
                  className={`w-full bg-surface-2 border rounded-xl px-4 py-2.5 text-text font-sans placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                    fieldErrors.name ? 'border-error' : 'border-border'
                  }`}
                />
                {fieldErrors.name && (
                  <span className="text-error text-[10px] font-semibold font-sans mt-1 block">
                    {fieldErrors.name}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-sans font-bold text-text/80 uppercase tracking-wider mb-1.5">
                    Phone Number <span className="text-primary">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    maxLength={10}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/[^0-9]/g, ''));
                      if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    placeholder="10-digit mobile"
                    className={`w-full bg-surface-2 border rounded-xl px-4 py-2.5 text-text font-sans placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                      fieldErrors.phone ? 'border-error' : 'border-border'
                    }`}
                  />
                  {fieldErrors.phone && (
                    <span className="text-error text-[10px] font-semibold font-sans mt-1 block">
                      {fieldErrors.phone}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-sans font-bold text-text/80 uppercase tracking-wider mb-1.5">
                    Pincode <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    maxLength={6}
                    onChange={(e) => {
                      setPincode(e.target.value.replace(/[^0-9]/g, ''));
                      if (fieldErrors.pincode) setFieldErrors((prev) => ({ ...prev, pincode: '' }));
                    }}
                    placeholder="6-digit pincode"
                    className={`w-full bg-surface-2 border rounded-xl px-4 py-2.5 text-text font-sans placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                      fieldErrors.pincode ? 'border-error' : 'border-border'
                    }`}
                  />
                  {fieldErrors.pincode && (
                    <span className="text-error text-[10px] font-semibold font-sans mt-1 block">
                      {fieldErrors.pincode}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-sans font-bold text-text/80 uppercase tracking-wider mb-1.5">
                  Delivery Address <span className="text-primary">*</span>
                </label>
                <textarea
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: '' }));
                  }}
                  placeholder="Enter your flat/street, landmark details for hot deliveries..."
                  rows={3}
                  className={`w-full bg-surface-2 border rounded-xl px-4 py-2.5 text-text font-sans placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none ${
                    fieldErrors.address ? 'border-error' : 'border-border'
                  }`}
                />
                {fieldErrors.address && (
                  <span className="text-error text-[10px] font-semibold font-sans mt-1 block">
                    {fieldErrors.address}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-yellow text-bg font-sans font-black uppercase tracking-wider py-3.5 rounded-xl hover:bg-yellow-dim hover:scale-[1.02] shadow-yellow active:scale-98 transition-all duration-300 mt-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving Profile...' : 'Save & Continue'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
