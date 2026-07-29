import { Response, NextFunction } from "express";
import { Role } from "../generated/prisma";

export const authorizeRoles = (...roles: Role[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    // 1. Safety check: Ensure the user object exists
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }

    // 2. Check if the user's role is in the allowed list
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: This action requires one of the following roles: ${roles.join(", ")}` 
      });
    }

    next();
  };
};