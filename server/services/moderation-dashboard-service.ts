import { 
  contentReports,
  users,
  posts,
  comments,
  stories,
  blockedUsers
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, sql, gte, lte, inArray, or } from "drizzle-orm";

export interface ModerationAction {
  id: number;
  moderatorId: number;
  moderatorUsername: string;
  actionType: "approve" | "reject" | "warn" | "suspend" | "ban" | "delete" | "restore";
  targetType: "user" | "post" | "comment" | "story";
  targetId: number;
  reason: string;
  notes?: string;
  createdAt: Date;
}

export interface ModerationQueueItem {
  id: number;
  contentType: string;
  contentId: number;
  reportCount: number;
  highestSeverity: string;
  reasons: string[];
  createdAt: Date;
  content?: Record<string, unknown>;
  reportedUser?: { id: number; username: string };
}

export interface ModeratorStats {
  moderatorId: number;
  username: string;
  actionsToday: number;
  actionsThisWeek: number;
  actionsThisMonth: number;
  averageResponseTime: number;
}

export interface DashboardOverview {
  pendingReports: number;
  resolvedToday: number;
  activeUsers: number;
  flaggedContent: number;
  recentActions: ModerationAction[];
  topReportReasons: { reason: string; count: number }[];
}

// In-memory storage for moderation actions (would be a database table in production)
const moderationActions: ModerationAction[] = [];
let actionIdCounter = 1;

export class ModerationDashboardService {

  // Get dashboard overview
  async getDashboardOverview(): Promise<DashboardOverview> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Pending reports
    const [pendingData] = await db.select({ count: sql<number>`count(*)` })
      .from(contentReports)
      .where(eq(contentReports.status, "pending"));

    // Resolved today
    const [resolvedData] = await db.select({ count: sql<number>`count(*)` })
      .from(contentReports)
      .where(and(
        or(
          eq(contentReports.status, "resolved"),
          eq(contentReports.status, "dismissed")
        ),
        gte(contentReports.reviewedAt, today)
      ));

    // Active users (users who posted today)
    const [activeData] = await db.select({ count: sql<number>`count(distinct ${posts.userId})` })
      .from(posts)
      .where(gte(posts.createdAt, today));

    // Flagged content (reports with high severity)
    const [flaggedData] = await db.select({ count: sql<number>`count(*)` })
      .from(contentReports)
      .where(and(
        eq(contentReports.status, "pending"),
        inArray(contentReports.reason, ["harassment", "hate_speech", "violence", "self_harm"])
      ));

    // Top report reasons
    const topReasons = await db.select({
      reason: contentReports.reason,
      count: sql<number>`count(*)`
    })
    .from(contentReports)
    .groupBy(contentReports.reason)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

    // Recent actions
    const recentActions = moderationActions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return {
      pendingReports: Number(pendingData?.count || 0),
      resolvedToday: Number(resolvedData?.count || 0),
      activeUsers: Number(activeData?.count || 0),
      flaggedContent: Number(flaggedData?.count || 0),
      recentActions,
      topReportReasons: topReasons.map((r: { reason: string; count: number }) => ({
        reason: r.reason,
        count: Number(r.count)
      }))
    };
  }

  // Get moderation queue
  async getModerationQueue(
    filters: {
      status?: string;
      contentType?: string;
      severity?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<ModerationQueueItem[]> {
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(contentReports.status, filters.status));
    } else {
      conditions.push(eq(contentReports.status, "pending"));
    }

    if (filters.contentType) {
      conditions.push(eq(contentReports.contentType, filters.contentType));
    }

    if (filters.severity) {
      const severityReasons: Record<string, string[]> = {
        critical: ["hate_speech", "violence", "self_harm"],
        high: ["harassment", "nudity", "impersonation", "scam"],
        medium: ["false_info", "copyright"],
        low: ["spam", "inappropriate", "other"]
      };
      const reasons = severityReasons[filters.severity] || [];
      if (reasons.length > 0) {
        conditions.push(inArray(contentReports.reason, reasons));
      }
    }

    if (filters.dateFrom) {
      conditions.push(gte(contentReports.createdAt, filters.dateFrom));
    }

    if (filters.dateTo) {
      conditions.push(lte(contentReports.createdAt, filters.dateTo));
    }

    // Group reports by content
    const reports = await db.select({
      contentType: contentReports.contentType,
      contentId: contentReports.contentId,
      count: sql<number>`count(*)`,
      reasons: sql<string>`string_agg(distinct ${contentReports.reason}, ',')`,
      minCreatedAt: sql<Date>`min(${contentReports.createdAt})`
    })
    .from(contentReports)
    .where(and(...conditions))
    .groupBy(contentReports.contentType, contentReports.contentId)
    .orderBy(desc(sql`count(*)`))
    .limit(limit)
    .offset(offset);

    const queueItems: ModerationQueueItem[] = [];

    for (const report of reports) {
      const reasons = report.reasons ? report.reasons.split(",") : [];
      const highestSeverity = this.getHighestSeverity(reasons);

      // Get content details
      const content = await this.getContentDetails(report.contentType, report.contentId);
      const reportedUser = content?.userId 
        ? await this.getUserBasicInfo(content.userId as number)
        : undefined;

      queueItems.push({
        id: report.contentId,
        contentType: report.contentType,
        contentId: report.contentId,
        reportCount: Number(report.count),
        highestSeverity,
        reasons,
        createdAt: report.minCreatedAt,
        content,
        reportedUser
      });
    }

    return queueItems;
  }


  // Record moderation action
  async recordAction(
    moderatorId: number,
    actionType: ModerationAction["actionType"],
    targetType: ModerationAction["targetType"],
    targetId: number,
    reason: string,
    notes?: string
  ): Promise<ModerationAction> {
    // Get moderator username
    const [moderator] = await db.select({ username: users.username })
      .from(users)
      .where(eq(users.id, moderatorId))
      .limit(1);

    const action: ModerationAction = {
      id: actionIdCounter++,
      moderatorId,
      moderatorUsername: moderator?.username || "unknown",
      actionType,
      targetType,
      targetId,
      reason,
      notes,
      createdAt: new Date()
    };

    moderationActions.push(action);

    // Execute the action
    await this.executeAction(action);

    return action;
  }

  // Execute moderation action
  private async executeAction(action: ModerationAction): Promise<void> {
    switch (action.actionType) {
      case "delete":
        await this.deleteContent(action.targetType, action.targetId);
        break;
      case "suspend":
      case "ban":
        // Would update user status in production
        break;
      case "warn":
        // Would send warning notification
        break;
      case "restore":
        // Would restore deleted content
        break;
    }

    // Update related reports
    await db.update(contentReports)
      .set({
        status: action.actionType === "approve" ? "dismissed" : "resolved",
        reviewedBy: action.moderatorId,
        reviewedAt: new Date()
      })
      .where(and(
        eq(contentReports.contentId, action.targetId),
        eq(contentReports.contentType, action.targetType)
      ));
  }

  // Delete content
  private async deleteContent(
    contentType: string,
    contentId: number
  ): Promise<void> {
    switch (contentType) {
      case "post":
        await db.delete(posts).where(eq(posts.id, contentId));
        break;
      case "comment":
        await db.delete(comments).where(eq(comments.id, contentId));
        break;
      case "story":
        await db.delete(stories).where(eq(stories.id, contentId));
        break;
    }
  }

  // Get moderator statistics
  async getModeratorStats(moderatorId: number): Promise<ModeratorStats> {
    const [moderator] = await db.select({ username: users.username })
      .from(users)
      .where(eq(users.id, moderatorId))
      .limit(1);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const actionsToday = moderationActions.filter(
      a => a.moderatorId === moderatorId && a.createdAt >= today
    ).length;

    const actionsThisWeek = moderationActions.filter(
      a => a.moderatorId === moderatorId && a.createdAt >= weekAgo
    ).length;

    const actionsThisMonth = moderationActions.filter(
      a => a.moderatorId === moderatorId && a.createdAt >= monthAgo
    ).length;

    return {
      moderatorId,
      username: moderator?.username || "unknown",
      actionsToday,
      actionsThisWeek,
      actionsThisMonth,
      averageResponseTime: 0 // Would calculate from timestamps
    };
  }

  // Get action history
  getActionHistory(
    filters: {
      moderatorId?: number;
      actionType?: string;
      targetType?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {},
    limit: number = 50
  ): ModerationAction[] {
    let filtered = [...moderationActions];

    if (filters.moderatorId) {
      filtered = filtered.filter(a => a.moderatorId === filters.moderatorId);
    }

    if (filters.actionType) {
      filtered = filtered.filter(a => a.actionType === filters.actionType);
    }

    if (filters.targetType) {
      filtered = filtered.filter(a => a.targetType === filters.targetType);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(a => a.createdAt >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(a => a.createdAt <= filters.dateTo!);
    }

    return filtered
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }


  // Get user moderation history
  async getUserModerationHistory(userId: number): Promise<{
    reports: number;
    warnings: number;
    suspensions: number;
    actions: ModerationAction[];
  }> {
    // Reports against this user
    const [reportData] = await db.select({ count: sql<number>`count(*)` })
      .from(contentReports)
      .where(eq(contentReports.contentType, "user"));

    // Actions against this user
    const userActions = moderationActions.filter(
      a => a.targetType === "user" && a.targetId === userId
    );

    const warnings = userActions.filter(a => a.actionType === "warn").length;
    const suspensions = userActions.filter(
      a => a.actionType === "suspend" || a.actionType === "ban"
    ).length;

    return {
      reports: Number(reportData?.count || 0),
      warnings,
      suspensions,
      actions: userActions
    };
  }

  // Appeal handling
  async handleAppeal(
    reportId: number,
    moderatorId: number,
    decision: "uphold" | "overturn",
    notes: string
  ): Promise<{ success: boolean; message: string }> {
    const [report] = await db.select()
      .from(contentReports)
      .where(eq(contentReports.id, reportId))
      .limit(1);

    if (!report) {
      return { success: false, message: "Report not found" };
    }

    if (decision === "overturn") {
      // Restore content if it was deleted
      await db.update(contentReports)
        .set({
          status: "dismissed",
          reviewedBy: moderatorId,
          reviewedAt: new Date()
        })
        .where(eq(contentReports.id, reportId));

      await this.recordAction(
        moderatorId,
        "restore",
        report.contentType as ModerationAction["targetType"],
        report.contentId,
        "Appeal upheld",
        notes
      );
    } else {
      await db.update(contentReports)
        .set({
          status: "resolved",
          reviewedBy: moderatorId,
          reviewedAt: new Date()
        })
        .where(eq(contentReports.id, reportId));
    }

    return { 
      success: true, 
      message: decision === "overturn" ? "Appeal granted" : "Appeal denied" 
    };
  }

  // Helper: Get content details
  private async getContentDetails(
    contentType: string,
    contentId: number
  ): Promise<Record<string, unknown> | undefined> {
    switch (contentType) {
      case "post":
        const [post] = await db.select()
          .from(posts)
          .where(eq(posts.id, contentId))
          .limit(1);
        return post ? { ...post, type: "post" } : undefined;

      case "comment":
        const [comment] = await db.select()
          .from(comments)
          .where(eq(comments.id, contentId))
          .limit(1);
        return comment ? { ...comment, type: "comment" } : undefined;

      case "story":
        const [story] = await db.select()
          .from(stories)
          .where(eq(stories.id, contentId))
          .limit(1);
        return story ? { ...story, type: "story" } : undefined;

      case "user":
        const [user] = await db.select({
          id: users.id,
          username: users.username,
          bio: users.bio
        })
        .from(users)
        .where(eq(users.id, contentId))
        .limit(1);
        return user ? { ...user, type: "user" } : undefined;

      default:
        return undefined;
    }
  }

  // Helper: Get user basic info
  private async getUserBasicInfo(
    userId: number
  ): Promise<{ id: number; username: string } | undefined> {
    const [user] = await db.select({
      id: users.id,
      username: users.username
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

    return user || undefined;
  }

  // Helper: Get highest severity from reasons
  private getHighestSeverity(reasons: string[]): string {
    const severityOrder = ["critical", "high", "medium", "low"];
    const reasonSeverity: Record<string, string> = {
      hate_speech: "critical",
      violence: "critical",
      self_harm: "critical",
      harassment: "high",
      nudity: "high",
      impersonation: "high",
      scam: "high",
      false_info: "medium",
      copyright: "medium",
      spam: "low",
      inappropriate: "low",
      other: "low"
    };

    for (const severity of severityOrder) {
      for (const reason of reasons) {
        if (reasonSeverity[reason] === severity) {
          return severity;
        }
      }
    }

    return "low";
  }

  // Get daily statistics
  async getDailyStats(days: number = 7): Promise<{
    date: string;
    reports: number;
    resolved: number;
    actions: number;
  }[]> {
    const stats: { date: string; reports: number; resolved: number; actions: number }[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [reportData] = await db.select({ count: sql<number>`count(*)` })
        .from(contentReports)
        .where(and(
          gte(contentReports.createdAt, date),
          lte(contentReports.createdAt, nextDate)
        ));

      const [resolvedData] = await db.select({ count: sql<number>`count(*)` })
        .from(contentReports)
        .where(and(
          gte(contentReports.reviewedAt, date),
          lte(contentReports.reviewedAt, nextDate)
        ));

      const dayActions = moderationActions.filter(
        a => a.createdAt >= date && a.createdAt < nextDate
      ).length;

      stats.push({
        date: date.toISOString().split("T")[0],
        reports: Number(reportData?.count || 0),
        resolved: Number(resolvedData?.count || 0),
        actions: dayActions
      });
    }

    return stats.reverse();
  }
}

// Export singleton instance
export const moderationDashboardService = new ModerationDashboardService();
