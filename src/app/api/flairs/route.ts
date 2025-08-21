import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../generated/prisma";
import { z } from 'zod';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const userId = searchParams.get('userId');
        const flairId = searchParams.get('flairId');
        if (userId) {
            const userExists = await prisma.user.findUnique({
                where: {
                    id: userId
                }
            })
            if (!userExists) {
                return NextResponse.json({
                    status: 404,
                    statusText: 'User not found with this ID'
                })
            }
            const flairs = await prisma.flair.findMany({
                where: { userId },
            });

            if (!flairs) {
                return NextResponse.json([]);
            }
            return NextResponse.json(flairs);
        }
        else if (flairId) {
            const flair = await prisma.flair.findFirst({
                where: { id: flairId },
            });

            if (!flair) {
                return NextResponse.json({
                    status: 404,
                    statusText: 'Flair not found with this ID'
                });
            }

            return NextResponse.json(flair);
        }
        else {
            return NextResponse.json(
                { message: 'Either userId or flairId query parameter is required' },
                { status: 400 }
            );
        }
    } catch (e) {
        console.error(e);
        return NextResponse.json(
            { message: `An error occurred: ${e instanceof Error ? e.message : 'Unknown error'}` },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, name, description, color } = body;
        const userExists = await prisma.user.findUnique({
            where: {
                id: userId
            }
        })
        if (!userExists) {
            return NextResponse.json({
                status: 404,
                statusText: 'User not found with this ID'
            })
        }
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
        const flairExists = await prisma.user.findUnique({
            where: {
                id
            }
        })
        if (!flairExists) {
            return NextResponse.json({
                status: 404,
                statusText: 'User not found with this ID'
            })
        }
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