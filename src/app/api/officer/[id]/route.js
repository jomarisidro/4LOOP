import { NextResponse } from 'next/server';
import connectMongoDB from '@/lib/ConnectMongodb';
import Business from '@/models/Business';
import mongoose from 'mongoose';

export async function PUT(req, { params }) {
  await connectMongoDB();
  const { id } = params;
  const body = await req.json();

  const updateFields = {
    bidNumber: body.newBidNumber,
    businessName: body.newBusinessName,
    businessNickname: body.newBusinessNickname,
    businessType: body.newBusinessType,
    businessAddress: body.newBusinessAddress,
    landmark: body.newLandmark,
    contactPerson: body.newContactPerson,
    contactNumber: body.newContactNumber,
    status: body.newStatus,
    updatedAt: new Date(),
  };

  try {
    let business;

    if (mongoose.Types.ObjectId.isValid(id)) {
      business = await Business.findByIdAndUpdate(id, updateFields, { new: true });
    } else {
      business = await Business.findOneAndUpdate({ bidNumber: id }, updateFields, { new: true });
    }

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json(business, { status: 200 });
  } catch (err) {
    console.error('❌ PUT error:', err);
    return NextResponse.json({ error: 'Failed to update business' }, { status: 500 });
  }
}

export async function GET(req, { params }) {
await connectMongoDB();

  const { id } = params;

  try {
    let business;

    if (mongoose.Types.ObjectId.isValid(id)) {
      business = await Business.findById(id);
    } else {
      business = await Business.findOne({ bidNumber: id });
    }

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json(business, { status: 200 });
  } catch (err) {
    console.error('❌ GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch business' }, { status: 500 });
  }
}
