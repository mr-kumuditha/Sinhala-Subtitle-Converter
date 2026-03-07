import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json(
                { message: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Create user (storing password as-is to match existing authorize logic in auth.ts)
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password // Note: In a real production app, you should hash this using bcrypt
            }
        });

        return NextResponse.json(
            { message: 'User created successfully', user: { id: newUser.id, email: newUser.email, name: newUser.name } },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { message: 'An error occurred during registration' },
            { status: 500 }
        );
    }
}
