import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET!;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

