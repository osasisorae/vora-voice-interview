import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import * as db from '../db';
import { EVENT_ROLES } from '../../shared/roles';

export const roleApplicationsRouter = router({
  // Create a role-based application (not tied to specific gig)
  // Requires authentication - user must be logged in via Manus OAuth
  create: protectedProcedure
    .input(z.object({
      roleId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // User is guaranteed to exist from protectedProcedure
      const userId = ctx.user.id;
      
      // Verify role exists
      const role = EVENT_ROLES.find(r => r.id === input.roleId);
      if (!role) {
        throw new Error('Invalid role');
      }
      
      // Check if general gig exists for this role
      const gigTitle = `${role.title} - General Application`;
      const allGigs: any = await db.getPublishedGigs({ search: gigTitle });
      let generalGig = allGigs?.gigs?.find((g: any) => g.title === gigTitle) || allGigs?.find((g: any) => g.title === gigTitle);
      
      if (!generalGig) {
        // Create new general gig for this role
        const newGigId = await db.createGig({
          title: gigTitle,
          description: `Join our talent pool as a ${role.title}. Get matched with events that need your skills.`,
          gigType: input.roleId,
          city: 'Nigeria',
          state: 'All States',
          availability: 'Flexible - Available for events as needed',
          payAmount: 5000,
          payType: 'hourly',
          status: 'published',
          slotsTotal: 999,
        });
        
        generalGig = await db.getGigById(newGigId);
      }
      
      if (!generalGig) {
        throw new Error('Failed to create application');
      }
      
      // Create application with authenticated user
      const appData: any = {
        gigId: generalGig.id,
        userId,
        currentStep: 'voice_interview',
        status: 'pending',
      };
      const appId = await db.createApplication(appData);
      
      if (!appId) throw new Error('Failed to create application');
      
      return {
        applicationId: appId,
        roleId: input.roleId,
        roleName: role.title,
      };
    }),
});
