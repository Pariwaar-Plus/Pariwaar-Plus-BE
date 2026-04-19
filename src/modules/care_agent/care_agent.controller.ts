import { Request, Response } from "express";
import * as service from "./care_agent.service";

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