import express from "express";
import { staffRegisterService } from "../services/auth.service";


//staff regiater
const staffRegister = async (req: express.Request, res: express.Response )=>{
    try {
        const staff = await staffRegisterService(req.body);
        res.status(201).json({ message: "Staff registered successfully", staff });
    } catch (error) {
        res.status(400).json({ message: "Staff registration failed", error });
    }
};



export {
    staffRegister
}