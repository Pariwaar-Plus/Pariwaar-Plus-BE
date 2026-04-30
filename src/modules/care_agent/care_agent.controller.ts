import { Request, Response } from "express";
import * as service from "./care_agent.service";
import { AuthRequest } from "../../@types";



export const registerCareAgent = async (req: Request, res: Response) => {
  try {
    if (!req.body.email || !req.body.name) {
        return res.status(400).json({ message: "Invalid input" });
    }
    const user = await service.registerCareAgent(req.body);
    res.status(201).json(user);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};


/**
 * ADMIN: Get all care agents
 */
export const getAll = async (req: Request, res: Response) => {
  try {
    const agents = await service.getAllCareAgents();
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

/**
 * GET /api/care-agent/admin/view/:careAgentId
 * Logic: "Show me the details for a specific careAgent"
 */
export const adminGetCareAgent = async (req: AuthRequest, res: Response) => {
  try {
    const careAgentId = req.params.careAgentId as string;
    const careAgent = await service.getCareAgentByProfileId(careAgentId);
    
    res.status(200).json({ success: true, data: careAgent });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
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