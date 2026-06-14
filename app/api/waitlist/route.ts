import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "data", "waitlist.json");

async function readList(): Promise<string[]> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeList(list: string[]): Promise<void> {
  await fs.writeFile(FILE, JSON.stringify(list, null, 2));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ success: false, message: "Invalid email" }, { status: 400 });
  }

  const list = await readList();

  if (list.includes(email)) {
    return NextResponse.json({ success: false, message: "Already on waitlist" }, { status: 409 });
  }

  list.push(email);
  await writeList(list);

  return NextResponse.json({ success: true, position: list.length });
}
