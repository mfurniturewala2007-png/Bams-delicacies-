import { z } from 'zod';

export const signInSchema = z.object({
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be exactly 10 digits'),
});

export const signUpSchema = z.object({
  name: z.string().min(2, 'Full Name is required'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be exactly 10 digits'),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Pincode must be exactly 6 digits'),
  address: z.string().min(10, 'Delivery Address is required'),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Full Name is required'),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Pincode must be exactly 6 digits'),
  address: z.string().min(10, 'Delivery Address is required'),
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2, 'Full Name is required'),
  customerPhone: z.string().regex(/^[0-9]{10}$/, 'Enter valid 10-digit number'),
  customerAddress: z.string().min(10, 'Delivery Address is required'),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Enter valid pincode'),
  selectedDate: z.date({ message: 'Select a delivery date' }),
  paymentMethod: z.enum(['UPI', 'COD'], { message: 'Choose a payment method' }),
});

export type SignInForm = z.infer<typeof signInSchema>;
export type SignUpForm = z.infer<typeof signUpSchema>;
export type ProfileUpdateForm = z.infer<typeof profileUpdateSchema>;
export type CheckoutForm = z.infer<typeof checkoutSchema>;