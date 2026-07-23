import { NextResponse } from "next/server";
import { exportOfferingsAction } from "@/lib/actions/excel";

export async function GET() {
  try {
    const buf = await exportOfferingsAction();
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=offerings.xlsx",
      },
    });
  } catch {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }
}
