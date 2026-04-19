export interface JwtPayload {
    id: string;
    email: string;
    role: "ADMIN" | "CARE_AGENT" | "CLIENT";
}

export interface AuthRequest extends Request {
    user?: JwtPayload;
}