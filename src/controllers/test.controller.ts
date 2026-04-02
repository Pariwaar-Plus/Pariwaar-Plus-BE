import express from "express";
import prisma from "../config/prisma";

const getAllTest = (req: express.Request, res: express.Response) => {
    return prisma.user.findMany();
}

const getTestDetails = async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const users = await prisma.user.findFirst({
        where:{
            id: +id
        }
    });
    res.send(users);
}

const postTest = async (req: express.Request, res: express.Response) => {
    const { name, email, password } = req.body;
    const role = await prisma.role.findFirst({
        where: {
            name: "PARENT"
        }
    });
    const createdUser = await prisma.user.create({
        data: {
            name: name,
            email: email,
            password: password,
            roleid: role?.id || 0,
            country:"Nepal",
        }
    });
    res.send(`Successfully created user: ${createdUser.name} with email: ${createdUser.email}`);
}   

const updateTest = async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { name } = req.body;
    const updatedUser = await prisma.user.update({
        where: {
            id: +id
        },
        data: {
            name: name
        }
    });

    res.send(`Test with ID ${updatedUser.id} has been updated to ${updatedUser.name}.`);
}

const deleteTest = async(req: express.Request, res: express.Response) => {
    const { id } = req.params;
    await prisma.user.delete({
        where: {
            id: +id
        }
    });
    res.send(`Test with ID ${id} has been deleted.`);
}

export {
    getAllTest,
    getTestDetails,
    postTest,
    updateTest,
    deleteTest
}