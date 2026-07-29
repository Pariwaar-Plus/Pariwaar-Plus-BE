import { Request, Response, NextFunction } from "express";
import * as service from "./care_receiver.service";
import { AuthRequest } from "../../@types";
import {
  CreateCareReceiverSchema,
  UpdateCareReceiverSchema,
} from "./types/care_receiver.dto";
import { z, ZodError } from "zod";
import { getCareAgentByUserId } from "../care_agent/care_agent.service";
import { getClientByUserId } from "../client/client.service";
import { Role } from "@prisma/client";

const uuidSchema = z.uuid("Invalid care receiver ID format");

/**
 * ADMIN: Create a new care receiver
 */
export const createCareReceiver = async (req: Request, res: Response) => {
  try {
    /**
     * 1. Validate request body (strict DTO validation)
     */
    const validatedData = CreateCareReceiverSchema.parse(req.body);

    /**
     * 2. Call service layer
     */
    const result = await service.createCareReceiver(validatedData);

    /**
     * 3. Success response
     */
    return res.status(201).json({
      success: true,
      message: "Care Receiver created successfully",
      data: result,
    });
  } catch (error: any) {
    /**
     * 1. Zod validation errors
     */
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      });
    }

    /**
     * 2. Not found errors
     */
    if (
      typeof error.message === "string" &&
      error.message.toLowerCase().includes("not found")
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    /**
     * 3. Log unexpected errors for debugging
     */
    console.error("createCareReceiver ERROR:", error);

    /**
     * 4. Generic fallback
     */
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * ADMIN: Get all care receivers
 */
export const getAll = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    let filter: any = {};
    if (user) {
      if (user.role === Role.CARE_AGENT) {
        const agent = await getCareAgentByUserId(user.id)
        if (agent) {
          filter.assignments.some.careAgentId = agent.id
        }
      }
      else if (user.role === Role.CLIENT) {
        const client = await getClientByUserId(user.id)
        if (client) {
          filter.clientId = client.id
        }
      }

    }
    const careReceivers = await service.getActiveCareReceivers(filter);
    res.json(careReceivers);
  } catch (err: any) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * ADMIN: Get a single care receiver by ID (includes assigned care agent info)
 */
export const getCareReceiver = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = uuidSchema.safeParse(req.params.careReceiverId);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid care receiver ID format",
        errors: parsed.error.flatten().formErrors,
      });
      return;
    }

    const careReceiver = await service.getCareReceiverById(parsed.data);
    res.status(200).json({
      success: true,
      data: careReceiver,
    });
  } catch (err) {
    next(err); // delegate to the global error handler
  }
};

/**
 * ADMIN: Update care receiver details
 */
export const updateCareReceiver = async (req: Request, res: Response) => {
  try {
    /**
     * 1. Validate route param
     */
    const careReceiverId = req.params.careReceiverId as string;

    if (!careReceiverId) {
      return res.status(400).json({
        success: false,
        message: "Care Receiver ID is required",
      });
    }

    /**
     * 2. Validate request body
     */
    const validatedData = UpdateCareReceiverSchema.parse(req.body);

    /**
     * 3. Call service layer
     */
    const updated = await service.updateCareReceiver(
      careReceiverId,
      validatedData
    );

    /**
     * 4. Success response
     */
    return res.status(200).json({
      success: true,
      message: "Care Receiver updated successfully",
      data: updated,
    });
  } catch (error: any) {
    /**
     * 1. Zod validation errors
     */
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      });
    }

    /**
     * 2. Not found errors
     */
    if (
      typeof error.message === "string" &&
      error.message.toLowerCase().includes("not found")
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    /**
     * 3. Generic fallback
     */
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * ADMIN: Soft delete a care receiver
 */
export const deleteCareReceiver = async (req: AuthRequest, res: Response) => {
  const careReceiverId = req.params.careReceiverId as string;
  try {
    if (req.user?.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: Admin access required" });
    }

    await service.deleteCareReceiver(careReceiverId);

    return res.status(200).json({
      success: true,
      message: "Care Receiver has been deactivated.",
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to deactivate Care Receiver",
    });
  }
};
