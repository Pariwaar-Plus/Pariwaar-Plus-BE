import bcrypt from "bcrypt"
import prisma from "../config/prisma";

const hashingPassword = async (password: string) => {
    return await bcrypt.hash(password, 10);
}

const comparePassword = async (password: string, hashedPassword: string) => {
    return await bcrypt.compare(password, hashedPassword);
}

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
    data.password = hashedPassword;
    const createdStaff = await prisma.user.create({
        data:data,
        // data: {
        //     name: data.name,
        //     email: data.email,
        //     password: hashedPassword,
        //     country: data.country,
        //     city: data.city,
        //     contact: data.contact,
        //     qualification: data.qualification,
        //     experience: data.experience,
        // }
    })
    return createdStaff;
}



export {
    staffRegisterService,
}