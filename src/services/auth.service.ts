import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import { Request, Response } from "express"

const hashingPassword = async (password: string) => {
    return await bcrypt.hash(password, 10);
}

const comparePassword = async (password: string, hashedPassword: string) => {
    return await bcrypt.compare(password, hashedPassword);
}

const prisma = new PrismaClient();

const staffRegisterService = async (data: any )=>{
    const existingStaff = await prisma.user.findFirst({
        where: {
            email: data.email
        }
    })

    if (existingStaff){
        throw new Error("Staff already exists");
    }

    const hashedPassword = await hashingPassword(data.password);

    const createdStaff = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            country: data.country,
            city: data.city,
            contact: data.contact,
            qualification: data.qualification,
            experience: data.experience,

        }
    })

    return createdStaff;

}



export {
    staffRegisterService,
}