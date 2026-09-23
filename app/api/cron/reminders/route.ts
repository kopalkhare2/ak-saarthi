import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import type { Task } from '@prisma/client';

// Helper to parse dates and calculate difference in days
function getDaysDifference(dateString: string): number {
  const targetDate = new Date(dateString);
  const today = new Date();
  
  // Set times to midnight for precise day calculation
  targetDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

interface NotificationTriggered {
  policyNumber: string;
  clientName: string;
  dueDate: string;
  daysRemaining: number;
  premium: number;
}

export async function GET() {
  try {
    const auth = await requireSession(['advisor']);
    if ('response' in auth) return auth.response;

    // 1. Fetch active policies
    const activePolicies = await prisma.policy.findMany({
      where: {
        status: 'active',
      },
      include: {
        client: true,
      },
    });

    const tasksCreated: Task[] = [];
    const notificationsTriggered: NotificationTriggered[] = [];

    // 2. Scan and find policies due in the next 30 days
    for (const policy of activePolicies) {
      const daysLeft = getDaysDifference(policy.dueDate);
      
      // If policy is due within the next 30 days
      if (daysLeft >= 0 && daysLeft <= 30) {
        const clientName = `${policy.client.firstName} ${policy.client.lastName}`;
        const taskTitle = `Renewal reminder: Send notice to ${clientName} for policy ${policy.policyNumber}`;

        // Check if task already exists
        const existingTask = await prisma.task.findFirst({
          where: {
            title: taskTitle,
            status: { in: ['todo', 'in_progress'] },
          },
        });

        if (!existingTask) {
          // Create a high-priority task for the advisor
          const newTask = await prisma.task.create({
            data: {
              clientId: policy.clientId,
              clientName: clientName,
              title: taskTitle,
              description: `Automated alert: ${policy.company} ${policy.type.toUpperCase()} policy due in ${daysLeft} days (Due Date: ${policy.dueDate}). Premium Amount: INR ${policy.premium}. Sum Assured: INR ${policy.sumAssured}. Nominee: ${policy.nominee}.`,
              priority: 'high',
              status: 'todo',
              dueDate: policy.dueDate,
            },
          });
          tasksCreated.push(newTask);
        }

        notificationsTriggered.push({
          policyNumber: policy.policyNumber,
          clientName: clientName,
          dueDate: policy.dueDate,
          daysRemaining: daysLeft,
          premium: policy.premium,
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        activePoliciesScanned: activePolicies.length,
        duePoliciesFound: notificationsTriggered.length,
        newTasksCreated: tasksCreated.length,
      },
      notifications: notificationsTriggered,
      newTasks: tasksCreated,
    });
  } catch (error) {
    console.error('Failed to run automated reminders engine:', error);
    return NextResponse.json(
      { error: 'Failed to run automation engine' },
      { status: 500 }
    );
  }
}
