import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const data = await prisma.dth22.findMany({
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal mengambil data DTH22' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { unit_name, suhu, kelembapan } = await request.json();

    // Validasi input
    if (!unit_name || suhu === undefined || kelembapan === undefined) {
      return NextResponse.json(
        { error: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    const newRecord = await prisma.dth22.create({
      data: {
        unit_name,
        suhu: parseFloat(suhu),
        kelembapan: parseFloat(kelembapan),
      },
    });

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    console.error('Error creating DTH22 record:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan data DTH22' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updateData } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID harus disertakan' },
        { status: 400 }
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

    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error('Error updating DTH22 record:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui data DTH22' },
      { status: 500 }
    );
  }
}
