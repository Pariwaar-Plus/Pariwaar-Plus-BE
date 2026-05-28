import { Request, Response, NextFunction } from "express";
import * as service from "./care_agent.service";
import { AuthRequest } from "../../@types";
import { CreateCareAgentSchema, UpdateCareAgentSchema } from "./types/care_agent.dto";
import { z, ZodError } from "zod";



export const registerCareAgent = async (req: Request, res: Response) => {
  try {
    /**
     * 1. Validate request body (strict DTO validation)
     */
    const validatedData = CreateCareAgentSchema.parse(req.body);

    /**
     * 2. Call service layer
     */
    const result = await service.registerCareAgent(validatedData);

    /**
     * 3. Extract sensitive fields
     */
    const { tempPassword, ...safeData } = result;

    /**
     * 4. Build response (do NOT expose password by default)
     */
    return res.status(201).json({
      success: true,
      message: "Care Agent registered successfully",
      data: safeData,
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

    /**
     * 2. Known business logic errors
     */
    if (
      typeof error.message === "string" &&
      (error.message.includes("already") ||
        error.message.includes("exists"))
    ) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    /**
     * 3. Log unexpected errors for debugging
     */
    console.error("registerCareAgent ERROR:", error);

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
export const getAll = async (req: Request, res: Response) => {
  try {
    const agents = await service.getActiveCareAgents();
    res.json(agents);
  } catch (err: any) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * CARE_AGENT: Get own profile
 */
export const getMyProfile = async (req: any, res: Response) => {
  try {
    const agent = await service.getCareAgentByUserId(req.user.id);
    
    if (!agent) {
      return res.status(404).json({ message: "Care agent profile not found" });
    }

    res.json(agent);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * CARE_AGENT: Update profile
 */
export const updateMyProfile = async (req: any, res: Response) => {
  try {
    const updated = await service.updateCareAgent(
      req.user.id,
      req.body
    );
    
    res.json({
      message: "Profile updated successfully",
      data: updated
    });
  } catch (err: any) {
    // If Prisma fails due to validation or missing record
    res.status(400).json({ message: err.message });
  }
};

// Update care agent by admin
export const updateAgent = async (req: Request, res: Response) => {
  try {
    /**
     * 1. Validate route param
     */
    const careAgentId = req.params.careAgentId as string;

    if (!careAgentId) {
      return res.status(400).json({
        success: false,
        message: "Care Agent ID is required",
      });
    }

    /**
     * 2. Validate request body
     */
    const validatedData = UpdateCareAgentSchema.parse(req.body);

    /**
     * 3. Call service layer
     */
    const updatedCareAgent = await service.updateCareAgentByAdmin(
        careAgentId,
        validatedData
      );

      /**
     * 4. Success response
     */
    return res.status(200).json({
      success: true,
      message: "Care Agent updated successfully",
      data: updatedCareAgent,
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
};
/**
 * GET /:careAgentId
 * Logic: "Show me the details for a specific careAgent"
 */
const uuidSchema = z.uuid("Invalid care agent ID format");

export const adminGetCareAgent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = uuidSchema.safeParse(req.params.careAgentId);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid care agent ID format",
        errors: parsed.error.flatten().formErrors,
      });
      return;
    }

    const careAgent = await service.getCareAgentByProfileId(parsed.data);

    res.status(200).json({
      success: true,
      data: careAgent,
    });

  } catch (err) {
    next(err); // delegate to your global error handler
  }
};


// Get assigned care receivers for care agent
export const getMyAssignments = async (req: Request, res: Response) => {
    try {
    const authReq = req as unknown as AuthRequest;

    // We use the ID from the JWT token (req.user.id)
    const userId = authReq.user!.id;

    const assignments = await service.getMyAssignedCareReceivers(userId);

    res.status(200).json({
        success: true,
        count: assignments.length,
        data: assignments
    });
    } catch (err: any) {
    res.status(400).json({
        success: false,
        message: err.message
    });
    }
};

export const deleteCareAgent = async (req: AuthRequest, res: Response) => {
  
  const careAgentId = req.params.id as string;
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
    }

    await service.deleteCareAgent(careAgentId);

    return res.status(200).json({
      success: true,
      message: "Care Agent and associated user account have been deactivated.",
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to deactivate Care Agent",
    });
  }
};



