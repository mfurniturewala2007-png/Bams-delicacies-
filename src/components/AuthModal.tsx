import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useScrollLock } from '../hooks/useScrollLock';

const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    isEditingProfile,
    closeAuthModal,
    signIn,
    signUp,
    updateProfile,
    profile,
  } = useAuth();

  const [tab, setTab] = useState<'signin' | 'signup'>('signup');

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Pre-fill fields when editing profile
  React.useEffect(() => {
    if (isEditingProfile && profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setPincode(profile.pincode || '');
    } else if (!isEditingProfile) {
      setName('');
      setPhone('');
      setAddress('');
      setPincode('');
    }
  }, [isEditingProfile, profile]);

  // Lock scroll when modal is open — must be before any early return (Rules of Hooks)
  useScrollLock(isAuthModalOpen);

  if (!isAuthModalOpen) return null;

  // Decide which view to show
  const activeStep = isEditingProfile ? 'profile' : tab;

  const handleTabToggle = (newTab: 'signin' | 'signup') => {
    setTab(newTab);
    setErrorMsg('');
    setFieldErrors({});
    setPhone('');
    setName('');
    setAddress('');
    setPincode('');
  };

  // SIGN IN — just phone number
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!phone.trim()) {
      errors.phone = 'Phone Number is required';
    } else if (!/^[0-9]{10}$/.test(phone.trim())) {
      errors.phone = 'Phone must be exactly 10 digits';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      setFieldErrors({});
      await signIn(phone.trim());
    } catch (err: any) {
      setErrorMsg(err.message || 'Phone number not found. Please sign up first.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SIGN UP — name + phone + pincode + address
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!name.trim()) errors.name = 'Full Name is required';
    if (!phone.trim()) {
      errors.phone = 'Phone Number is required';
    } else if (!/^[0-9]{10}$/.test(phone.trim())) {
      errors.phone = 'Phone must be exactly 10 digits';
    }
    if (!pincode.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!/^[0-9]{6}$/.test(pincode.trim())) {
      errors.pincode = 'Pincode must be exactly 6 digits';
    }
    if (!address.trim()) errors.address = 'Delivery Address is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      setFieldErrors({});
      await signUp(phone.trim(), name.trim(), address.trim(), pincode.trim());
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // EDIT PROFILE — update name, address, pincode
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!name.trim()) errors.name = 'Full Name is required';
    if (!pincode.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!/^[0-9]{6}$/.test(pincode.trim())) {
      errors.pincode = 'Pincode must be exactly 6 digits';
    }
    if (!address.trim()) errors.address = 'Delivery Address is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      setFieldErrors({});
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        pincode: pincode.trim(),
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 select-text">
      {/* Dimmed overlay — only closeable if logged in */}
      <div
        onClick={closeAuthModal}
        onTouchMove={(e) => e.preventDefault()}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm touch-none"
      />

      {/* Modal Card */}
      <div className="w-full max-w-[440px] bg-surface border border-border p-5 md:p-8 rounded-2xl shadow-2xl relative z-10 text-center animate-fade-slide-up flex flex-col max-h-[90vh] overflow-y-auto">

        {/* Close Button — always shown so users can close the modal */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-xl bg-surface-2 border border-border text-text hover:text-primary hover:border-primary active:scale-95 transition-all duration-200"
          aria-label="Close modal"
        >
          ✕
        </button>

        <img
          src="/logo.jpeg"
          alt="Bam's Delicacies"
          className="w-16 h-16 rounded-full mx-auto mb-4 object-cover border border-border shadow-md"
        />

        {/* ─── SIGN IN VIEW ─── */}
        {activeStep === 'signin' && (
          <>
            <h1 className="font-serif font-black text-2xl text-heading mb-1">Welcome Back</h1>
            <p className="font-sans text-xs text-muted mb-6">Enter your phone number to sign in instantly.</p>

            {errorMsg && (
              <div className="bg-error/10 border border-error/25 text-error text-xs font-semibold px-4 py-2.5 rounded-xl text-left mb-4 font-sans">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSignInSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-[11px] font-sans font-bold text-text/80 uppercase tracking-wider mb-1.5">
                  Phone Number <span className="text-primary">*</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  maxLength={10}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/[^0-9]/g, ''));
                    if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
                  }}
                  placeholder="Enter your 10-digit phone number"
                  className={`w-full bg-surface-2 border rounded-xl px-4 py-3 text-text font-sans placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                    fieldErrors.phone ? 'border-error' : 'border-border'
                  }`}
                />
                <div className="min-h-[20px]">
                  {fieldErrors.phone && (
                    <span className="text-error text-[10px] font-semibold font-sans mt-1 block">
                      {fieldErrors.phone}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-yellow text-bg font-sans font-black uppercase tracking-wider py-4 rounded-xl hover:bg-yellow-dim hover:scale-[1.02] shadow-yellow active:scale-98 transition-all duration-300 mt-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-xs text-muted font-sans">
                New here?{' '}
                <button
                  onClick={() => handleTabToggle('signup')}
                  className="text-primary font-bold hover:underline"
                >
                  Create Account
                </button>
              </span>
            </div>
          </>
        )}

        {/* ─── SIGN UP VIEW ─── */}
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
              {/* Full Name */}
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
                  className={`w-full bg-surface-2 border rounded-xl px-4 py-3 text-text font-sans placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                    fieldErrors.name ? 'border-error' : 'border-border'
                  }`}
                />
                {fieldErrors.name && (
                  <span className="text-error text-[10px] font-semibold font-sans mt-1 block">{fieldErrors.name}</span>
                )}
              </div>

              {/* Phone + Pincode row — stacks on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-sans font-bold text-text/80 uppercase tracking-wider mb-1.5">
                    Phone Number <span className="text-primary">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    maxLength={10}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/[^0-9]/g, ''));
                      if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    placeholder="10-digit number"
                    className={`w-full bg-surface-2 border rounded-xl px-4 py-3 text-text font-sans placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                      fieldErrors.phone ? 'border-error' : 'border-border'
                    }`}
                  />
                  <div className="min-h-[20px]">
                    {fieldErrors.phone && (
                      <span className="text-error text-[10px] font-semibold font-sans mt-1 block">{fieldErrors.phone}</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-sans font-bold text-text/80 uppercase tracking-wider mb-1.5">
                    Pincode <span className="text-primary">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={pincode}
                    maxLength={6}
                    onChange={(e) => {
                      setPincode(e.target.value.replace(/[^0-9]/g, ''));
                      if (fieldErrors.pincode) setFieldErrors((prev) => ({ ...prev, pincode: '' }));
                    }}
                    placeholder="6-digit code"
                    className={`w-full bg-surface-2 border rounded-xl px-4 py-3 text-text font-sans placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                      fieldErrors.pincode ? 'border-error' : 'border-border'
                    }`}
                  />
                  <div className="min-h-[20px]">
                    {fieldErrors.pincode && (
                      <span className="text-error text-[10px] font-semibold font-sans mt-1 block">{fieldErrors.pincode}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
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
                  placeholder="Flat no., street, landmark..."
                  rows={2}
                  className={`w-full bg-surface-2 border rounded-xl px-4 py-2.5 text-text font-sans placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none ${
                    fieldErrors.address ? 'border-error' : 'border-border'
                  }`}
                />
                {fieldErrors.address && (
                  <span className="text-error text-[10px] font-semibold font-sans mt-1 block">{fieldErrors.address}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-yellow text-bg font-sans font-black uppercase tracking-wider py-4 rounded-xl hover:bg-yellow-dim hover:scale-[1.02] shadow-yellow active:scale-98 transition-all duration-300 mt-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
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

        {/* ─── EDIT PROFILE VIEW ─── */}
        {activeStep === 'profile' && (
          <>
            <h1 className="font-serif font-black text-2xl text-heading mb-1">Edit Profile</h1>
            <p className="font-sans text-xs text-muted mb-6">Update your delivery details below.</p>

            {errorMsg && (
              <div className="bg-error/10 border border-error/25 text-error text-xs font-semibold px-4 py-2.5 rounded-xl text-left mb-4 font-sans">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-3.5 text-left">
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
                  placeholder="Your full name"
                  className={`w-full bg-surface-2 border rounded-xl px-4 py-3 text-text font-sans placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                    fieldErrors.name ? 'border-error' : 'border-border'
                  }`}
                />
                {fieldErrors.name && (
                  <span className="text-error text-[10px] font-semibold font-sans mt-1 block">{fieldErrors.name}</span>
                )}
              </div>

              {/* Phone (read-only when editing) */}
              <div>
                <label className="block text-[11px] font-sans font-bold text-text/80 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  disabled
                  className="w-full bg-surface-2/50 border border-border rounded-xl px-4 py-2.5 text-muted font-sans cursor-not-allowed opacity-60"
                />
                <span className="text-muted text-[10px] font-sans mt-1 block">Phone number cannot be changed.</span>
              </div>

              <div>
                <label className="block text-[11px] font-sans font-bold text-text/80 uppercase tracking-wider mb-1.5">
                  Pincode <span className="text-primary">*</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={pincode}
                  maxLength={6}
                  onChange={(e) => {
                    setPincode(e.target.value.replace(/[^0-9]/g, ''));
                    if (fieldErrors.pincode) setFieldErrors((prev) => ({ ...prev, pincode: '' }));
                  }}
                  placeholder="6-digit pincode"
                  className={`w-full bg-surface-2 border rounded-xl px-4 py-3 text-text font-sans placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                    fieldErrors.pincode ? 'border-error' : 'border-border'
                  }`}
                />
                {fieldErrors.pincode && (
                  <span className="text-error text-[10px] font-semibold font-sans mt-1 block">{fieldErrors.pincode}</span>
                )}
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
                  placeholder="Flat no., street, landmark..."
                  rows={3}
                  className={`w-full bg-surface-2 border rounded-xl px-4 py-2.5 text-text font-sans placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none ${
                    fieldErrors.address ? 'border-error' : 'border-border'
                  }`}
                />
                {fieldErrors.address && (
                  <span className="text-error text-[10px] font-semibold font-sans mt-1 block">{fieldErrors.address}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-yellow text-bg font-sans font-black uppercase tracking-wider py-4 rounded-xl hover:bg-yellow-dim hover:scale-[1.02] shadow-yellow active:scale-98 transition-all duration-300 mt-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
