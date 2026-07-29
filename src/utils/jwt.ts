import jwt from "jsonwebtoken";
import { JwtPayload } from "../@types";


export const generateAccessToken = (user: JwtPayload) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email,
            role: user.role
        },
        process.env.ACCESS_TOKEN_SECRET as string,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY as string }
    )
}

export const generateRefreshToken = (user: JwtPayload) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email ,
            role: user.role
        },
        process.env.REFRESH_TOKEN_SECRET as string,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    )
}

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string);
};