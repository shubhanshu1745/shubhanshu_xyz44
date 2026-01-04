import { 
  contentReports,
  users,
  posts,
  stories,
  comments
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, sql, inArray, or } from "drizzle-orm";

export type ContentType = "post" | "story" | "comment" | "user" | "message";
export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

export interface ReportReason {
  code: string;
  label: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
}

export const REPORT_REASONS: ReportReason[] = [
  { code: "spam", label: "Spam", description: "Unwanted commercial content or repetitive posts", severity: "low" },
  { code: "harassment", label: "Harassment or Bullying", description: "Content that targets or intimidates individuals", severity: "high" },
  { code: "hate_speech", label: "Hate Speech", description: "Content promoting hatred against groups", severity: "critical" },
  { code: "violence", label: "Violence or Threats", description: "Content depicting or threatening violence", severity: "critical" },
  { code: "nudity", label: "Nudity or Sexual Content", description: "Inappropriate sexual content", severity: "high" },
  { code: "false_info", label: "False Information", description: "Misleading or false content", severity: "medium" },
  { code: "impersonation", label: "Impersonation", description: "Pretending to be someone else", severity: "high" },
  { code: "copyright", label: "Copyright Violation", description: "Content that infringes intellectual property", severity: "medium" },
  { code: "self_harm", label: "Self-Harm or Suicide", description: "Content promoting self-harm", severity: "critical" },
  { code: "scam", label: "Scam or Fraud", description: "Deceptive content for financial gain", severity: "high" },
  { code: "inappropriate", label: "Inappropriate Content", description: "Content not suitable for the platform", severity: "low" },
  { code: "other", label: "Other", description: "Other violations not listed", severity: "low" }
];

export interface ContentReport {
  id: number;
  reporterId: number;
  contentId: number;
  contentType: ContentType;
  reason: string;
  description: string | null;
  status: ReportStatus;
  reviewedBy: number | null;
  reviewedAt: Date | null;
  createdAt: Date | null;
  reporter?: { id: number; username: string };
  content?: Record<string, unknown>;
}

export interface ReportStats {
  total: number;
  pending: number;
  reviewed: number;
  resolved: number;
  dismissed: number;
  byReason: { reason: string; count: number }[];
  byContentType: { type: string; count: number }[];
}

export class ContentReportService {

  // Create a content report
  async createReport(
    reporterId: number,
    contentId: number,
    contentType: ContentType,
    reason: string,
    description?: string
  ): Promise<ContentReport> {
    // Validate reason
    const validReason = REPORT_REASONS.find(r => r.code === reason);
    if (!validReason) {
      throw new Error("Invalid report reason");
    }

    // Check for duplicate report
    const [existing] = await db.select()
      .from(contentReports)
      .where(and(
        eq(contentReports.reporterId, reporterId),
        eq(contentReports.contentId, contentId),
        eq(contentReports.contentType, contentType),
        eq(contentReports.status, "pending")
      ))
      .limit(1);

    if (existing) {
      throw new Error("You have already reported this content");
    }

    // Create report
    const [report] = await db.insert(contentReports)
      .values({
        reporterId,
        contentId,
        contentType,
        reason,
        description: description || null,
        status: "pending"
      })
      .returning();

    return {
      id: report.id,
      reporterId: report.reporterId,
      contentId: report.contentId,
      contentType: report.contentType as ContentType,
      reason: report.reason,
      description: report.description,
      status: report.status as ReportStatus,
      reviewedBy: report.reviewedBy,
      reviewedAt: report.reviewedAt,
      createdAt: report.createdAt
    };
  }

  // Get report by ID
  async getReportById(reportId: number): Promise<ContentReport | null> {
    const [report] = await db.select()
      .from(contentReports)
      .where(eq(contentReports.id, reportId))
      .limit(1);

    if (!report) return null;

    return this.enrichReport(report);
  }

  // Get reports for moderation queue
  async getModerationQueue(
    status: ReportStatus = "pending",
    limit: number = 20,
    offset: number = 0
  ): Promise<ContentReport[]> {
    const reports = await db.select()
      .from(contentReports)
      .where(eq(contentReports.status, status))
      .orderBy(desc(contentReports.createdAt))
      .limit(limit)
      .offset(offset);

    const enriched: ContentReport[] = [];
    for (const report of reports) {
      enriched.push(await this.enrichReport(report));
    }

    return enriched;
  }

  // Get reports by content
  async getReportsByContent(
    contentId: number,
    contentType: ContentType
  ): Promise<ContentReport[]> {
    const reports = await db.select()
      .from(contentReports)
      .where(and(
        eq(contentReports.contentId, contentId),
        eq(contentReports.contentType, contentType)
      ))
      .orderBy(desc(contentReports.createdAt));

    const enriched: ContentReport[] = [];
    for (const report of reports) {
      enriched.push(await this.enrichReport(report));
    }

    return enriched;
  }

  // Get reports by reporter
  async getReportsByReporter(reporterId: number): Promise<ContentReport[]> {
    const reports = await db.select()
      .from(contentReports)
      .where(eq(contentReports.reporterId, reporterId))
      .orderBy(desc(contentReports.createdAt));

    const enriched: ContentReport[] = [];
    for (const report of reports) {
      enriched.push(await this.enrichReport(report));
    }

    return enriched;
  }


  // Review a report
  async reviewReport(
    reportId: number,
    reviewerId: number,
    newStatus: ReportStatus,
    notes?: string
  ): Promise<ContentReport> {
    const [updated] = await db.update(contentReports)
      .set({
        status: newStatus,
        reviewedBy: reviewerId,
        reviewedAt: new Date()
      })
      .where(eq(contentReports.id, reportId))
      .returning();

    if (!updated) {
      throw new Error("Report not found");
    }

    return this.enrichReport(updated);
  }

  // Bulk review reports
  async bulkReviewReports(
    reportIds: number[],
    reviewerId: number,
    newStatus: ReportStatus
  ): Promise<{ updated: number }> {
    const result = await db.update(contentReports)
      .set({
        status: newStatus,
        reviewedBy: reviewerId,
        reviewedAt: new Date()
      })
      .where(inArray(contentReports.id, reportIds));

    return { updated: reportIds.length };
  }

  // Get report statistics
  async getReportStats(): Promise<ReportStats> {
    // Total reports
    const [totalData] = await db.select({ count: sql<number>`count(*)` })
      .from(contentReports);

    // By status
    const statusCounts = await db.select({
      status: contentReports.status,
      count: sql<number>`count(*)`
    })
    .from(contentReports)
    .groupBy(contentReports.status);

    const statusMap: Record<string, number> = {};
    for (const sc of statusCounts) {
      statusMap[sc.status] = Number(sc.count);
    }

    // By reason
    const reasonCounts = await db.select({
      reason: contentReports.reason,
      count: sql<number>`count(*)`
    })
    .from(contentReports)
    .groupBy(contentReports.reason)
    .orderBy(desc(sql`count(*)`));

    // By content type
    const typeCounts = await db.select({
      type: contentReports.contentType,
      count: sql<number>`count(*)`
    })
    .from(contentReports)
    .groupBy(contentReports.contentType)
    .orderBy(desc(sql`count(*)`));

    return {
      total: Number(totalData?.count || 0),
      pending: statusMap["pending"] || 0,
      reviewed: statusMap["reviewed"] || 0,
      resolved: statusMap["resolved"] || 0,
      dismissed: statusMap["dismissed"] || 0,
      byReason: reasonCounts.map((r: { reason: string; count: number }) => ({ reason: r.reason, count: Number(r.count) })),
      byContentType: typeCounts.map((t: { type: string; count: number }) => ({ type: t.type, count: Number(t.count) }))
    };
  }

  // Get high priority reports
  async getHighPriorityReports(limit: number = 10): Promise<ContentReport[]> {
    const highPriorityReasons = REPORT_REASONS
      .filter(r => r.severity === "critical" || r.severity === "high")
      .map(r => r.code);

    const reports = await db.select()
      .from(contentReports)
      .where(and(
        eq(contentReports.status, "pending"),
        inArray(contentReports.reason, highPriorityReasons)
      ))
      .orderBy(desc(contentReports.createdAt))
      .limit(limit);

    const enriched: ContentReport[] = [];
    for (const report of reports) {
      enriched.push(await this.enrichReport(report));
    }

    return enriched;
  }

  // Check if content has been reported
  async hasBeenReported(
    contentId: number,
    contentType: ContentType
  ): Promise<boolean> {
    const [report] = await db.select({ id: contentReports.id })
      .from(contentReports)
      .where(and(
        eq(contentReports.contentId, contentId),
        eq(contentReports.contentType, contentType)
      ))
      .limit(1);

    return !!report;
  }

  // Get report count for content
  async getReportCount(
    contentId: number,
    contentType: ContentType
  ): Promise<number> {
    const [data] = await db.select({ count: sql<number>`count(*)` })
      .from(contentReports)
      .where(and(
        eq(contentReports.contentId, contentId),
        eq(contentReports.contentType, contentType)
      ));

    return Number(data?.count || 0);
  }


  // Enrich report with related data
  private async enrichReport(report: typeof contentReports.$inferSelect): Promise<ContentReport> {
    // Get reporter info
    const [reporter] = await db.select({
      id: users.id,
      username: users.username
    })
    .from(users)
    .where(eq(users.id, report.reporterId))
    .limit(1);

    // Get content info based on type
    let content: Record<string, unknown> | undefined;

    switch (report.contentType) {
      case "post":
        const [post] = await db.select()
          .from(posts)
          .where(eq(posts.id, report.contentId))
          .limit(1);
        if (post) {
          content = { type: "post", ...post };
        }
        break;

      case "story":
        const [story] = await db.select()
          .from(stories)
          .where(eq(stories.id, report.contentId))
          .limit(1);
        if (story) {
          content = { type: "story", ...story };
        }
        break;

      case "comment":
        const [comment] = await db.select()
          .from(comments)
          .where(eq(comments.id, report.contentId))
          .limit(1);
        if (comment) {
          content = { type: "comment", ...comment };
        }
        break;

      case "user":
        const [user] = await db.select({
          id: users.id,
          username: users.username,
          bio: users.bio
        })
        .from(users)
        .where(eq(users.id, report.contentId))
        .limit(1);
        if (user) {
          content = { type: "user", ...user };
        }
        break;
    }

    return {
      id: report.id,
      reporterId: report.reporterId,
      contentId: report.contentId,
      contentType: report.contentType as ContentType,
      reason: report.reason,
      description: report.description,
      status: report.status as ReportStatus,
      reviewedBy: report.reviewedBy,
      reviewedAt: report.reviewedAt,
      createdAt: report.createdAt,
      reporter: reporter || undefined,
      content
    };
  }

  // Get available report reasons
  getReportReasons(): ReportReason[] {
    return REPORT_REASONS;
  }

  // Get reason details
  getReasonDetails(code: string): ReportReason | undefined {
    return REPORT_REASONS.find(r => r.code === code);
  }

  // Auto-escalate reports based on count threshold
  async checkAutoEscalation(
    contentId: number,
    contentType: ContentType,
    threshold: number = 5
  ): Promise<{ shouldEscalate: boolean; reportCount: number }> {
    const reportCount = await this.getReportCount(contentId, contentType);
    return {
      shouldEscalate: reportCount >= threshold,
      reportCount
    };
  }

  // Get reporter history (for detecting abuse)
  async getReporterHistory(reporterId: number): Promise<{
    totalReports: number;
    validReports: number;
    dismissedReports: number;
    trustScore: number;
  }> {
    const reports = await db.select({
      status: contentReports.status,
      count: sql<number>`count(*)`
    })
    .from(contentReports)
    .where(eq(contentReports.reporterId, reporterId))
    .groupBy(contentReports.status);

    let total = 0;
    let valid = 0;
    let dismissed = 0;

    for (const r of reports) {
      const count = Number(r.count);
      total += count;
      if (r.status === "resolved") valid += count;
      if (r.status === "dismissed") dismissed += count;
    }

    // Calculate trust score (0-100)
    const trustScore = total > 0 
      ? Math.round((valid / total) * 100)
      : 50; // Default for new reporters

    return { totalReports: total, validReports: valid, dismissedReports: dismissed, trustScore };
  }
}

// Export singleton instance
export const contentReportService = new ContentReportService();
