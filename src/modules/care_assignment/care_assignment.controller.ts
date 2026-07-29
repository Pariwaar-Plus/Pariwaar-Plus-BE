import { Request, Response } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../../@types";
import { getCareAgentByUserId } from "../care_agent/care_agent.service";
import * as service from "./care_assignment.service";
import { CreateCareAssignmentSchema, UpdateCareAssignmentSchema } from "./types/care_assignment.dto";



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



export const getAssignmentByCareReceiver = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const careReceiverId =req.query.careReceiverId as string
    const assignments = await service.getAssignmentByCareReceiver(user,careReceiverId);
    res.json(assignments);
  } catch (err: any) {
    console.log(err)
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateCareAssignment = async (req: AuthRequest, res: Response) => {
  try {
    /**
     * 1. Validate route param
     */
    const assignmentId = req.params.assignmentId as string;

    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        message: "Assignment ID is required",
      });
    }

    /**
     * 2. Validate request body
     */
    const validatedData = UpdateCareAssignmentSchema.parse(req.body);

    /**
     * 3. Call service layer
     */
    const updateCareAssignment = await service.updateCareAssignment(
      assignmentId,
      validatedData
    );

    /**
   * 4. Success response
   */
    return res.status(200).json({
      success: true,
      message: "Care Assignment updated successfully",
      data: updateCareAssignment,
    });

  } catch (error: any) {

    console.log(error)
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
      typeof error.message === "string" && error.message.toLowerCase().includes("not found")
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
}

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
