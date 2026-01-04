import { 
  userPrivacySettings,
  users,
  type UserPrivacySettings,
  type User
} from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

export interface PrivacySettingsUpdate {
  allowTagging?: boolean;
  allowMentions?: boolean;
  showActivityStatus?: boolean;
  allowMessageRequests?: boolean;
  allowStoryReplies?: boolean;
  whoCanSeeFollowers?: 'everyone' | 'followers' | 'no_one';
  whoCanSeeFollowing?: 'everyone' | 'followers' | 'no_one';
}

export class PrivacyService {
  
  // Get user privacy settings, create defaults if not exists
  async getPrivacySettings(userId: number): Promise<UserPrivacySettings> {
    const settings = await db.select()
      .from(userPrivacySettings)
      .where(eq(userPrivacySettings.userId, userId))
      .limit(1);

    if (settings.length === 0) {
      return await this.createDefaultPrivacySettings(userId);
    }

    return settings[0];
  }

  // Create default privacy settings for a user
  async createDefaultPrivacySettings(userId: number): Promise<UserPrivacySettings> {
    const defaultSettings = {
      userId,
      allowTagging: true,
      allowMentions: true,
      showActivityStatus: true,
      allowMessageRequests: true,
      allowStoryReplies: true,
      whoCanSeeFollowers: 'everyone' as const,
      whoCanSeeFollowing: 'everyone' as const,
      updatedAt: new Date()
    };

    const [result] = await db.insert(userPrivacySettings)
      .values(defaultSettings)
      .returning();
    
    return result;
  }

  // Update privacy settings
  async updatePrivacySettings(userId: number, updates: PrivacySettingsUpdate): Promise<UserPrivacySettings> {
    // Ensure settings exist
    await this.getPrivacySettings(userId);

    const [result] = await db.update(userPrivacySettings)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(userPrivacySettings.userId, userId))
      .returning();

    return result;
  }

  // Toggle account privacy (public/private)
  async setAccountPrivacy(userId: number, isPrivate: boolean): Promise<User> {
    const [result] = await db.update(users)
      .set({ isPrivate })
      .where(eq(users.id, userId))
      .returning();

    return result;
  }

  // Check if user can tag another user
  async canTagUser(taggerId: number, targetUserId: number): Promise<boolean> {
    const settings = await this.getPrivacySettings(targetUserId);
    return settings.allowTagging ?? true;
  }

  // Check if user can mention another user
  async canMentionUser(mentionerId: number, targetUserId: number): Promise<boolean> {
    const settings = await this.getPrivacySettings(targetUserId);
    return settings.allowMentions ?? true;
  }

  // Check if user can send message request
  async canSendMessageRequest(senderId: number, targetUserId: number): Promise<boolean> {
    const settings = await this.getPrivacySettings(targetUserId);
    return settings.allowMessageRequests ?? true;
  }

  // Check if user can reply to stories
  async canReplyToStory(replierId: number, storyOwnerId: number): Promise<boolean> {
    const settings = await this.getPrivacySettings(storyOwnerId);
    return settings.allowStoryReplies ?? true;
  }

  // Check if user's activity status is visible
  async isActivityStatusVisible(userId: number): Promise<boolean> {
    const settings = await this.getPrivacySettings(userId);
    return settings.showActivityStatus ?? true;
  }
}

// Export singleton instance
export const privacyService = new PrivacyService();
