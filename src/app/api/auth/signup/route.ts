"use server";

import { NextResponse } from "next/server";
import { PrismaClient } from "../../../../../generated/prisma";
import { SignUp } from "@/lib/types";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(body: SignUp) {
  if (!body || !body.email || !body.password || !body.name) {
    return NextResponse.json({
      status: 400,
      statusText:
        "Missing required fields: email, password, and name are all required",
    });
  }
  const { name, email, password } = body;
  const existing = await prisma.user.findFirst({
    where: {
      email: body.email,
    },
  });
  if (existing) {
    return NextResponse.json({
      status: 409,
      statusText: "user already exists",
    });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
    select: {
      email: true,
      name: true,
    },
  });
  return user;
}
