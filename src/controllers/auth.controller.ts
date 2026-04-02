import express from "express";
import { loginService } from "../services/auth.service";


const login = (req: express.Request, res: express.Response )=>{
    const { email, password } = req.body;
    res.send(loginService({email, password}));
}

export {
    login,
}