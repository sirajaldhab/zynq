import { z } from 'zod';
export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});
export const ProjectSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    main_contractor: z.string().optional().default(''),
    consultant: z.string().optional().default(''),
    project_manager_id: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    status: z.string().optional().default('PLANNING'),
});
