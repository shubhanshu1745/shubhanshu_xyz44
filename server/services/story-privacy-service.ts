import { 
  storyPrivacy,
  stories,
  closeFriends,
  userRelationships,
  users,
  type Story
} from "@shared/schema";
import { db } from "../db";
import { eq, and, inArray } from "drizzle-orm";

export type StoryVisibilityType = "public" | "followers" | "close_friends" | "custom";

export interface StoryPrivacySettings {
  visibilityType: StoryVisibilityType;
  customList?: number[]; // User IDs for custom visibility
  hiddenFrom?: number[]; // User IDs to hide from
}

export interface StoryPrivacyResult {
  success: boolean;
  message: string;
  privacy?: {
    id: number;
    storyId: number;
    visibilityType: string;
    customList: number[] | null;
    hiddenFrom: number[] | null;
  };
}

export class StoryPrivacyService {
  
  // Set privacy settings for a story
  async setStoryPrivacy(
    storyId: number, 
    userId: number, 
    settings: StoryPrivacySettings
  ): Promise<StoryPrivacyResult> {
    // Verify story ownership
    const [story] = await db.select()
      .from(stories)
      .where(and(eq(stories.id, storyId), eq(stories.userId, userId)))
      .limit(1);

    if (!story) {
      return { success: false, message: "Story not found or unauthorized" };
    }

    // Check if privacy settings already exist
    const [existing] = await db.select()
      .from(storyPrivacy)
      .where(eq(storyPrivacy.storyId, storyId))
      .limit(1);

    let privacy;

    if (existing) {
      // Update existing settings
      [privacy] = await db.update(storyPrivacy)
        .set({
          visibilityType: settings.visibilityType,
          customList: settings.customList || null,
          hiddenFrom: settings.hiddenFrom || null
        })
        .where(eq(storyPrivacy.storyId, storyId))
        .returning();
    } else {
      // Create new settings
      [privacy] = await db.insert(storyPrivacy)
        .values({
          storyId,
          visibilityType: settings.visibilityType,
          customList: settings.customList || null,
          hiddenFrom: settings.hiddenFrom || null
        })
        .returning();
    }

    return {
      success: true,
      message: "Story privacy updated",
      privacy: {
        id: privacy.id,
        storyId: privacy.storyId,
        visibilityType: privacy.visibilityType || "followers",
        customList: privacy.customList as number[] | null,
        hiddenFrom: privacy.hiddenFrom as number[] | null
      }
    };
  }

  // Get privacy settings for a story
  async getStoryPrivacy(storyId: number): Promise<StoryPrivacySettings | null> {
    const [privacy] = await db.select()
      .from(storyPrivacy)
      .where(eq(storyPrivacy.storyId, storyId))
      .limit(1);

    if (!privacy) {
      return { visibilityType: "followers" }; // Default
    }

    return {
      visibilityType: (privacy.visibilityType as StoryVisibilityType) || "followers",
      customList: privacy.customList as number[] | undefined,
      hiddenFrom: privacy.hiddenFrom as number[] | undefined
    };
  }

  // Check if a user can view a story
  async canViewStory(storyId: number, viewerId: number): Promise<boolean> {
    // Get story and its owner
    const [story] = await db.select()
      .from(stories)
      .where(eq(stories.id, storyId))
      .limit(1);

    if (!story) return false;

    // Owner can always view their own story
    if (story.userId === viewerId) return true;

    // Get privacy settings
    const privacy = await this.getStoryPrivacy(storyId);
    if (!privacy) return true; // Default to visible

    // Check if viewer is hidden
    if (privacy.hiddenFrom && privacy.hiddenFrom.includes(viewerId)) {
      return false;
    }

    switch (privacy.visibilityType) {
      case "public":
        return true;

      case "followers":
        return await this.isFollower(viewerId, story.userId);

      case "close_friends":
        return await this.isCloseFriend(story.userId, viewerId);

      case "custom":
        if (!privacy.customList) return false;
        return privacy.customList.includes(viewerId);

      default:
        return true;
    }
  }

  // Check if user is a follower
  private async isFollower(followerId: number, followingId: number): Promise<boolean> {
    const [relationship] = await db.select()
      .from(userRelationships)
      .where(and(
        eq(userRelationships.userId, followerId),
        eq(userRelationships.targetUserId, followingId),
        eq(userRelationships.relationshipType, "following")
      ))
      .limit(1);

    return !!relationship;
  }

  // Check if user is in close friends list
  private async isCloseFriend(ownerId: number, friendId: number): Promise<boolean> {
    const [closeFriend] = await db.select()
      .from(closeFriends)
      .where(and(
        eq(closeFriends.userId, ownerId),
        eq(closeFriends.friendId, friendId)
      ))
      .limit(1);

    return !!closeFriend;
  }

  // Hide story from specific users
  async hideStoryFrom(
    storyId: number, 
    ownerId: number, 
    userIds: number[]
  ): Promise<StoryPrivacyResult> {
    // Verify ownership
    const [story] = await db.select()
      .from(stories)
      .where(and(eq(stories.id, storyId), eq(stories.userId, ownerId)))
      .limit(1);

    if (!story) {
      return { success: false, message: "Story not found or unauthorized" };
    }

    // Get current privacy settings
    const currentPrivacy = await this.getStoryPrivacy(storyId);
    const currentHidden = currentPrivacy?.hiddenFrom || [];
    
    // Merge with new hidden users (deduplicate)
    const newHidden = Array.from(new Set([...currentHidden, ...userIds]));

    return await this.setStoryPrivacy(storyId, ownerId, {
      visibilityType: currentPrivacy?.visibilityType || "followers",
      customList: currentPrivacy?.customList,
      hiddenFrom: newHidden
    });
  }

  // Unhide story from specific users
  async unhideStoryFrom(
    storyId: number, 
    ownerId: number, 
    userIds: number[]
  ): Promise<StoryPrivacyResult> {
    // Verify ownership
    const [story] = await db.select()
      .from(stories)
      .where(and(eq(stories.id, storyId), eq(stories.userId, ownerId)))
      .limit(1);

    if (!story) {
      return { success: false, message: "Story not found or unauthorized" };
    }

    // Get current privacy settings
    const currentPrivacy = await this.getStoryPrivacy(storyId);
    const currentHidden = currentPrivacy?.hiddenFrom || [];
    
    // Remove specified users from hidden list
    const newHidden = currentHidden.filter(id => !userIds.includes(id));

    return await this.setStoryPrivacy(storyId, ownerId, {
      visibilityType: currentPrivacy?.visibilityType || "followers",
      customList: currentPrivacy?.customList,
      hiddenFrom: newHidden.length > 0 ? newHidden : undefined
    });
  }

  // Set custom audience for a story
  async setCustomAudience(
    storyId: number, 
    ownerId: number, 
    userIds: number[]
  ): Promise<StoryPrivacyResult> {
    return await this.setStoryPrivacy(storyId, ownerId, {
      visibilityType: "custom",
      customList: userIds
    });
  }

  // Get users who can view a story
  async getStoryAudience(storyId: number, ownerId: number): Promise<{
    visibilityType: StoryVisibilityType;
    audienceCount: number;
    hiddenCount: number;
  }> {
    const privacy = await this.getStoryPrivacy(storyId);
    
    let audienceCount = 0;
    const hiddenCount = privacy?.hiddenFrom?.length || 0;

    switch (privacy?.visibilityType) {
      case "public":
        // Count all users (approximate)
        const allUsers = await db.select({ id: users.id }).from(users);
        audienceCount = allUsers.length - hiddenCount;
        break;

      case "followers":
        const followers = await db.select()
          .from(userRelationships)
          .where(and(
            eq(userRelationships.targetUserId, ownerId),
            eq(userRelationships.relationshipType, "following")
          ));
        audienceCount = followers.length - hiddenCount;
        break;

      case "close_friends":
        const friends = await db.select()
          .from(closeFriends)
          .where(eq(closeFriends.userId, ownerId));
        audienceCount = friends.length - hiddenCount;
        break;

      case "custom":
        audienceCount = (privacy.customList?.length || 0) - hiddenCount;
        break;

      default:
        audienceCount = 0;
    }

    return {
      visibilityType: privacy?.visibilityType || "followers",
      audienceCount: Math.max(0, audienceCount),
      hiddenCount
    };
  }

  // Get hidden users for a story
  async getHiddenUsers(storyId: number, ownerId: number): Promise<{
    id: number;
    username: string;
    profileImage: string | null;
  }[]> {
    // Verify ownership
    const [story] = await db.select()
      .from(stories)
      .where(and(eq(stories.id, storyId), eq(stories.userId, ownerId)))
      .limit(1);

    if (!story) return [];

    const privacy = await this.getStoryPrivacy(storyId);
    if (!privacy?.hiddenFrom || privacy.hiddenFrom.length === 0) return [];

    const hiddenUsers = await db.select({
      id: users.id,
      username: users.username,
      profileImage: users.profileImage
    })
    .from(users)
    .where(inArray(users.id, privacy.hiddenFrom));

    return hiddenUsers;
  }

  // Get custom audience users for a story
  async getCustomAudienceUsers(storyId: number, ownerId: number): Promise<{
    id: number;
    username: string;
    profileImage: string | null;
  }[]> {
    // Verify ownership
    const [story] = await db.select()
      .from(stories)
      .where(and(eq(stories.id, storyId), eq(stories.userId, ownerId)))
      .limit(1);

    if (!story) return [];

    const privacy = await this.getStoryPrivacy(storyId);
    if (privacy?.visibilityType !== "custom" || !privacy.customList) return [];

    const customUsers = await db.select({
      id: users.id,
      username: users.username,
      profileImage: users.profileImage
    })
    .from(users)
    .where(inArray(users.id, privacy.customList));

    return customUsers;
  }

  // Filter stories that a user can view
  async filterViewableStories(storyIds: number[], viewerId: number): Promise<number[]> {
    const viewable: number[] = [];

    for (const storyId of storyIds) {
      if (await this.canViewStory(storyId, viewerId)) {
        viewable.push(storyId);
      }
    }

    return viewable;
  }

  // Delete privacy settings when story is deleted
  async deleteStoryPrivacy(storyId: number): Promise<void> {
    await db.delete(storyPrivacy).where(eq(storyPrivacy.storyId, storyId));
  }

  // Copy privacy settings from one story to another
  async copyPrivacySettings(
    sourceStoryId: number, 
    targetStoryId: number, 
    ownerId: number
  ): Promise<StoryPrivacyResult> {
    // Verify ownership of both stories
    const sourceStory = await db.select()
      .from(stories)
      .where(and(eq(stories.id, sourceStoryId), eq(stories.userId, ownerId)))
      .limit(1);

    const targetStory = await db.select()
      .from(stories)
      .where(and(eq(stories.id, targetStoryId), eq(stories.userId, ownerId)))
      .limit(1);

    if (!sourceStory[0] || !targetStory[0]) {
      return { success: false, message: "Story not found or unauthorized" };
    }

    const sourcePrivacy = await this.getStoryPrivacy(sourceStoryId);
    if (!sourcePrivacy) {
      return { success: false, message: "Source story has no privacy settings" };
    }

    return await this.setStoryPrivacy(targetStoryId, ownerId, sourcePrivacy);
  }
}

// Export singleton instance
export const storyPrivacyService = new StoryPrivacyService();
