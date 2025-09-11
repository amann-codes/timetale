"use server";

import prisma from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

export async function createUser({ name, email, password }: { name: string, email: string, password: string }) {
    try {
        if (!email || !password) {
            throw new Error("Must provide all the details to create account");
        }
        const userExists = await prisma.user.findUnique({
            where: {
                email
            }
        })
        if (userExists) {
            throw new Error(`User already exists with this email address :${email}`)
        }
        const hashedpassword = await bcrypt.hashSync(password);
        const user = await prisma.user.create({
            data: {
                name, password: hashedpassword, email
            }
        })
        if (!user) {
            throw new Error('failed to create an account');
        }
    } catch (e) {
        throw new Error(`Failed to create the account:${e}`)
    }
}