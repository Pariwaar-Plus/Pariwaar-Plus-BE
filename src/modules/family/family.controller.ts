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

// Update Client Profile
export const updateClient = async (req: AuthRequest, res: Response) => {
  try {
    const clientId = req.params.clientId as string;
    const result = await familyService.updateClient(clientId, req.body);
    
    res.status(200).json({ 
      success: true, 
      message: "Client updated successfully",
      data: result 
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteClient = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin authorization required.",
      });
    }

    const id = req.params.clientId as string;
    await familyService.softDeleteClient(id);

    return res.status(200).json({
      success: true,
      message: "Client and associated family data have been deactivated.",
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to delete client.",
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

// Get all families by admin
export const getFamilies = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Authorization Check
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Admin access required",
      });
    }

    const families = await familyService.getAllFamilies();

    return res.status(200).json({
      success: true,
      count: families.length,
      data: families,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to retrieve family list",
    });
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

// Get a specific care receiver
export const getCareReceiverById = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const id = req.params.careReceiverid as string;
    const data = await familyService.getCareReceiverById(id);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err: any) {
    return res.status(404).json({
      success: false,
      message: err.message || "Resource not found",
    });
  }
};

export const deleteParent = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Only admins can delete profiles",
      });
    }

    const id = req.params.careReceiverId as string;
    await familyService.softDeleteCareReceiver(id);

    return res.status(200).json({
      success: true,
      message: "Parent profile deactivated successfully.",
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to deactivate parent profile",
    });
  }
};

export const updateParent = async (req: AuthRequest, res: Response) => {
  try {
    // Admin check (or check if user owns this client)
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const id = req.params.careReceiverId as string;
    const updatedProfile = await familyService.updateCareReceiver(id, req.body);

    return res.status(200).json({
      success: true,
      message: "Parent profile updated successfully",
      data: updatedProfile,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to update profile",
    });
  }
};