import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Function untuk menambahkan CORS headers ke response
const addCorsHeaders = (response: NextResponse) => {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return response;
};

export async function GET() {
  try {
    const data = await prisma.dth22.findMany({
      orderBy: { created_at: "desc" },
    });
    return addCorsHeaders(NextResponse.json(data));
  } catch (error) {
    return addCorsHeaders(
      NextResponse.json(
        { error: "Gagal mengambil data DTH22" },
        { status: 500 }
      )
    );
  }
}

export async function POST(request: Request) {
  try {
    const { unit_name, suhu, kelembapan } = await request.json();

    // Validasi input
    if (!unit_name || suhu === undefined || kelembapan === undefined) {
      return addCorsHeaders(
        NextResponse.json({ error: "Semua field harus diisi" }, { status: 400 })
      );
    }

    const newRecord = await prisma.dth22.create({
      data: {
        unit_name,
        suhu: parseFloat(suhu),
        kelembapan: parseFloat(kelembapan),
      },
    });

    return addCorsHeaders(NextResponse.json(newRecord, { status: 201 }));
  } catch (error) {
    console.error("Error creating DTH22 record:", error);
    return addCorsHeaders(
      NextResponse.json(
        { error: "Gagal menambahkan data DTH22" },
        { status: 500 }
      )
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updateData } = await request.json();

    if (!id) {
      return addCorsHeaders(
        NextResponse.json({ error: "ID harus disertakan" }, { status: 400 })
      );
    }

    // Konversi ke number jika ada suhu/kelembapan
    if (updateData.suhu !== undefined) {
      updateData.suhu = parseFloat(updateData.suhu);
    }
    if (updateData.kelembapan !== undefined) {
      updateData.kelembapan = parseFloat(updateData.kelembapan);
    }

    const updatedRecord = await prisma.dth22.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return addCorsHeaders(NextResponse.json(updatedRecord));
  } catch (error) {
    console.error("Error updating DTH22 record:", error);
    return addCorsHeaders(
      NextResponse.json(
        { error: "Gagal memperbarui data DTH22" },
        { status: 500 }
      )
    );
  }
}

// Handler untuk OPTIONS request (preflight)
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response);
}
