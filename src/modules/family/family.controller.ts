import { Response } from "express";
import * as familyService from "./family.service";
import { AuthRequest } from "../../@types";

export const createFamily = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No admin session found",
      });
    }

    const result = await familyService.registerClient(req.user.id, req.body);

    return res.status(201).json({
      success: true,
      message: "Family/Client account created successfully.",
      data: result,
    });

  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};

/**
 * GET /api/family/my-family
 * Logic: "Show me my own parents"
 */
export const getMyFamily = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const family = await familyService.getFamilyByClientId(userId);
    
    res.status(200).json({ success: true, data: family });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/family/admin/view/:clientId
 * Logic: "Show me the details for a specific customer"
 */
export const adminGetFamily = async (req: AuthRequest, res: Response) => {
  try {
    const clientId = req.params.clientId as string;
    const family = await familyService.getFamilyByProfileId(clientId);
    
    res.status(200).json({ success: true, data: family });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
};

/**
 * Add a Parent
 */
export const addParent = async (req: any, res: Response) => {
  try {
    const { clientId } = req.params;
    const parent = await familyService.addParentToFamily(clientId, req.body);
    
    res.status(201).json({ 
      success: true, 
      message: "Parent added to family successfully", 
      data: parent 
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};


/**
 * Assign care agent to care receiver
 */ 
export const assignAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { careAgentId, careReceiverId } = req.body;

    if (!careAgentId || !careReceiverId) {
      return res.status(400).json({ success: false, message: "careAgentId and careReceiverId are required" });
    }

    const assignment = await familyService.assignAgentToParent(careAgentId, careReceiverId);

    res.status(201).json({
      success: true,
      message: "Assignment successful",
      data: assignment
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};