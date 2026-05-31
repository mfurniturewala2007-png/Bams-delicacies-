import React, { createContext, useContext, useState } from 'react';
import { supabase } from '../utils/supabase';
import { UserProfile } from '../types';

interface AuthContextType {
  profile: UserProfile | null;
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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(true); // Open by default for guests
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);

  const openAuthModal = () => setIsAuthModalOpen(true);

  const openProfileEdit = () => {
    setIsEditingProfile(true);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    // Only allow closing if the user is logged in
    if (profile) {
      setIsAuthModalOpen(false);
      setIsEditingProfile(false);
    }
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

    setProfile(data as UserProfile);
    setIsAuthModalOpen(false);
  };

  // SIGN OUT — clear profile, reopen modal
  const signOut = () => {
    setProfile(null);
    setIsEditingProfile(false);
    setIsAuthModalOpen(true);
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
