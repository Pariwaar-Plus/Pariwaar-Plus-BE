import { Request } from "express";
export interface JwtPayload {
    id: string;
    email: string;
    role: "ADMIN" | "CARE_AGENT" | "CLIENT";
}
interface ParentData{
    name: string;
    age: number;
    gender: string;
    city: string;
    ward?: string;
    tole?: string;
    contactNumber: string;
    medicalHistory?: string;
    existingConditions: string[];
}

export interface ClientDTO {
    name: string;
    email: string;
    password?: string; 

    country: string;
    city: string;
    phone: string;     
    address: string;
}
export interface CreateFamilyAccountDTO {
    clientData: {
        name: string;
        email: string;
        password?: string;
        country?: string;
        city?: string;
        phone?: string;
        address?: string;
    };
    parentsData: ParentData[];
}
export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
        email: string;
    };
}

export interface CreateVisitLogDTO {
    careReceiverId: string;

    // Vital Signs
    systolicBP: number;
    diastolicBP: number;
    bloodSugar?: number;
    oxygenLevel?: number;
    weight?: number;

    // Qualitative Data
    generalNotes?: string;
    medicationAdherence: boolean;
    medicationNotes?: string;
}