import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../../generated/prisma';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const id = req.nextUrl.searchParams.get('id');
    if (!!id) {
        const res = await prisma.flair.findFirst({
            where: { id },
        });
        if (!res) {
            return NextResponse.json({ error: 'Flair not found' }, { status: 404 });
        }
        return NextResponse.json(res);
    }

}