import { z } from 'zod';
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const ProjectSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    main_contractor: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    consultant: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    project_manager_id: z.ZodOptional<z.ZodString>;
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: string;
    name: string;
    main_contractor: string;
    consultant: string;
    id?: string | undefined;
    project_manager_id?: string | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
}, {
    name: string;
    status?: string | undefined;
    id?: string | undefined;
    main_contractor?: string | undefined;
    consultant?: string | undefined;
    project_manager_id?: string | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
}>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ProjectInput = z.infer<typeof ProjectSchema>;
