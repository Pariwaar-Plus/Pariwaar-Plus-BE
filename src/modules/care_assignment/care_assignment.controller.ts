import { Request, Response } from "express";
import { ZodError } from "zod";
import * as service from "./care_assignment.service";
import {CreateCareAssignmentSchema} from "./types/care_assignment.dto"
import { AuthRequest } from "../../@types";



export const createCareAssignment = async (req: Request, res: Response) => {
  try {
    /**
     * 1. Validate request body (strict DTO validation)
     */
    const validatedData = CreateCareAssignmentSchema.parse(req.body);

    /**
     * 2. Call service layer
     */
    const result = await service.createCareAssignment(validatedData);

    return res.status(201).json({
      success: true,
      message: "Care Assignment created successfully",
      data: result,
    });
  }catch (error: any) {
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

  
     
    console.error("CareAgent Assignment:", error);

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
 * ADMIN: Get all care agents
 */
export const getAssignmentByCareReceiver = async (req: Request, res: Response) => {
  try {
    const assignments = await service.getAssignmentByCareReceiver(req.params.careReceiverId as string);
    res.json(assignments);
  } catch (err: any) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteCareAssignmment = async (req: AuthRequest, res: Response) => {
  
  const careAssignmentId = req.params.id as string;
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
    }

    await service.deleteCareAssignmment(careAssignmentId);

    return res.status(200).json({
      success: true,
      message: "Care Assignment have been deactivated.",
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to delete assignment",
    });
  }
};
