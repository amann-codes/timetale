import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../generated/prisma";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const userId = req.nextUrl.searchParams.get('userId')
        if (!userId) {
            throw new Error("User ID is required")
        }
        const flairs = await prisma.flair.findMany({
            where: {
                userId
            }
        })

        if (!flairs) {
            return NextResponse.json({
                status: 404,
                statusText: `No flairs found with ${userId}`
            })
        }

        return NextResponse.json(flairs);
    } catch (e) {
        return NextResponse.json({ message: `An error occurred while getting your flairs., ${e}` }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, name, description, color } = body;
        console.log("body in POST request at flairs", body)
        const res = await prisma.flair.create({
            data: {
                userId, name, description, color
            }
        })
        return NextResponse.json(res);
    } catch (e) {
        return NextResponse.json({ message: `An error while creating flairs: ${e}` }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, name, description, color } = body;
        const res = await prisma.flair.update({
            where: {
                id
            },
            data: {
                name, description, color
            }
        })
        return NextResponse.json(res);
    } catch (e) {
        return NextResponse.json({ message: `Error occured while udpatig flair: ${e}` }, { status: 500 })
    }
}