import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { UserProfile } from '../types';

interface AuthContextType {
  profile: UserProfile | null;
  isLoadingProfile: boolean;
  isAuthModalOpen: boolean;
  isEditingProfile: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openProfileEdit: () => void;
  signUp: (phone: string, name: string, address: string, pincode: string) => Promise<void>;
  signIn: (phone: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (data: { name: string; phone: string; address: string; pincode: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false); // Start with modal closed
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);

  // Restore user session from localStorage on mount
  useEffect(() => {
    const savedPhone = localStorage.getItem('bams_user_phone');
    if (!savedPhone) {
      // No saved session — immediately mark loading as done
      setIsLoadingProfile(false);
      return;
    }
    const restoreSession = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('phone', savedPhone)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setProfile(data as UserProfile);
        } else {
          // Clean up stale phone number if not found in db
          localStorage.removeItem('bams_user_phone');
        }
      } catch (err) {
        console.warn('Failed to restore user session:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    restoreSession();
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);

  const openProfileEdit = () => {
    setIsEditingProfile(true);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setIsEditingProfile(false);
  };

  // SIGN UP — insert new profile row, phone is the unique key
  const signUp = async (phone: string, name: string, address: string, pincode: string) => {
    // Check if phone already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('phone')
      .eq('phone', phone)
      .maybeSingle();

    if (existing) {
      throw new Error('This phone number is already registered. Please sign in instead!');
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert({ phone, name, address, pincode })
      .select()
      .single();

    if (error) throw error;

    // Persist login session locally across reloads
    localStorage.setItem('bams_user_phone', phone);
    setProfile(data as UserProfile);
    setIsAuthModalOpen(false);
  };

  // SIGN IN — look up profile by phone number
  const signIn = async (phone: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error('Phone number not found. Please sign up first!');
    }

    // Persist login session locally across reloads
    localStorage.setItem('bams_user_phone', phone);
    setProfile(data as UserProfile);
    setIsAuthModalOpen(false);
  };

  // SIGN OUT — clear profile, clear local session
  const signOut = () => {
    localStorage.removeItem('bams_user_phone');
    setProfile(null);
    setIsEditingProfile(false);
    setIsAuthModalOpen(false);
  };

  // UPDATE PROFILE — edit existing row by phone
  const updateProfile = async (data: { name: string; phone: string; address: string; pincode: string }) => {
    if (!profile) throw new Error('Not logged in.');

    const { error } = await supabase
      .from('profiles')
      .update({ name: data.name, address: data.address, pincode: data.pincode })
      .eq('phone', profile.phone);

    if (error) throw error;

    setProfile({ ...profile, ...data });
    setIsEditingProfile(false);
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        profile,
        isLoadingProfile,
        isAuthModalOpen,
        isEditingProfile,
        openAuthModal,
        closeAuthModal,
        openProfileEdit,
        signUp,
        signIn,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
