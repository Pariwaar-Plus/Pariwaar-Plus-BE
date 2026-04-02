import express from "express";
import { loginService } from "../services/auth.service";

//staff regiater
const staffRegister = (req: express.Request, res: express.Response )=>{
    const { name, email } = req.body;
    //randomly generate password
    // hashing password using bcrypt
    // save information to database
    // send email to staff with email, password and login link
    res.send("Successfully registered!");
};

const login = (req: express.Request, res: express.Response )=>{
    const { email, password } = req.body;
    // get user by id 
    //get user by email 
    // compare password using bcrypt
    // jwt token generate => {accessToken (1hr), refreshToken(7days)} => refresh the access token using refreshToken
    res.send(loginService({email, password}));
}

export {
    login,
}