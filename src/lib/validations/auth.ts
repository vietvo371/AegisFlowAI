import { z } from 'zod';

export const signUpSchema = z.object({
  name: z.string()
    .min(2, 'Tên phải có ít nhất 2 ký tự')
    .max(50, 'Tên tối đa 50 ký tự'),

  email: z.string()
    .email('Email không hợp lệ')
    .toLowerCase(),

  phone: z.string()
    .regex(/^[0-9]{10,11}$/, 'Số điện thoại phải là 10-11 chữ số'),

  password: z.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ cái in hoa')
    .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 chữ số'),

  password_confirmation: z.string(),
}).refine(
  (data) => data.password === data.password_confirmation,
  {
    message: 'Mật khẩu không khớp',
    path: ['password_confirmation'],
  }
);

export const signInSchema = z.object({
  email: z.string()
    .email('Email không hợp lệ'),

  password: z.string()
    .min(1, 'Mật khẩu là bắt buộc'),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
