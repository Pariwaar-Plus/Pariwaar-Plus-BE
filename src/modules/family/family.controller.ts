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

    const { clientData, parentsData } = req.body;

    if (!clientData || !parentsData || !Array.isArray(parentsData) || parentsData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid input",
      });
    }

    const result = await familyService.createFamilyAccount(req.user.id, req.body);

    return res.status(201).json({
      success: true,
      message: "Family account created successfully.",
      data: result,
    });

  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};