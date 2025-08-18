'use server'
import generateSchedule, { ScheduleItem } from "@/lib/gemini/generateSchedule";
import { CreateSchedule } from "@/lib/types";
import { NextResponse } from "next/server";
import { PrismaClient } from "../../../../generated/prisma";
const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body: CreateSchedule = await req.json();
    console.log("body received", body);
    const { userId, description, flairIds } = body;

    const inputDate = new Date();
    if (isNaN(inputDate.getTime())) {
      return NextResponse.json({ message: 'Internal server error: Invalid date' }, { status: 500 });
    }
    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        userId,
      },
    });

    console.log("Existing schedule check:", existingSchedule);

    if (existingSchedule) {
      console.log("Updating existing schedule...");
      const updatedSchedule = await generateSchedule(description, flairIds, existingSchedule.schedule as ScheduleItem[])

      if (!updatedSchedule || 'error' in updatedSchedule) {
        console.error("Failed to generate updated schedule:", updatedSchedule);
        return NextResponse.json({ message: "Error generating updated schedule from AI." }, { status: 500 });
      }

      const updateResult = await prisma.schedule.update({
        where: {
          id: existingSchedule.id
        },
        data: {
          schedule: updatedSchedule
        }
      });
      console.log("updated schedule at line 61", updateResult)
      return NextResponse.json(updateResult);

    } else {
      console.log("Creating new schedule...");
      const newSchedule = await generateSchedule(description, flairIds);

      if (!newSchedule || 'error' in newSchedule) {
        console.error("Failed to generate new schedule:", newSchedule);
        return NextResponse.json({ message: "Error generating new schedule from AI." }, { status: 500 });
      }

      const createResult = await prisma.schedule.create({
        data: {
          userId,
          schedule: newSchedule,
        },
      });

      return NextResponse.json(createResult);
    }

  } catch (e) {
    console.error("Error during schedule processing:", e);
    return NextResponse.json({ message: `An error occurred during the generation process. ${e}` }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    const schedule = await prisma.schedule.findFirst({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      }
    });
    if (!schedule) {
      return NextResponse.json({ message: "No schedule found for today." }, { status: 404 });
    }

    return NextResponse.json(schedule);
  } catch (e) {
    console.error("Error getting schedule:", e);
    return NextResponse.json({ message: `Error getting schedule` }, { status: 500 });
  }
}
