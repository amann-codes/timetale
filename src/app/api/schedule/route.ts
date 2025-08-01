import generateSchedule, { ScheduleItem } from "@/lib/gemini/generateSchedule";
import { SchedulePOST } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../generated/prisma";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body: SchedulePOST = await req.json();
    const { userId, description } = body;
    const inputDate = new Date();
    if (isNaN(inputDate.getTime())) {
      throw new Error('Invalid date format');
    }
    const startOfDay = new Date(inputDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(inputDate.setHours(23, 59, 59, 999));

    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      }
    });

    if (existingSchedule) {
      const updatedSchedule = await generateSchedule(description, existingSchedule.schedule as ScheduleItem[]);
      const update = await prisma.schedule.update({
        where: {
          id: existingSchedule.id
        },
        data: {
          schedule: updatedSchedule
        }
      })
      return NextResponse.json(update)
    }

    const response = await generateSchedule(description);
    const createSchedule = await prisma.schedule.create({
      data: {
        userId,
        schedule: response,
      },
    });

    return NextResponse.json(createSchedule);
  } catch (e) {
    throw new Error(`error during generation process ${e}`);
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { status: 409 },
        { statusText: "user id and day is required" }
      );
    }
    const response = await prisma.schedule.findFirst({
      where: {
        userId,
      },
    });

    return Response.json(response);
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      { status: 500 },
      { statusText: `Error getting schedule: ${e}` }
    );
  }
}
