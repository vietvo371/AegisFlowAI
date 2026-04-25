import { z } from 'zod';

export const rescueRequestSchema = z.object({
  caller_name: z.string()
    .min(2, 'Tên phải có ít nhất 2 ký tự')
    .max(50, 'Tên tối đa 50 ký tự'),

  caller_phone: z.string()
    .regex(/^[0-9]{10,11}$/, 'Số điện thoại phải là 10-11 chữ số'),

  urgency: z.enum(['low', 'medium', 'high', 'critical'], {
    errorMap: () => ({ message: 'Vui lòng chọn mức độ khẩn cấp' })
  }),

  category: z.enum(['rescue', 'shelter', 'medical', 'food'], {
    errorMap: () => ({ message: 'Vui lòng chọn danh mục' })
  }),

  people_count: z.string()
    .refine((v) => /^[1-9]\d*$/.test(v), 'Số người phải ≥ 1')
    .transform((v) => parseInt(v, 10)),

  water_level_m: z.string()
    .optional()
    .refine(
      (v) => !v || /^[0-9]+(\.[0-9]+)?$/.test(v),
      'Mực nước phải là số hợp lệ'
    ),

  description: z.string()
    .optional()
    .refine((v) => !v || v.length <= 500, 'Mô tả tối đa 500 ký tự'),
});

export type RescueRequestInput = z.infer<typeof rescueRequestSchema>;
