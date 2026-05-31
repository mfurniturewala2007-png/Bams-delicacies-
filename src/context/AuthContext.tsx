import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  needsProfile: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signUp: (email: string, password: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  upsertProfile: (profileData: {
    name: string;
    phone: string;
    address: string;
    pincode: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [needsProfile, setNeedsProfile] = useState<boolean>(false);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => {
    // If the user has an incomplete profile, we do not let them close the modal.
    if (!needsProfile) {
      setIsAuthModalOpen(false);
    }
  };

  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile does not exist yet
          return null;
        }
        throw error;
      }
      return data as UserProfile;
    } catch (err) {
      console.warn('Error fetching profile from Supabase:', err);
      return null;
    }
  };

  const evaluateProfile = (prof: UserProfile | null) => {
    if (!prof) {
      setNeedsProfile(true);
      return;
    }
    const isIncomplete =
      !prof.name?.trim() ||
      !prof.phone?.trim() ||
      !prof.address?.trim() ||
      !prof.pincode?.trim();
    setNeedsProfile(isIncomplete);
  };

  // On Mount: restore session and set up onAuthStateChange listener
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          if (mounted) setUser(session.user);
          const prof = await fetchProfile(session.user.id);
          if (mounted) {
            setProfile(prof);
            evaluateProfile(prof);
          }
        }
      } catch (err) {
        console.error('Error recovering persistent auth session:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          const prof = await fetchProfile(session.user.id);
          if (mounted) {
            setProfile(prof);
            evaluateProfile(prof);
          }
        } else {
          setUser(null);
          setProfile(null);
          setNeedsProfile(false);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Force open the profile setup modal if user is logged in but profile is incomplete
  useEffect(() => {
    if (user && needsProfile) {
      setIsAuthModalOpen(true);
    }
  }, [user, needsProfile]);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
    setNeedsProfile(false);
    setIsAuthModalOpen(false);
  };

  const upsertProfile = async (profileData: {
    name: string;
    phone: string;
    address: string;
    pincode: string;
  }) => {
    if (!user) throw new Error('Must be authenticated to save a profile.');

    const newProfile: UserProfile = {
      id: user.id,
      email: user.email || '',
      ...profileData,
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(newProfile);

    if (error) throw error;

    setProfile(newProfile);
    setNeedsProfile(false);
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAuthModalOpen,
        needsProfile,
        openAuthModal,
        closeAuthModal,
        signUp,
        signIn,
        signOut,
        upsertProfile,
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
