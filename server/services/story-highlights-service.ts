import { 
  stories,
  users,
  type Story
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, sql } from "drizzle-orm";

// Note: This service assumes a story_highlights table will be added to the schema
// For now, we use the isHighlight field on stories table

export interface HighlightCategory {
  id: number;
  name: string;
  coverImage: string | null;
  storyCount: number;
  createdAt: Date | null;
}

export interface HighlightResult {
  success: boolean;
  message: string;
  highlight?: Story;
}

export interface HighlightCategoryResult {
  success: boolean;
  message: string;
  category?: HighlightCategory;
}

interface CategoryData {
  id: number;
  name: string;
  coverImage: string | null;
  storyIds: number[];
  createdAt: Date;
}

// In-memory storage for highlight categories (would be a DB table in production)
const highlightCategories = new Map<number, Map<string, CategoryData>>();
let categoryIdCounter = 1;

export class StoryHighlightsService {
  
  // Mark a story as a highlight
  async addToHighlights(storyId: number, userId: number): Promise<HighlightResult> {
    // Verify ownership
    const [story] = await db.select()
      .from(stories)
      .where(and(eq(stories.id, storyId), eq(stories.userId, userId)))
      .limit(1);

    if (!story) {
      return { success: false, message: "Story not found or unauthorized" };
    }

    if (story.isHighlight) {
      return { success: false, message: "Story is already a highlight" };
    }

    const [updated] = await db.update(stories)
      .set({ isHighlight: true })
      .where(eq(stories.id, storyId))
      .returning();

    return { success: true, message: "Added to highlights", highlight: updated };
  }

  // Remove a story from highlights
  async removeFromHighlights(storyId: number, userId: number): Promise<HighlightResult> {
    // Verify ownership
    const [story] = await db.select()
      .from(stories)
      .where(and(eq(stories.id, storyId), eq(stories.userId, userId)))
      .limit(1);

    if (!story) {
      return { success: false, message: "Story not found or unauthorized" };
    }

    if (!story.isHighlight) {
      return { success: false, message: "Story is not a highlight" };
    }

    const [updated] = await db.update(stories)
      .set({ isHighlight: false })
      .where(eq(stories.id, storyId))
      .returning();

    // Remove from any categories
    this.removeStoryFromAllCategories(userId, storyId);

    return { success: true, message: "Removed from highlights", highlight: updated };
  }

  // Get all highlights for a user
  async getUserHighlights(userId: number): Promise<Story[]> {
    const highlights = await db.select()
      .from(stories)
      .where(and(
        eq(stories.userId, userId),
        eq(stories.isHighlight, true)
      ))
      .orderBy(desc(stories.createdAt));

    return highlights;
  }

  // Create a highlight category
  createCategory(userId: number, name: string, coverImage?: string): HighlightCategoryResult {
    if (!highlightCategories.has(userId)) {
      highlightCategories.set(userId, new Map());
    }

    const userCategories = highlightCategories.get(userId)!;

    // Check if category name already exists
    if (userCategories.has(name.toLowerCase())) {
      return { success: false, message: "Category already exists" };
    }

    const category: CategoryData = {
      id: categoryIdCounter++,
      name,
      coverImage: coverImage || null,
      storyIds: [],
      createdAt: new Date()
    };

    userCategories.set(name.toLowerCase(), category);

    return {
      success: true,
      message: "Category created",
      category: {
        id: category.id,
        name: category.name,
        coverImage: category.coverImage,
        storyCount: 0,
        createdAt: category.createdAt
      }
    };
  }

  // Find category by ID
  private findCategoryById(userId: number, categoryId: number): { category: CategoryData; key: string } | null {
    const userCategories = highlightCategories.get(userId);
    if (!userCategories) return null;

    let result: { category: CategoryData; key: string } | null = null;
    userCategories.forEach((cat, key) => {
      if (cat.id === categoryId) {
        result = { category: cat, key };
      }
    });

    return result;
  }

  // Update a highlight category
  updateCategory(
    userId: number, 
    categoryId: number, 
    updates: { name?: string; coverImage?: string }
  ): HighlightCategoryResult {
    const userCategories = highlightCategories.get(userId);
    if (!userCategories) {
      return { success: false, message: "Category not found" };
    }

    const found = this.findCategoryById(userId, categoryId);
    if (!found) {
      return { success: false, message: "Category not found" };
    }

    const { category, key: oldKey } = found;

    // Update category
    if (updates.name) {
      userCategories.delete(oldKey);
      category.name = updates.name;
      userCategories.set(updates.name.toLowerCase(), category);
    }

    if (updates.coverImage !== undefined) {
      category.coverImage = updates.coverImage;
    }

    return {
      success: true,
      message: "Category updated",
      category: {
        id: category.id,
        name: category.name,
        coverImage: category.coverImage,
        storyCount: category.storyIds.length,
        createdAt: category.createdAt
      }
    };
  }

  // Delete a highlight category
  deleteCategory(userId: number, categoryId: number): { success: boolean; message: string } {
    const userCategories = highlightCategories.get(userId);
    if (!userCategories) {
      return { success: false, message: "Category not found" };
    }

    const found = this.findCategoryById(userId, categoryId);
    if (!found) {
      return { success: false, message: "Category not found" };
    }

    userCategories.delete(found.key);

    return { success: true, message: "Category deleted" };
  }

  // Get all categories for a user
  getCategories(userId: number): HighlightCategory[] {
    const userCategories = highlightCategories.get(userId);
    if (!userCategories) {
      return [];
    }

    const categories: HighlightCategory[] = [];
    userCategories.forEach(cat => {
      categories.push({
        id: cat.id,
        name: cat.name,
        coverImage: cat.coverImage,
        storyCount: cat.storyIds.length,
        createdAt: cat.createdAt
      });
    });

    return categories.sort((a, b) => 
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  // Add a story to a category
  async addStoryToCategory(
    userId: number, 
    categoryId: number, 
    storyId: number
  ): Promise<{ success: boolean; message: string }> {
    // Verify story ownership and highlight status
    const [story] = await db.select()
      .from(stories)
      .where(and(
        eq(stories.id, storyId),
        eq(stories.userId, userId),
        eq(stories.isHighlight, true)
      ))
      .limit(1);

    if (!story) {
      return { success: false, message: "Story not found, not owned, or not a highlight" };
    }

    const found = this.findCategoryById(userId, categoryId);
    if (!found) {
      return { success: false, message: "Category not found" };
    }

    const { category } = found;

    if (category.storyIds.includes(storyId)) {
      return { success: false, message: "Story already in category" };
    }

    category.storyIds.push(storyId);

    return { success: true, message: "Story added to category" };
  }

  // Remove a story from a category
  removeStoryFromCategory(
    userId: number, 
    categoryId: number, 
    storyId: number
  ): { success: boolean; message: string } {
    const found = this.findCategoryById(userId, categoryId);
    if (!found) {
      return { success: false, message: "Category not found" };
    }

    const { category } = found;
    const index = category.storyIds.indexOf(storyId);
    if (index === -1) {
      return { success: false, message: "Story not in category" };
    }

    category.storyIds.splice(index, 1);

    return { success: true, message: "Story removed from category" };
  }

  // Remove story from all categories
  private removeStoryFromAllCategories(userId: number, storyId: number): void {
    const userCategories = highlightCategories.get(userId);
    if (!userCategories) return;

    userCategories.forEach(cat => {
      const index = cat.storyIds.indexOf(storyId);
      if (index !== -1) {
        cat.storyIds.splice(index, 1);
      }
    });
  }

  // Get stories in a category
  async getCategoryStories(userId: number, categoryId: number): Promise<Story[]> {
    const found = this.findCategoryById(userId, categoryId);
    if (!found || found.category.storyIds.length === 0) {
      return [];
    }

    const storyIds = found.category.storyIds;

    const categoryStories = await db.select()
      .from(stories)
      .where(and(
        eq(stories.userId, userId),
        eq(stories.isHighlight, true)
      ));

    // Filter to only stories in this category and maintain order
    return storyIds
      .map(id => categoryStories.find((s: Story) => s.id === id))
      .filter((s): s is Story => s !== undefined);
  }

  // Reorder stories in a category
  reorderCategoryStories(
    userId: number, 
    categoryId: number, 
    newOrder: number[]
  ): { success: boolean; message: string } {
    const found = this.findCategoryById(userId, categoryId);
    if (!found) {
      return { success: false, message: "Category not found" };
    }

    const { category } = found;

    // Verify all story IDs are valid
    const currentIds = new Set(category.storyIds);
    const newIds = new Set(newOrder);

    if (currentIds.size !== newIds.size) {
      return { success: false, message: "Invalid story order" };
    }

    for (const id of newOrder) {
      if (!currentIds.has(id)) {
        return { success: false, message: "Invalid story ID in order" };
      }
    }

    category.storyIds = newOrder;

    return { success: true, message: "Stories reordered" };
  }

  // Get highlight count for a user
  async getHighlightCount(userId: number): Promise<number> {
    const highlights = await this.getUserHighlights(userId);
    return highlights.length;
  }

  // Check if a story is a highlight
  async isHighlight(storyId: number): Promise<boolean> {
    const [story] = await db.select({ isHighlight: stories.isHighlight })
      .from(stories)
      .where(eq(stories.id, storyId))
      .limit(1);

    return story?.isHighlight || false;
  }

  // Get uncategorized highlights
  async getUncategorizedHighlights(userId: number): Promise<Story[]> {
    const allHighlights = await this.getUserHighlights(userId);
    const userCategories = highlightCategories.get(userId);

    if (!userCategories) {
      return allHighlights;
    }

    // Collect all categorized story IDs
    const categorizedIds = new Set<number>();
    userCategories.forEach(cat => {
      cat.storyIds.forEach(id => categorizedIds.add(id));
    });

    // Return highlights not in any category
    return allHighlights.filter(h => !categorizedIds.has(h.id));
  }

  // Set category cover from a story
  async setCategoryCoverFromStory(
    userId: number, 
    categoryId: number, 
    storyId: number
  ): Promise<{ success: boolean; message: string }> {
    // Get story image
    const [story] = await db.select({ imageUrl: stories.imageUrl })
      .from(stories)
      .where(and(
        eq(stories.id, storyId),
        eq(stories.userId, userId)
      ))
      .limit(1);

    if (!story || !story.imageUrl) {
      return { success: false, message: "Story not found or has no image" };
    }

    const result = this.updateCategory(userId, categoryId, { coverImage: story.imageUrl });
    return { success: result.success, message: result.message };
  }
}

// Export singleton instance
export const storyHighlightsService = new StoryHighlightsService();
