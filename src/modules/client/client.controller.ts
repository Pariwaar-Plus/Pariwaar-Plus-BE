import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthRequest } from "../../@types";
import {
  CreateClientSchema,
  UpdateClientSchema,
} from "./schemas/client.schema";
import * as service from "./client.service";

const uuidSchema = z.string().uuid("Invalid ID format");

/* ─────────────────────────────────────────────
  POST /clients
───────────────────────────────────────────── */

export const registerClient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = CreateClientSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors:  parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await service.registerClient(req.user!.id, parsed.data);

    res.status(201).json({
      success: true,
      message: "Client registered successfully",
      data:    result,
    });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────
  GET /clients
───────────────────────────────────────────── */

export const getAllClients = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clients = await service.getAllClients();

    res.status(200).json({
      success: true,
      count:   clients.length,
      data:    clients,
    });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────
  GET /clients/:clientId
───────────────────────────────────────────── */

export const getClientById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = uuidSchema.safeParse(req.params.clientId);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid client ID format",
      });
      return;
    }

    const client = await service.getClientById(parsed.data);

    res.status(200).json({
      success: true,
      data:    client,
    });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────
  GET /clients/me  (client's own profile)
───────────────────────────────────────────── */

export const getMyProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const client = await service.getClientByUserId(req.user!.id);

    res.status(200).json({
      success: true,
      data:    client,
    });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────
  PATCH /clients/:clientId
───────────────────────────────────────────── */

export const updateClient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const idParsed = uuidSchema.safeParse(req.params.clientId);
    if (!idParsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid client ID format",
      });
      return;
    }

    const bodyParsed = UpdateClientSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors:  bodyParsed.error.flatten().fieldErrors,
      });
      return;
    }

    const updated = await service.updateClient(idParsed.data, bodyParsed.data);

    res.status(200).json({
      success: true,
      message: "Client updated successfully",
      data:    updated,
    });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────
  DELETE /clients/:clientId
───────────────────────────────────────────── */

export const deleteClient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = uuidSchema.safeParse(req.params.clientId);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid client ID format",
      });
      return;
    }

    await service.deleteClient(parsed.data);

    res.status(200).json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};