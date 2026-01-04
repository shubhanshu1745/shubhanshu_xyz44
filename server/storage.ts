import { 
  users, type User, type InsertUser,
  posts, type Post, type InsertPost,
  likes, type Like, type InsertLike,
  comments, type Comment, type InsertComment,
  follows, type Follow, type InsertFollow,
  blockedUsers, type BlockedUser, type InsertBlockedUser,
  conversations, type Conversation, type InsertConversation,
  messages, type Message, type InsertMessage,
  stories, type Story, type InsertStory,
  storyViews, type StoryView, type InsertStoryView,
  storyReactions, type StoryReaction, type InsertStoryReaction,
  storyComments, type StoryComment, type InsertStoryComment,
  storyPolls, type StoryPoll, type InsertStoryPoll,
  storyPollVotes, type StoryPollVote, type InsertStoryPollVote,
  storyQuestions, type StoryQuestion, type InsertStoryQuestion,
  storyQuestionResponses, type StoryQuestionResponse, type InsertStoryQuestionResponse,
  playerStats, type PlayerStats, type InsertPlayerStats,
  playerMatches, type PlayerMatch, type InsertPlayerMatch,
  playerMatchPerformance, type PlayerMatchPerformance, type InsertPlayerMatchPerformance,
  matches, type Match, type InsertMatch,
  teams, type Team, type InsertTeam,
  matchPlayers, type MatchPlayer, type InsertMatchPlayer,
  ballByBall, type BallByBall, type InsertBallByBall,
  tokens, type Token, type InsertToken,
  tags, type Tag, type InsertTag,
  postTags, type PostTag, type InsertPostTag,
  contentCategories, type ContentCategory, type InsertContentCategory,
  userInterests, type UserInterest, type InsertUserInterest,
  contentEngagement, type ContentEngagement, type InsertContentEngagement,
  venues, type Venue, type InsertVenue,
  venueAvailability, type VenueAvailability, type InsertVenueAvailability,
  venueBookings, type VenueBooking, type InsertVenueBooking,
  tournaments, type Tournament, type InsertTournament,
  tournamentTeams, type TournamentTeam, type InsertTournamentTeam,
  tournamentMatches, type TournamentMatch, type InsertTournamentMatch,
  tournamentStandings, type TournamentStandings, type InsertTournamentStandings,
  playerTournamentStats, type PlayerTournamentStats, type InsertPlayerTournamentStats,
  polls, type Poll, type InsertPoll,
  pollOptions, type PollOption, type InsertPollOption,
  pollVotes, type PollVote, type InsertPollVote,
  savedPosts, type SavedPost, type InsertSavedPost,
  commentLikes, type CommentLike, type InsertCommentLike,
  postShares, type PostShare, type InsertPostShare,
  postMentions, type PostMention,
  // Enhanced Social Features
  userRelationships, type UserRelationship, type InsertUserRelationship,
  followRequests, type FollowRequest, type InsertFollowRequest,
  userPrivacySettings, type UserPrivacySettings, type InsertUserPrivacySettings,
  closeFriends, type CloseFriend, type InsertCloseFriend,
  userRestrictions, type UserRestriction, type InsertUserRestriction,
  notifications, type Notification, type InsertNotification
} from "@shared/schema";

// Type aliases for storage interface
export type TournamentStanding = TournamentStandings;
export type InsertTournamentStanding = InsertTournamentStandings;
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  searchUsers(query: string, limit?: number): Promise<User[]>;
  
  // Token methods
  createToken(token: InsertToken): Promise<Token>;
  getTokenByToken(token: string): Promise<Token | undefined>;
  deleteToken(id: number): Promise<boolean>;
  
  // Content categorization and discovery methods
  createTag(tag: InsertTag): Promise<Tag>;
  getTags(type?: string): Promise<Tag[]>;
  getTagById(id: number): Promise<Tag | undefined>;
  updateTagPopularity(id: number, increment: number): Promise<Tag | undefined>;
  addPostTag(postTag: InsertPostTag): Promise<PostTag>;
  getPostTags(postId: number): Promise<Tag[]>;
  removePostTag(postId: number, tagId: number): Promise<boolean>;
  createContentCategory(category: InsertContentCategory): Promise<ContentCategory>;
  getContentCategories(): Promise<ContentCategory[]>;
  updateUserInterest(interest: InsertUserInterest): Promise<UserInterest>;
  getUserInterests(userId: number): Promise<(UserInterest & { tag: Tag })[]>;
  recordContentEngagement(engagement: InsertContentEngagement): Promise<ContentEngagement>;
  getContentEngagementForUser(userId: number): Promise<ContentEngagement[]>;
  getPersonalizedFeed(userId: number, limit?: number): Promise<(Post & { 
    user: User, 
    likeCount: number, 
    commentCount: number, 
    hasLiked: boolean,
    tags: Tag[],
    relevanceScore: number
  })[]>;
  
  // Post methods
  createPost(post: InsertPost): Promise<Post>;
  getPost(id: number): Promise<Post | undefined>;
  getUserPosts(userId: number): Promise<Post[]>;
  getFeed(userId: number, limit?: number): Promise<(Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean })[]>;
  deletePost(id: number): Promise<boolean>;
  getReels(userId: number, limit?: number): Promise<(Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean })[]>;
  
  // Like methods
  likePost(like: InsertLike): Promise<Like>;
  unlikePost(userId: number, postId: number): Promise<boolean>;
  getLike(userId: number, postId: number): Promise<Like | undefined>;
  getLikesForPost(postId: number): Promise<Like[]>;
  
  // Comment methods
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsForPost(postId: number): Promise<(Comment & { user: User, likeCount: number, replyCount: number, hasLiked: boolean })[]>;
  getComment(id: number): Promise<Comment | undefined>;
  deleteComment(id: number): Promise<boolean>;
  updateComment(id: number, data: Partial<Comment>): Promise<Comment | undefined>;
  unpinAllComments(postId: number): Promise<boolean>;
  getRepliesForComment(commentId: number): Promise<(Comment & { user: User, likeCount: number, hasLiked: boolean })[]>;
  
  // Comment like methods
  likeComment(like: InsertCommentLike): Promise<CommentLike>;
  unlikeComment(userId: number, commentId: number): Promise<boolean>;
  getCommentLike(userId: number, commentId: number): Promise<CommentLike | undefined>;
  getCommentLikesCount(commentId: number): Promise<number>;
  
  // Saved posts methods
  savePost(save: InsertSavedPost): Promise<SavedPost>;
  unsavePost(userId: number, postId: number): Promise<boolean>;
  getSavedPost(userId: number, postId: number): Promise<SavedPost | undefined>;
  getUserSavedPosts(userId: number): Promise<(Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean })[]>;
  getUserTaggedPosts(userId: number): Promise<(Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean })[]>;
  
  // Post share methods
  createPostShare(share: InsertPostShare): Promise<PostShare>;
  getPostShares(postId: number): Promise<PostShare[]>;
  getPostShareCount(postId: number): Promise<number>;
  
  // Follow methods
  followUser(follow: InsertFollow): Promise<Follow>;
  unfollowUser(followerId: number, followingId: number): Promise<boolean>;
  removeFollower(userId: number, followerIdToRemove: number): Promise<boolean>;
  cancelFollowRequest(followerId: number, followingId: number): Promise<boolean>;
  getFollowers(userId: number): Promise<User[]>;
  getFollowing(userId: number): Promise<User[]>;
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
  isMutualFollow(userId1: number, userId2: number): Promise<boolean>;
  getMutualFollowers(userId: number): Promise<User[]>;
  getMutualFriends(userId1: number, userId2: number): Promise<User[]>;
  getFollowByUsers(followerId: number, followingId: number): Promise<Follow | undefined>;
  getSuggestedUsers(userId: number, limit?: number): Promise<User[]>;
  
  // Follow request methods
  sendFollowRequest(followerId: number, followingId: number): Promise<Follow>;
  acceptFollowRequest(followId: number): Promise<Follow | null>;
  rejectFollowRequest(followId: number): Promise<boolean>;
  getPendingFollowRequests(userId: number): Promise<(Follow & { follower: User })[]>;
  getFollowRequestStatus(followerId: number, followingId: number): Promise<string | null>;
  
  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number, limit?: number): Promise<(Notification & { fromUser?: User })[]>;
  markNotificationAsRead(notificationId: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  deleteNotification(notificationId: number): Promise<boolean>;

  // Block methods
  blockUser(block: InsertBlockedUser): Promise<BlockedUser>;
  unblockUser(blockerId: number, blockedId: number): Promise<boolean>;
  isBlocked(blockerId: number, blockedId: number): Promise<boolean>;
  getBlockedUsers(userId: number): Promise<User[]>;

  // Chat methods
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(user1Id: number, user2Id: number): Promise<Conversation | undefined>;
  getConversationById(id: number): Promise<Conversation | undefined>;
  getUserConversations(userId: number): Promise<(Conversation & { 
    otherUser: Omit<User, 'password'>, 
    lastMessage: Message | null,
    unreadCount: number 
  })[]>;
  
  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getConversationMessages(conversationId: number): Promise<(Message & { sender: Omit<User, 'password'> })[]>;
  markMessagesAsRead(conversationId: number, userId: number): Promise<boolean>;
  deleteMessage(id: number, userId: number): Promise<boolean>;
  
  // Story methods
  createStory(story: InsertStory): Promise<Story>;
  getUserStories(userId: number): Promise<Story[]>;
  getStoriesForFeed(userId: number): Promise<(Story & { user: User })[]>;
  deleteExpiredStories(): Promise<void>;
  getStoryById(storyId: number): Promise<Story | null>;
  
  // Story Views
  createStoryView(view: InsertStoryView): Promise<StoryView>;
  incrementStoryViewCount(storyId: number): Promise<Story | null>;
  hasUserViewedStories(viewerId: number, storyUserId: number): Promise<boolean>;
  
  // Story Reactions
  createStoryReaction(reaction: InsertStoryReaction): Promise<StoryReaction>;
  getStoryReaction(storyId: number, userId: number): Promise<StoryReaction | null>;
  updateStoryReaction(reactionId: number, data: Partial<InsertStoryReaction>): Promise<StoryReaction | null>;
  deleteStoryReaction(reactionId: number): Promise<void>;
  getStoryReactions(storyId: number): Promise<StoryReaction[]>;
  
  // Story Comments
  createStoryComment(comment: InsertStoryComment): Promise<StoryComment>;
  getStoryComments(storyId: number): Promise<StoryComment[]>;
  getStoryCommentById(commentId: number): Promise<StoryComment | null>;
  deleteStoryComment(commentId: number): Promise<void>;
  
  // Story Poll methods
  createStoryPoll(poll: InsertStoryPoll): Promise<StoryPoll>;
  getStoryPoll(storyId: number): Promise<StoryPoll | null>;
  createStoryPollVote(vote: InsertStoryPollVote): Promise<StoryPollVote>;
  getStoryPollVotes(pollId: number): Promise<StoryPollVote[]>;
  getUserStoryPollVote(pollId: number, userId: number): Promise<StoryPollVote | null>;
  updateStoryPollVote(voteId: number, optionNumber: number): Promise<StoryPollVote | null>;
  
  // Story Question methods
  createStoryQuestion(question: InsertStoryQuestion): Promise<StoryQuestion>;
  getStoryQuestion(storyId: number): Promise<StoryQuestion | null>;
  createStoryQuestionResponse(response: InsertStoryQuestionResponse): Promise<StoryQuestionResponse>;
  getStoryQuestionResponses(questionId: number): Promise<StoryQuestionResponse[]>;
  
  // Player Stats methods
  createPlayerStats(stats: InsertPlayerStats): Promise<PlayerStats>;
  getPlayerStats(userId: number): Promise<PlayerStats | undefined>;
  updatePlayerStats(userId: number, stats: Partial<PlayerStats>): Promise<PlayerStats | undefined>;
  
  // Player Match methods
  createPlayerMatch(match: InsertPlayerMatch): Promise<PlayerMatch>;
  getPlayerMatch(id: number): Promise<PlayerMatch | undefined>;
  getUserMatches(userId: number): Promise<PlayerMatch[]>;
  
  // Player Match Performance methods
  createPlayerMatchPerformance(performance: InsertPlayerMatchPerformance): Promise<PlayerMatchPerformance>;
  getPlayerMatchPerformance(userId: number, matchId: number): Promise<PlayerMatchPerformance | undefined>;
  getMatchPerformances(matchId: number): Promise<(PlayerMatchPerformance & { user: User })[]>;
  
  // Match management methods
  createMatch(match: InsertMatch): Promise<Match>;
  getMatchById(id: number): Promise<Match | undefined>;
  updateMatch(id: number, matchData: Partial<Match>): Promise<Match | undefined>;
  getMatchesByCreator(userId: number): Promise<Match[]>;
  deleteMatch(id: number): Promise<boolean>;
  
  // Team management methods
  createTeam(team: InsertTeam): Promise<Team>;
  getTeamById(id: number): Promise<Team | undefined>;
  getTeamByName(name: string): Promise<Team | undefined>;
  getTeamByNameOrCreate(team: Partial<InsertTeam>): Promise<Team>;
  getUserTeams(userId: number): Promise<Team[]>;
  updateTeam(id: number, teamData: Partial<Team>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;
  
  // Match player management methods
  addMatchPlayer(player: InsertMatchPlayer): Promise<MatchPlayer>;
  getMatchPlayersByTeam(matchId: number, teamId: number): Promise<MatchPlayer[]>;
  updateMatchPlayer(id: number, playerData: Partial<MatchPlayer>): Promise<MatchPlayer | undefined>;
  removeMatchPlayer(id: number): Promise<boolean>;
  
  // Ball-by-ball data methods
  recordBallByBall(ball: InsertBallByBall): Promise<BallByBall>;
  getMatchBalls(matchId: number): Promise<BallByBall[]>;

  // Venue management methods
  createVenue(venue: InsertVenue): Promise<Venue>;
  getVenue(id: number): Promise<Venue | undefined>;
  getVenueByName(name: string): Promise<Venue | undefined>;
  getVenues(query?: string, limit?: number): Promise<Venue[]>;
  getNearbyVenues(lat: number, lng: number, radiusKm: number): Promise<Venue[]>;
  updateVenue(id: number, venueData: Partial<Venue>): Promise<Venue | undefined>;
  deleteVenue(id: number): Promise<boolean>;
  getUserVenues(userId: number): Promise<Venue[]>;
  
  // Venue availability methods
  createVenueAvailability(availability: InsertVenueAvailability): Promise<VenueAvailability>;
  getVenueAvailabilities(venueId: number): Promise<VenueAvailability[]>;
  updateVenueAvailability(id: number, data: Partial<VenueAvailability>): Promise<VenueAvailability | undefined>;
  deleteVenueAvailability(id: number): Promise<boolean>;
  
  // Venue booking methods
  createVenueBooking(booking: InsertVenueBooking): Promise<VenueBooking>;
  getVenueBooking(id: number): Promise<VenueBooking | undefined>;
  getUserBookings(userId: number): Promise<(VenueBooking & { venue: Venue })[]>;
  getVenueBookings(venueId: number, startDate?: Date, endDate?: Date): Promise<(VenueBooking & { user: User })[]>;
  updateVenueBooking(id: number, data: Partial<VenueBooking>): Promise<VenueBooking | undefined>;
  cancelVenueBooking(id: number): Promise<boolean>;
  checkVenueAvailability(venueId: number, date: Date, startTime: string, endTime: string): Promise<boolean>;
  
  // Tournament methods
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  getTournament(id: number): Promise<Tournament | undefined>;
  getTournaments(query?: string, status?: string, limit?: number): Promise<Tournament[]>;
  getUserTournaments(userId: number): Promise<Tournament[]>;
  updateTournament(id: number, data: Partial<Tournament>): Promise<Tournament | undefined>;
  deleteTournament(id: number): Promise<boolean>;
  
  // Tournament team methods
  addTeamToTournament(teamData: InsertTournamentTeam): Promise<TournamentTeam>;
  getTournamentTeams(tournamentId: number): Promise<(TournamentTeam & { team: Team })[]>;
  updateTournamentTeam(tournamentId: number, teamId: number, data: Partial<TournamentTeam>): Promise<TournamentTeam | undefined>;
  removeTeamFromTournament(tournamentId: number, teamId: number): Promise<boolean>;
  
  // Tournament match methods
  createTournamentMatch(matchData: InsertTournamentMatch): Promise<TournamentMatch>;
  getTournamentMatch(id: number): Promise<TournamentMatch | undefined>;
  getTournamentMatches(tournamentId: number): Promise<(TournamentMatch & { match: Match, venue?: Venue })[]>;
  updateTournamentMatch(id: number, data: Partial<TournamentMatch>): Promise<TournamentMatch | undefined>;
  deleteTournamentMatch(id: number): Promise<boolean>;
  
  // Tournament standings methods
  createTournamentStanding(standingData: InsertTournamentStanding): Promise<TournamentStanding>;
  getTournamentStanding(id: number): Promise<TournamentStanding | undefined>;
  getTournamentStandingByTeam(tournamentId: number, teamId: number): Promise<TournamentStanding | undefined>;
  getTournamentStandingsByTournament(tournamentId: number): Promise<TournamentStanding[]>;
  updateTournamentStanding(id: number, data: Partial<TournamentStanding>): Promise<TournamentStanding | undefined>;
  deleteTournamentStanding(id: number): Promise<boolean>;
  
  // Tournament match queries
  getTournamentMatchesByTournament(tournamentId: number): Promise<TournamentMatch[]>;
  
  // Player tournament stats methods
  createPlayerTournamentStats(statsData: InsertPlayerTournamentStats): Promise<PlayerTournamentStats>;
  getPlayerTournamentStats(tournamentId: number, userId: number): Promise<PlayerTournamentStats | undefined>;
  getAllPlayerTournamentStats(tournamentId: number): Promise<(PlayerTournamentStats & { user: User })[]>;
  getPlayerTournamentStatsByTournament(tournamentId: number): Promise<PlayerTournamentStats[]>;
  updatePlayerTournamentStats(tournamentId: number, userId: number, data: Partial<PlayerTournamentStats>): Promise<PlayerTournamentStats | undefined>;
  
  // Poll methods
  createPoll(poll: InsertPoll): Promise<Poll>;
  getPoll(id: number): Promise<(Poll & { options: PollOption[], creator: User }) | undefined>;
  getPolls(limit?: number, type?: string): Promise<(Poll & { options: PollOption[], creator: User })[]>;
  getUserPolls(userId: number): Promise<(Poll & { options: PollOption[] })[]>;
  updatePoll(id: number, data: Partial<Poll>): Promise<Poll | undefined>;
  deletePoll(id: number): Promise<boolean>;
  
  // Poll option methods
  createPollOption(option: InsertPollOption): Promise<PollOption>;
  getPollOption(id: number): Promise<PollOption | undefined>;
  getPollOptions(pollId: number): Promise<PollOption[]>;
  updatePollOption(id: number, data: Partial<PollOption>): Promise<PollOption | undefined>;
  deletePollOption(id: number): Promise<boolean>;
  
  // Poll vote methods
  createPollVote(vote: InsertPollVote): Promise<PollVote>;
  getUserVote(userId: number, pollId: number): Promise<PollVote | undefined>;
  getPollVotes(pollId: number): Promise<(PollVote & { user: User })[]>;
  getPollResults(pollId: number): Promise<{ optionId: number, option: string, count: number, percentage: number }[]>;
  deletePollVote(userId: number, pollId: number): Promise<boolean>;
  
  // Enhanced Social Graph methods
  // Relationship management
  createUserRelationship(relationship: InsertUserRelationship): Promise<UserRelationship>;
  deleteUserRelationship(userId: number, targetUserId: number, relationshipType: string): Promise<boolean>;
  getUserRelationships(userId: number, relationshipType?: string): Promise<UserRelationship[]>;
  getRelationshipStatus(userId1: number, userId2: number): Promise<string>;
  
  // Follow requests
  createFollowRequest(request: InsertFollowRequest): Promise<FollowRequest>;
  updateFollowRequest(requestId: number, status: string): Promise<FollowRequest | undefined>;
  getFollowRequest(requesterId: number, requestedId: number): Promise<FollowRequest | undefined>;
  getPendingFollowRequestsForUser(userId: number): Promise<(FollowRequest & { requester: User })[]>;
  getSentFollowRequests(userId: number): Promise<(FollowRequest & { requested: User })[]>;
  
  // Privacy settings
  createUserPrivacySettings(settings: InsertUserPrivacySettings): Promise<UserPrivacySettings>;
  getUserPrivacySettings(userId: number): Promise<UserPrivacySettings | undefined>;
  updateUserPrivacySettings(userId: number, settings: Partial<UserPrivacySettings>): Promise<UserPrivacySettings | undefined>;
  
  // Close friends
  addCloseFriend(closeFriend: InsertCloseFriend): Promise<CloseFriend>;
  removeCloseFriend(userId: number, friendId: number): Promise<boolean>;
  getCloseFriends(userId: number): Promise<User[]>;
  isCloseFriend(userId: number, friendId: number): Promise<boolean>;
  
  // User restrictions (blocking, muting, restricting)
  createUserRestriction(restriction: InsertUserRestriction): Promise<UserRestriction>;
  removeUserRestriction(restricterId: number, restrictedId: number, restrictionType: string): Promise<boolean>;
  getUserRestrictions(userId: number, restrictionType?: string): Promise<UserRestriction[]>;
  isUserRestricted(restricterId: number, restrictedId: number, restrictionType: string): Promise<boolean>;
  
  // Session store for authentication
  sessionStore: any; // Fixed to work with various session store types
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private likes: Map<number, Like>;
  private comments: Map<number, Comment>;
  private follows: Map<number, Follow>;
  private blockedUsers: Map<number, BlockedUser>;
  private notifications: Map<number, Notification>;
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  private stories: Map<number, Story>;
  private playerStats: Map<number, PlayerStats>;
  private playerMatches: Map<number, PlayerMatch>;
  private playerMatchPerformances: Map<number, PlayerMatchPerformance>;
  private playerTournamentStats: Map<string, PlayerTournamentStats>; // Composite key: `${tournamentId}-${userId}`
  private tokens: Map<number, Token>;
  private matches: Map<number, Match>;
  private teams: Map<number, Team>;
  private matchPlayers: Map<number, MatchPlayer>;
  private ballByBalls: Map<number, BallByBall>;
  private tags: Map<number, Tag>;
  private postTags: Map<string, PostTag>; // Composite key: `${postId}-${tagId}`
  private contentCategories: Map<number, ContentCategory>;
  private userInterests: Map<string, UserInterest>; // Composite key: `${userId}-${tagId}`
  private contentEngagements: Map<number, ContentEngagement>;
  private venues: Map<number, Venue>;
  private venueAvailabilities: Map<number, VenueAvailability>;
  private venueBookings: Map<number, VenueBooking>;
  private tournaments: Map<number, Tournament>;
  private tournamentTeams: Map<string, TournamentTeam>; // Composite key: `${tournamentId}-${teamId}`
  private tournamentMatches: Map<number, TournamentMatch>;
  private tournamentStandings: Map<number, TournamentStanding>;
  private polls: Map<number, Poll>;
  private pollOptions: Map<number, PollOption>;
  private pollVotes: Map<string, PollVote>; // Composite key: `${userId}-${pollId}`
  private storyViews: Map<number, StoryView>;
  private storyReactions: Map<number, StoryReaction>;
  private storyComments: Map<number, StoryComment>;
  private savedPosts: Map<string, SavedPost>; // Composite key: `${userId}-${postId}`
  private commentLikes: Map<string, CommentLike>; // Composite key: `${userId}-${commentId}`
  private postSharesMap: Map<number, PostShare>;
  
  userCurrentId: number;
  postCurrentId: number;
  likeCurrentId: number;
  commentCurrentId: number;
  followCurrentId: number;
  blockedUserCurrentId: number;
  notificationCurrentId: number;
  conversationCurrentId: number;
  messageCurrentId: number;
  storyCurrentId: number;
  playerStatsCurrentId: number;
  playerMatchCurrentId: number;
  playerMatchPerformanceCurrentId: number;
  tokenCurrentId: number;
  matchCurrentId: number;
  teamCurrentId: number;
  matchPlayerCurrentId: number;
  ballByBallCurrentId: number;
  tagCurrentId: number;
  contentCategoryCurrentId: number;
  contentEngagementCurrentId: number;
  venueCurrentId: number;
  venueAvailabilityCurrentId: number;
  venueBookingCurrentId: number;
  tournamentCurrentId: number;
  tournamentMatchCurrentId: number;
  tournamentStandingCurrentId: number;
  pollCurrentId: number;
  pollOptionCurrentId: number;
  pollVoteCurrentId: number;
  storyViewCurrentId: number;
  storyReactionCurrentId: number;
  storyCommentCurrentId: number;
  savedPostCurrentId: number;
  commentLikeCurrentId: number;
  postShareCurrentId: number;
  sessionStore: any;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.likes = new Map();
    this.comments = new Map();
    this.follows = new Map();
    this.blockedUsers = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.stories = new Map();
    this.storyViews = new Map();
    this.storyReactions = new Map();
    this.storyComments = new Map();
    this.playerStats = new Map();
    this.playerMatches = new Map();
    this.playerMatchPerformances = new Map();
    this.playerTournamentStats = new Map();
    this.tokens = new Map();
    this.matches = new Map();
    this.teams = new Map();
    this.matchPlayers = new Map();
    this.ballByBalls = new Map();
    this.tags = new Map();
    this.postTags = new Map();
    this.notifications = new Map();
    this.contentCategories = new Map();
    this.userInterests = new Map();
    this.contentEngagements = new Map();
    this.venues = new Map();
    this.venueAvailabilities = new Map();
    this.venueBookings = new Map();
    this.tournaments = new Map();
    this.tournamentTeams = new Map();
    this.tournamentMatches = new Map();
    this.tournamentStandings = new Map();
    this.polls = new Map();
    this.pollOptions = new Map();
    this.pollVotes = new Map();
    this.savedPosts = new Map();
    this.commentLikes = new Map();
    this.postSharesMap = new Map();
    
    this.userCurrentId = 1;
    this.postCurrentId = 1;
    this.likeCurrentId = 1;
    this.commentCurrentId = 1;
    this.followCurrentId = 1;
    this.blockedUserCurrentId = 1;
    this.notificationCurrentId = 1;
    this.conversationCurrentId = 1;
    this.messageCurrentId = 1;
    this.storyCurrentId = 1;
    this.playerStatsCurrentId = 1;
    this.playerMatchCurrentId = 1;
    this.playerMatchPerformanceCurrentId = 1;
    this.tokenCurrentId = 1;
    this.matchCurrentId = 1;
    this.teamCurrentId = 1;
    this.matchPlayerCurrentId = 1;
    this.ballByBallCurrentId = 1;
    this.tagCurrentId = 1;
    this.contentCategoryCurrentId = 1;
    this.contentEngagementCurrentId = 1;
    this.venueCurrentId = 1;
    this.venueAvailabilityCurrentId = 1;
    this.venueBookingCurrentId = 1;
    this.tournamentCurrentId = 1;
    this.tournamentMatchCurrentId = 1;
    this.tournamentStandingCurrentId = 1;
    this.pollCurrentId = 1;
    this.pollOptionCurrentId = 1;
    this.pollVoteCurrentId = 1;
    this.storyViewCurrentId = 1;
    this.storyReactionCurrentId = 1;
    this.storyCommentCurrentId = 1;
    this.savedPostCurrentId = 1;
    this.commentLikeCurrentId = 1;
    this.postShareCurrentId = 1;
    this.pollVoteCurrentId = 1;
    this.storyViewCurrentId = 1;
    this.storyReactionCurrentId = 1;
    this.storyCommentCurrentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }
  
  // Token methods
  async createToken(insertToken: InsertToken): Promise<Token> {
    const id = this.tokenCurrentId++;
    const token: Token = {
      id,
      userId: insertToken.userId,
      token: insertToken.token,
      type: insertToken.type,
      expiresAt: insertToken.expiresAt,
      createdAt: new Date()
    };
    this.tokens.set(id, token);
    return token;
  }
  
  async getTokenByToken(tokenString: string): Promise<Token | undefined> {
    return Array.from(this.tokens.values()).find(
      token => token.token === tokenString
    );
  }
  
  async deleteToken(id: number): Promise<boolean> {
    return this.tokens.delete(id);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { 
      id,
      username: insertUser.username,
      email: insertUser.email,
      password: insertUser.password,
      fullName: insertUser.fullName ?? null,
      bio: insertUser.bio ?? null,
      location: insertUser.location ?? null,
      profileImage: insertUser.profileImage ?? null,
      isPlayer: insertUser.isPlayer ?? false,
      isCoach: (insertUser as any).isCoach ?? false,
      isAdmin: (insertUser as any).isAdmin ?? false,
      isFan: (insertUser as any).isFan ?? true,
      preferredRole: (insertUser as any).preferredRole ?? null,
      battingStyle: (insertUser as any).battingStyle ?? null,
      bowlingStyle: (insertUser as any).bowlingStyle ?? null,
      favoriteTeam: (insertUser as any).favoriteTeam ?? null,
      favoritePlayer: (insertUser as any).favoritePlayer ?? null,
      emailVerified: (insertUser as any).emailVerified ?? false,
      phoneNumber: (insertUser as any).phoneNumber ?? null,
      phoneVerified: (insertUser as any).phoneVerified ?? false,
      verificationBadge: (insertUser as any).verificationBadge ?? false,
      registrationMethod: (insertUser as any).registrationMethod ?? 'email',
      lastLoginAt: (insertUser as any).lastLoginAt ?? null,
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Post methods
  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = this.postCurrentId++;
    const post: Post = {
      id,
      userId: insertPost.userId,
      content: insertPost.content || null,
      imageUrl: insertPost.imageUrl || null,
      videoUrl: insertPost.videoUrl || null,
      thumbnailUrl: insertPost.thumbnailUrl || null,
      duration: insertPost.duration || null,
      location: insertPost.location || null,
      category: insertPost.category || null,
      matchId: insertPost.matchId || null,
      teamId: insertPost.teamId || null,
      playerId: insertPost.playerId || null,
      createdAt: new Date()
    };
    this.posts.set(id, post);
    return post;
  }
  
  async getPost(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }
  
  async getUserPosts(userId: number): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }
  
  async getFeed(userId: number, limit: number = 10): Promise<(Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean })[]> {
    // Get accepted following relationships only
    const followingIds = Array.from(this.follows.values())
      .filter(follow => follow.followerId === userId && follow.status === "accepted")
      .map(follow => follow.followingId);
    
    // Include user's own posts
    followingIds.push(userId);
    
    // Get posts from following users, but filter out private accounts that user doesn't follow
    const feedPosts = Array.from(this.posts.values())
      .filter(async post => {
        // Always include own posts
        if (post.userId === userId) return true;
        
        // Check if post author is private
        const postAuthor = await this.getUser(post.userId);
        if (!postAuthor) return false;
        
        // If author is private, only show if user follows them
        if (postAuthor.isPrivate) {
          return followingIds.includes(post.userId);
        }
        
        // For public accounts, show if following or if it's a public post
        return followingIds.includes(post.userId);
      })
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
    
    // Filter posts synchronously since we can't use async in filter
    const validPosts = [];
    for (const post of Array.from(this.posts.values())) {
      // Always include own posts
      if (post.userId === userId) {
        validPosts.push(post);
        continue;
      }
      
      // Check if post author is private
      const postAuthor = await this.getUser(post.userId);
      if (!postAuthor) continue;
      
      // If author is private, only show if user follows them
      if (postAuthor.isPrivate) {
        if (followingIds.includes(post.userId)) {
          validPosts.push(post);
        }
      } else {
        // For public accounts, show if following
        if (followingIds.includes(post.userId)) {
          validPosts.push(post);
        }
      }
    }
    
    const sortedPosts = validPosts
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
    
    // Enrich post data
    return Promise.all(sortedPosts.map(async post => {
      const user = await this.getUser(post.userId) as User;
      const likes = await this.getLikesForPost(post.id);
      const comments = await this.getCommentsForPost(post.id);
      const hasLiked = !!(await this.getLike(userId, post.id));
      
      return {
        ...post,
        user,
        likeCount: likes.length,
        commentCount: comments.length,
        hasLiked
      };
    }));
  }
  
  async deletePost(id: number): Promise<boolean> {
    return this.posts.delete(id);
  }

  async getReels(userId: number, limit: number = 20): Promise<(Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean })[]> {
    // Get following IDs
    const followingIds = Array.from(this.follows.values())
      .filter(follow => follow.followerId === userId)
      .map(follow => follow.followingId);
    
    // Include user's own reels
    followingIds.push(userId);
    
    // Get reels (posts with videoUrl OR reel categories)
    const reelCategories = ['reel', 'match_highlight', 'player_moment', 'training', 'fan_moment'];
    const reelPosts = Array.from(this.posts.values())
      .filter(post => 
        post.videoUrl && 
        post.videoUrl.trim() !== '' &&
        followingIds.includes(post.userId)
      )
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
    
    // Enrich post data
    return Promise.all(reelPosts.map(async post => {
      const user = await this.getUser(post.userId) as User;
      const likes = await this.getLikesForPost(post.id);
      const comments = await this.getCommentsForPost(post.id);
      const hasLiked = !!(await this.getLike(userId, post.id));
      
      return {
        ...post,
        user,
        likeCount: likes.length,
        commentCount: comments.length,
        hasLiked
      };
    }));
  }

  // Like methods
  async likePost(insertLike: InsertLike): Promise<Like> {
    // Check if like already exists
    const existingLike = await this.getLike(insertLike.userId, insertLike.postId);
    if (existingLike) return existingLike;
    
    const id = this.likeCurrentId++;
    const like: Like = {
      id,
      userId: insertLike.userId,
      postId: insertLike.postId,
      reactionType: insertLike.reactionType || 'like',
      createdAt: new Date()
    };
    this.likes.set(id, like);
    return like;
  }
  
  async unlikePost(userId: number, postId: number): Promise<boolean> {
    const like = await this.getLike(userId, postId);
    if (!like) return false;
    
    return this.likes.delete(like.id);
  }
  
  async getLike(userId: number, postId: number): Promise<Like | undefined> {
    return Array.from(this.likes.values()).find(
      like => like.userId === userId && like.postId === postId
    );
  }
  
  async getLikesForPost(postId: number): Promise<Like[]> {
    return Array.from(this.likes.values()).filter(like => like.postId === postId);
  }

  // Comment methods
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.commentCurrentId++;
    const comment: Comment = {
      id,
      userId: insertComment.userId,
      postId: insertComment.postId,
      content: insertComment.content,
      parentId: insertComment.parentId || null,
      createdAt: new Date()
    };
    this.comments.set(id, comment);
    return comment;
  }
  
  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }
  
  async getCommentsForPost(postId: number): Promise<(Comment & { user: User, likeCount: number, replyCount: number, hasLiked: boolean })[]> {
    // Get only top-level comments (no parentId)
    const postComments = Array.from(this.comments.values())
      .filter(comment => comment.postId === postId && !comment.parentId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    
    return Promise.all(postComments.map(async comment => {
      const user = await this.getUser(comment.userId) as User;
      const likeCount = await this.getCommentLikesCount(comment.id);
      const replyCount = Array.from(this.comments.values())
        .filter(c => c.parentId === comment.id).length;
      const hasLiked = false; // Will be set by the route based on current user
      return { ...comment, user, likeCount, replyCount, hasLiked };
    }));
  }
  
  async getRepliesForComment(commentId: number): Promise<(Comment & { user: User, likeCount: number, hasLiked: boolean })[]> {
    const replies = Array.from(this.comments.values())
      .filter(comment => comment.parentId === commentId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
    
    return Promise.all(replies.map(async comment => {
      const user = await this.getUser(comment.userId) as User;
      const likeCount = await this.getCommentLikesCount(comment.id);
      const hasLiked = false; // Will be set by the route based on current user
      return { ...comment, user, likeCount, hasLiked };
    }));
  }
  
  async deleteComment(id: number): Promise<boolean> {
    // Also delete all replies to this comment
    const replies = Array.from(this.comments.values())
      .filter(c => c.parentId === id);
    for (const reply of replies) {
      this.comments.delete(reply.id);
      // Delete likes for the reply
      for (const [key, like] of this.commentLikes.entries()) {
        if (like.commentId === reply.id) {
          this.commentLikes.delete(key);
        }
      }
    }
    // Delete likes for the comment
    for (const [key, like] of this.commentLikes.entries()) {
      if (like.commentId === id) {
        this.commentLikes.delete(key);
      }
    }
    return this.comments.delete(id);
  }

  async updateComment(id: number, data: Partial<Comment>): Promise<Comment | undefined> {
    const comment = this.comments.get(id);
    if (!comment) return undefined;
    const updated = { ...comment, ...data };
    this.comments.set(id, updated);
    return updated;
  }

  async unpinAllComments(postId: number): Promise<boolean> {
    for (const [id, comment] of this.comments.entries()) {
      if (comment.postId === postId && comment.isPinned) {
        this.comments.set(id, { ...comment, isPinned: false });
      }
    }
    return true;
  }
  
  // Comment like methods
  async likeComment(insertLike: InsertCommentLike): Promise<CommentLike> {
    const key = `${insertLike.userId}-${insertLike.commentId}`;
    const existing = this.commentLikes.get(key);
    if (existing) return existing;
    
    const id = this.commentLikeCurrentId++;
    const like: CommentLike = {
      id,
      userId: insertLike.userId,
      commentId: insertLike.commentId,
      createdAt: new Date()
    };
    this.commentLikes.set(key, like);
    return like;
  }
  
  async unlikeComment(userId: number, commentId: number): Promise<boolean> {
    const key = `${userId}-${commentId}`;
    return this.commentLikes.delete(key);
  }
  
  async getCommentLike(userId: number, commentId: number): Promise<CommentLike | undefined> {
    const key = `${userId}-${commentId}`;
    return this.commentLikes.get(key);
  }
  
  async getCommentLikesCount(commentId: number): Promise<number> {
    return Array.from(this.commentLikes.values())
      .filter(like => like.commentId === commentId).length;
  }
  
  // Saved posts methods
  async savePost(insertSave: InsertSavedPost): Promise<SavedPost> {
    const key = `${insertSave.userId}-${insertSave.postId}`;
    const existing = this.savedPosts.get(key);
    if (existing) return existing;
    
    const id = this.savedPostCurrentId++;
    const save: SavedPost = {
      id,
      userId: insertSave.userId,
      postId: insertSave.postId,
      createdAt: new Date()
    };
    this.savedPosts.set(key, save);
    return save;
  }
  
  async unsavePost(userId: number, postId: number): Promise<boolean> {
    const key = `${userId}-${postId}`;
    return this.savedPosts.delete(key);
  }
  
  async getSavedPost(userId: number, postId: number): Promise<SavedPost | undefined> {
    const key = `${userId}-${postId}`;
    return this.savedPosts.get(key);
  }
  
  async getUserSavedPosts(userId: number): Promise<(Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean })[]> {
    const userSaves = Array.from(this.savedPosts.values())
      .filter(save => save.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    
    const posts: (Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean })[] = [];
    
    for (const save of userSaves) {
      const post = await this.getPost(save.postId);
      if (post) {
        const user = await this.getUser(post.userId) as User;
        const likes = await this.getLikesForPost(post.id);
        const comments = await this.getCommentsForPost(post.id);
        const hasLiked = !!(await this.getLike(userId, post.id));
        posts.push({
          ...post,
          user,
          likeCount: likes.length,
          commentCount: comments.length,
          hasLiked
        });
      }
    }
    
    return posts;
  }
  
  async getUserTaggedPosts(userId: number): Promise<(Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean })[]> {
    // MemStorage doesn't track post mentions, return empty array
    // Real implementation is in DatabaseStorage
    return [];
  }
  
  // Post share methods
  async createPostShare(insertShare: InsertPostShare): Promise<PostShare> {
    const id = this.postShareCurrentId++;
    const share: PostShare = {
      id,
      userId: insertShare.userId,
      postId: insertShare.postId,
      shareType: insertShare.shareType,
      recipientId: insertShare.recipientId || null,
      platform: insertShare.platform || null,
      createdAt: new Date()
    };
    this.postSharesMap.set(id, share);
    return share;
  }
  
  async getPostShares(postId: number): Promise<PostShare[]> {
    return Array.from(this.postSharesMap.values())
      .filter(share => share.postId === postId);
  }
  
  async getPostShareCount(postId: number): Promise<number> {
    return Array.from(this.postSharesMap.values())
      .filter(share => share.postId === postId).length;
  }

  // Follow methods
  async followUser(insertFollow: InsertFollow): Promise<Follow> {
    // Check if already following or has pending request
    const existingFollow = Array.from(this.follows.values()).find(
      f => f.followerId === insertFollow.followerId && f.followingId === insertFollow.followingId
    );
    
    if (existingFollow) {
      return existingFollow;
    }
    
    const id = this.followCurrentId++;
    const follow: Follow = {
      id,
      followerId: insertFollow.followerId,
      followingId: insertFollow.followingId,
      status: insertFollow.status || "accepted", // Default to accepted for backward compatibility
      createdAt: new Date(),
      acceptedAt: insertFollow.status === "accepted" ? new Date() : null
    };
    this.follows.set(id, follow);
    return follow;
  }
  
  async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    const follow = Array.from(this.follows.values()).find(
      f => f.followerId === followerId && f.followingId === followingId
    );
    
    if (!follow) return false;
    
    // Delete the follow relationship - NO notification sent (silent action)
    return this.follows.delete(follow.id);
  }
  
  // Remove a follower from your account (silent action - no notification)
  async removeFollower(userId: number, followerIdToRemove: number): Promise<boolean> {
    const follow = Array.from(this.follows.values()).find(
      f => f.followerId === followerIdToRemove && f.followingId === userId
    );
    
    if (!follow) return false;
    
    // Delete the follow relationship - NO notification sent (silent action)
    return this.follows.delete(follow.id);
  }
  
  // Cancel a pending follow request (for the requester)
  async cancelFollowRequest(followerId: number, followingId: number): Promise<boolean> {
    const follow = Array.from(this.follows.values()).find(
      f => f.followerId === followerId && f.followingId === followingId && f.status === "pending"
    );
    
    if (!follow) return false;
    
    // Delete the pending request
    return this.follows.delete(follow.id);
  }
  
  async getFollowers(userId: number): Promise<User[]> {
    const followerIds = Array.from(this.follows.values())
      .filter(follow => follow.followingId === userId && follow.status === "accepted")
      .map(follow => follow.followerId);
    
    const users = await Promise.all(followerIds.map(id => this.getUser(id)));
    return users.filter((user): user is User => user !== undefined);
  }
  
  async getFollowing(userId: number): Promise<User[]> {
    const followingIds = Array.from(this.follows.values())
      .filter(follow => follow.followerId === userId && follow.status === "accepted")
      .map(follow => follow.followingId);
    
    const users = await Promise.all(followingIds.map(id => this.getUser(id)));
    return users.filter((user): user is User => user !== undefined);
  }
  
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    return !!Array.from(this.follows.values()).find(
      follow => follow.followerId === followerId && 
                follow.followingId === followingId && 
                follow.status === "accepted"
    );
  }
  
  // Follow request methods
  async sendFollowRequest(followerId: number, followingId: number): Promise<Follow> {
    // Check if already following or has pending request
    const existingFollow = Array.from(this.follows.values()).find(
      f => f.followerId === followerId && f.followingId === followingId
    );
    
    if (existingFollow) {
      return existingFollow;
    }
    
    // Check if blocked in either direction
    const isBlockedByTarget = await this.isBlocked(followingId, followerId);
    const hasBlockedTarget = await this.isBlocked(followerId, followingId);
    
    if (isBlockedByTarget || hasBlockedTarget) {
      throw new Error("Cannot follow this user");
    }
    
    // Check if target user is private
    const targetUser = await this.getUser(followingId);
    const status = targetUser?.isPrivate ? "pending" : "accepted";
    
    const id = this.followCurrentId++;
    const follow: Follow = {
      id,
      followerId,
      followingId,
      status,
      createdAt: new Date(),
      acceptedAt: status === "accepted" ? new Date() : null
    };
    this.follows.set(id, follow);
    return follow;
  }
  
  async acceptFollowRequest(followId: number): Promise<Follow | null> {
    const follow = this.follows.get(followId);
    if (!follow || follow.status !== "pending") {
      return null;
    }
    
    follow.status = "accepted";
    follow.acceptedAt = new Date();
    this.follows.set(followId, follow);
    return follow;
  }
  
  async rejectFollowRequest(followId: number): Promise<boolean> {
    const follow = this.follows.get(followId);
    if (!follow || follow.status !== "pending") {
      return false;
    }
    
    // Delete the request completely - NO notification sent (silent action)
    return this.follows.delete(followId);
  }
  
  // Get follow by follower and following IDs
  async getFollowByUsers(followerId: number, followingId: number): Promise<Follow | undefined> {
    return Array.from(this.follows.values()).find(
      f => f.followerId === followerId && f.followingId === followingId
    );
  }
  
  // Check if two users mutually follow each other
  async isMutualFollow(userId1: number, userId2: number): Promise<boolean> {
    const user1FollowsUser2 = await this.isFollowing(userId1, userId2);
    const user2FollowsUser1 = await this.isFollowing(userId2, userId1);
    return user1FollowsUser2 && user2FollowsUser1;
  }
  
  // Get mutual followers (users who follow each other)
  async getMutualFollowers(userId: number): Promise<User[]> {
    const followers = await this.getFollowers(userId);
    const following = await this.getFollowing(userId);
    
    const followingIds = new Set(following.map(u => u.id));
    return followers.filter(follower => followingIds.has(follower.id));
  }

  // Get mutual friends (users that both users follow)
  async getMutualFriends(userId1: number, userId2: number): Promise<User[]> {
    const user1Following = await this.getFollowing(userId1);
    const user2Following = await this.getFollowing(userId2);
    
    const user2FollowingIds = new Set(user2Following.map(u => u.id));
    return user1Following.filter(u => 
      user2FollowingIds.has(u.id) && 
      u.id !== userId1 && 
      u.id !== userId2
    );
  }
  
  async getPendingFollowRequests(userId: number): Promise<(Follow & { follower: User })[]> {
    const pendingRequests = Array.from(this.follows.values())
      .filter(follow => follow.followingId === userId && follow.status === "pending");
    
    const requestsWithUsers = await Promise.all(
      pendingRequests.map(async (follow) => {
        const follower = await this.getUser(follow.followerId);
        if (!follower) return null;
        return { ...follow, follower };
      })
    );
    
    // Filter out null entries (where follower was not found)
    return requestsWithUsers.filter((req): req is (Follow & { follower: User }) => req !== null);
  }
  
  async getFollowRequestStatus(followerId: number, followingId: number): Promise<string | null> {
    const follow = Array.from(this.follows.values()).find(
      f => f.followerId === followerId && f.followingId === followingId
    );
    
    return follow ? follow.status : null;
  }
  
  async getSuggestedUsers(userId: number, limit: number = 20): Promise<User[]> {
    const following = await this.getFollowing(userId);
    const followingIds = new Set(following.map(u => u.id));
    followingIds.add(userId);
    
    return Array.from(this.users.values())
      .filter(u => !followingIds.has(u.id))
      .slice(0, limit);
  }

  // Notification methods
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationCurrentId++;
    const notification: Notification = {
      id,
      userId: insertNotification.userId,
      fromUserId: insertNotification.fromUserId || null,
      type: insertNotification.type,
      title: insertNotification.title,
      message: insertNotification.message,
      entityType: insertNotification.entityType || null,
      entityId: insertNotification.entityId || null,
      imageUrl: insertNotification.imageUrl || null,
      actionUrl: insertNotification.actionUrl || null,
      isRead: false,
      createdAt: new Date()
    };
    this.notifications.set(id, notification);
    return notification;
  }
  
  async getUserNotifications(userId: number, limit: number = 50): Promise<(Notification & { fromUser?: User })[]> {
    const userNotifications = Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    const notificationsWithUsers = await Promise.all(
      userNotifications.map(async (notification) => {
        if (notification.fromUserId) {
          const fromUser = await this.getUser(notification.fromUserId);
          return { ...notification, fromUser };
        }
        return notification;
      })
    );
    
    return notificationsWithUsers;
  }
  
  async markNotificationAsRead(notificationId: number): Promise<boolean> {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;
    
    notification.isRead = true;
    this.notifications.set(notificationId, notification);
    return true;
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const userNotifications = Array.from(this.notifications.values())
      .filter(n => n.userId === userId && !n.isRead);
    
    userNotifications.forEach(notification => {
      notification.isRead = true;
      this.notifications.set(notification.id, notification);
    });
    
    return true;
  }
  
  async getUnreadNotificationCount(userId: number): Promise<number> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId && !n.isRead).length;
  }
  
  async deleteNotification(notificationId: number): Promise<boolean> {
    return this.notifications.delete(notificationId);
  }

  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.users.values())
      .filter(u => 
        u.username.toLowerCase().includes(lowercaseQuery) || 
        (u.fullName && u.fullName.toLowerCase().includes(lowercaseQuery))
      )
      .slice(0, limit);
  }
  
  // Block methods
  async blockUser(insertBlock: InsertBlockedUser): Promise<BlockedUser> {
    // Check if already blocked
    const isAlreadyBlocked = await this.isBlocked(
      insertBlock.blockerId, 
      insertBlock.blockedId
    );
    
    if (isAlreadyBlocked) {
      return Array.from(this.blockedUsers.values()).find(
        b => b.blockerId === insertBlock.blockerId && b.blockedId === insertBlock.blockedId
      ) as BlockedUser;
    }
    
    const id = this.blockedUserCurrentId++;
    const block: BlockedUser = {
      id,
      blockerId: insertBlock.blockerId,
      blockedId: insertBlock.blockedId,
      createdAt: new Date()
    };
    this.blockedUsers.set(id, block);
    
    // When a user blocks someone:
    // 1. Remove follow relationships in both directions (including pending)
    // 2. NO notification sent (silent action)
    
    // Remove any follow from blocker to blocked (accepted or pending)
    const blockerFollow = Array.from(this.follows.values()).find(
      f => f.followerId === insertBlock.blockerId && f.followingId === insertBlock.blockedId
    );
    if (blockerFollow) {
      this.follows.delete(blockerFollow.id);
    }
    
    // Remove any follow from blocked to blocker (accepted or pending)
    const blockedFollow = Array.from(this.follows.values()).find(
      f => f.followerId === insertBlock.blockedId && f.followingId === insertBlock.blockerId
    );
    if (blockedFollow) {
      this.follows.delete(blockedFollow.id);
    }
    
    // Remove any pending follow requests in both directions
    // (These are already handled above since we check all statuses)
    
    return block;
  }
  
  async unblockUser(blockerId: number, blockedId: number): Promise<boolean> {
    const block = Array.from(this.blockedUsers.values()).find(
      b => b.blockerId === blockerId && b.blockedId === blockedId
    );
    
    if (!block) return false;
    return this.blockedUsers.delete(block.id);
  }
  
  async isBlocked(blockerId: number, blockedId: number): Promise<boolean> {
    return !!Array.from(this.blockedUsers.values()).find(
      block => block.blockerId === blockerId && block.blockedId === blockedId
    );
  }
  
  async getBlockedUsers(userId: number): Promise<User[]> {
    const blockedIds = Array.from(this.blockedUsers.values())
      .filter(block => block.blockerId === userId)
      .map(block => block.blockedId);
    
    return Promise.all(blockedIds.map(id => this.getUser(id))) as Promise<User[]>;
  }

  // Chat methods
  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    // Check if a conversation already exists between these users
    const existingConversation = await this.getConversation(
      insertConversation.user1Id,
      insertConversation.user2Id
    );
    
    if (existingConversation) {
      return existingConversation;
    }
    
    const id = this.conversationCurrentId++;
    const conversation: Conversation = {
      id,
      user1Id: insertConversation.user1Id,
      user2Id: insertConversation.user2Id,
      lastMessageAt: new Date(),
      createdAt: new Date()
    };
    
    this.conversations.set(id, conversation);
    return conversation;
  }
  
  async getConversation(user1Id: number, user2Id: number): Promise<Conversation | undefined> {
    return Array.from(this.conversations.values()).find(
      conv => 
        (conv.user1Id === user1Id && conv.user2Id === user2Id) ||
        (conv.user1Id === user2Id && conv.user2Id === user1Id)
    );
  }
  
  async getConversationById(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }
  
  async getUserConversations(userId: number): Promise<(Conversation & { 
    otherUser: Omit<User, 'password'>, 
    lastMessage: Message | null,
    unreadCount: number 
  })[]> {
    const userConversations = Array.from(this.conversations.values())
      .filter(conv => conv.user1Id === userId || conv.user2Id === userId)
      .sort((a, b) => 
        (b.lastMessageAt?.getTime() || 0) - (a.lastMessageAt?.getTime() || 0)
      );
      
    return Promise.all(userConversations.map(async conv => {
      // Get the other user in the conversation
      const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
      const otherUser = await this.getUser(otherUserId) as User;
      const { password, ...otherUserWithoutPassword } = otherUser;
      
      // Get latest message
      const conversationMessages = Array.from(this.messages.values())
        .filter(msg => msg.conversationId === conv.id)
        .sort((a, b) => 
          (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
        );
        
      const lastMessage = conversationMessages.length > 0 ? conversationMessages[0] : null;
      
      // Count unread messages
      const unreadCount = conversationMessages.filter(
        msg => msg.senderId !== userId && !msg.read
      ).length;
      
      return {
        ...conv,
        otherUser: otherUserWithoutPassword,
        lastMessage,
        unreadCount
      };
    }));
  }
  
  // Message methods
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageCurrentId++;
    const message: Message = {
      id,
      conversationId: insertMessage.conversationId,
      senderId: insertMessage.senderId,
      content: insertMessage.content,
      messageType: insertMessage.messageType || "text",
      mediaUrl: insertMessage.mediaUrl || null,
      read: insertMessage.read || false,
      createdAt: new Date()
    };
    
    this.messages.set(id, message);
    
    // Update conversation's lastMessageAt
    const conversation = await this.getConversationById(insertMessage.conversationId);
    if (conversation) {
      conversation.lastMessageAt = new Date();
      this.conversations.set(conversation.id, conversation);
    }
    
    return message;
  }
  
  async getConversationMessages(conversationId: number): Promise<(Message & { sender: Omit<User, 'password'> })[]> {
    const conversationMessages = Array.from(this.messages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => 
        (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)
      );
      
    return Promise.all(conversationMessages.map(async message => {
      const sender = await this.getUser(message.senderId) as User;
      const { password, ...senderWithoutPassword } = sender;
      
      return {
        ...message,
        sender: senderWithoutPassword
      };
    }));
  }
  
  async markMessagesAsRead(conversationId: number, userId: number): Promise<boolean> {
    let updated = false;
    
    // Get all unread messages in the conversation that were not sent by the user
    const unreadMessages = Array.from(this.messages.values())
      .filter(msg => 
        msg.conversationId === conversationId && 
        msg.senderId !== userId && 
        !msg.read
      );
      
    // Mark each message as read
    unreadMessages.forEach(message => {
      message.read = true;
      this.messages.set(message.id, message);
      updated = true;
    });
    
    return updated;
  }
  
  async deleteMessage(id: number, userId: number): Promise<boolean> {
    // Fetch the message to verify ownership
    const message = Array.from(this.messages.values()).find(msg => msg.id === id);
    
    // If message not found or user is not the sender, return false
    if (!message || message.senderId !== userId) {
      return false;
    }
    
    // Delete the message
    return this.messages.delete(id);
  }

  // Story methods
  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = this.storyCurrentId++;
    const expiresAt = insertStory.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    const story: Story = {
      id,
      userId: insertStory.userId,
      imageUrl: insertStory.imageUrl || null,
      videoUrl: insertStory.videoUrl || null,
      matchId: insertStory.matchId || null,
      caption: insertStory.caption || null,
      filterId: insertStory.filterId || null,
      effectIds: insertStory.effectIds || null,
      mediaType: insertStory.mediaType || 'image',
      musicTrackId: insertStory.musicTrackId || null,
      isHighlight: insertStory.isHighlight || false,
      viewCount: 0,
      createdAt: new Date(),
      expiresAt
    };
    
    this.stories.set(id, story);
    return story;
  }
  
  async getUserStories(userId: number): Promise<Story[]> {
    // Get unexpired stories
    const now = new Date();
    return Array.from(this.stories.values())
      .filter(story => 
        story.userId === userId && 
        story.expiresAt && 
        new Date(story.expiresAt) > now
      )
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }
  
  async getStoriesForFeed(userId: number): Promise<(Story & { user: User })[]> {
    // Get accepted following relationships only
    const followingIds = Array.from(this.follows.values())
      .filter(follow => follow.followerId === userId && follow.status === "accepted")
      .map(follow => follow.followingId);
    
    // Include user's own stories
    followingIds.push(userId);
    
    // Get unexpired stories from following users, respecting private accounts
    const now = new Date();
    const validStories = [];
    
    for (const story of Array.from(this.stories.values())) {
      // Skip expired stories
      if (!story.expiresAt || new Date(story.expiresAt) <= now) continue;
      
      // Always include own stories
      if (story.userId === userId) {
        validStories.push(story);
        continue;
      }
      
      // Check if story author is private
      const storyAuthor = await this.getUser(story.userId);
      if (!storyAuthor) continue;
      
      // If author is private, only show if user follows them
      if (storyAuthor.isPrivate) {
        if (followingIds.includes(story.userId)) {
          validStories.push(story);
        }
      } else {
        // For public accounts, show if following
        if (followingIds.includes(story.userId)) {
          validStories.push(story);
        }
      }
    }
    
    const sortedStories = validStories
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    
    // Enrich story data with user info
    const enrichedStories = await Promise.all(sortedStories.map(async story => {
      const user = await this.getUser(story.userId);
      if (!user) return null;
      return { ...story, user };
    }));
    
    // Filter out stories where user was not found
    return enrichedStories.filter((story): story is (Story & { user: User }) => story !== null);
  }
  
  async deleteExpiredStories(): Promise<void> {
    const now = new Date();
    const expiredStories = Array.from(this.stories.values())
      .filter(story => story.expiresAt && new Date(story.expiresAt) <= now);
    
    expiredStories.forEach(story => this.stories.delete(story.id));
  }
  
  async getStoryById(storyId: number): Promise<Story | null> {
    const story = this.stories.get(storyId);
    return story || null;
  }
  
  // Story Views methods
  async createStoryView(view: InsertStoryView): Promise<StoryView> {
    const id = this.storyViewCurrentId++;
    
    const storyView: StoryView = {
      id,
      storyId: view.storyId,
      userId: view.userId,
      createdAt: new Date()
    };
    
    this.storyViews.set(id, storyView);
    return storyView;
  }
  
  async incrementStoryViewCount(storyId: number): Promise<Story | null> {
    const story = await this.getStoryById(storyId);
    if (!story) return null;
    
    const updatedStory = { 
      ...story, 
      viewCount: (story.viewCount || 0) + 1 
    };
    
    this.stories.set(storyId, updatedStory);
    return updatedStory;
  }
  
  async hasUserViewedStories(viewerId: number, storyUserId: number): Promise<boolean> {
    // Get all stories from the user
    const userStories = await this.getUserStories(storyUserId);
    if (userStories.length === 0) return false;
    
    // Check if viewer has viewed any of the user's stories
    const storyIds = userStories.map(s => s.id);
    const views = Array.from(this.storyViews.values())
      .filter(view => storyIds.includes(view.storyId) && view.userId === viewerId);
    
    return views.length > 0;
  }
  
  // Story Reactions methods
  async createStoryReaction(reaction: InsertStoryReaction): Promise<StoryReaction> {
    // Check if reaction already exists, update it if it does
    const existingReaction = await this.getStoryReaction(reaction.storyId, reaction.userId);
    if (existingReaction) {
      return await this.updateStoryReaction(existingReaction.id, reaction) as StoryReaction;
    }
    
    const id = this.storyReactionCurrentId++;
    
    const storyReaction: StoryReaction = {
      id,
      storyId: reaction.storyId,
      userId: reaction.userId,
      reactionType: reaction.reactionType,
      createdAt: new Date()
    };
    
    this.storyReactions.set(id, storyReaction);
    return storyReaction;
  }
  
  async getStoryReaction(storyId: number, userId: number): Promise<StoryReaction | null> {
    const reaction = Array.from(this.storyReactions.values()).find(
      reaction => reaction.storyId === storyId && reaction.userId === userId
    );
    
    return reaction || null;
  }
  
  async updateStoryReaction(reactionId: number, data: Partial<InsertStoryReaction>): Promise<StoryReaction | null> {
    const reaction = this.storyReactions.get(reactionId);
    if (!reaction) return null;
    
    const updatedReaction = {
      ...reaction,
      ...data,
      // Don't update id or createdAt
      id: reaction.id,
      createdAt: reaction.createdAt
    };
    
    this.storyReactions.set(reactionId, updatedReaction);
    return updatedReaction;
  }
  
  async deleteStoryReaction(reactionId: number): Promise<void> {
    this.storyReactions.delete(reactionId);
  }
  
  async getStoryReactions(storyId: number): Promise<StoryReaction[]> {
    return Array.from(this.storyReactions.values())
      .filter(reaction => reaction.storyId === storyId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }
  
  // Story Comments methods
  async createStoryComment(comment: InsertStoryComment): Promise<StoryComment> {
    const id = this.storyCommentCurrentId++;
    
    const storyComment: StoryComment = {
      id,
      storyId: comment.storyId,
      userId: comment.userId,
      content: comment.content,
      createdAt: new Date()
    };
    
    this.storyComments.set(id, storyComment);
    return storyComment;
  }
  
  async getStoryComments(storyId: number): Promise<StoryComment[]> {
    return Array.from(this.storyComments.values())
      .filter(comment => comment.storyId === storyId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }
  
  async getStoryCommentById(commentId: number): Promise<StoryComment | null> {
    const comment = this.storyComments.get(commentId);
    return comment || null;
  }
  
  async deleteStoryComment(commentId: number): Promise<void> {
    this.storyComments.delete(commentId);
  }

  // Story Poll methods (stub implementations for MemStorage)
  private storyPolls: Map<number, StoryPoll> = new Map();
  private storyPollVotes: Map<number, StoryPollVote> = new Map();
  private storyPollCurrentId = 1;
  private storyPollVoteCurrentId = 1;

  async createStoryPoll(poll: InsertStoryPoll): Promise<StoryPoll> {
    const id = this.storyPollCurrentId++;
    const storyPoll: StoryPoll = {
      id,
      storyId: poll.storyId,
      question: poll.question,
      option1: poll.option1,
      option2: poll.option2,
      option3: poll.option3 || null,
      option4: poll.option4 || null,
      createdAt: new Date()
    };
    this.storyPolls.set(id, storyPoll);
    return storyPoll;
  }

  async getStoryPoll(storyId: number): Promise<StoryPoll | null> {
    return Array.from(this.storyPolls.values()).find(p => p.storyId === storyId) || null;
  }

  async createStoryPollVote(vote: InsertStoryPollVote): Promise<StoryPollVote> {
    const id = this.storyPollVoteCurrentId++;
    const pollVote: StoryPollVote = {
      id,
      pollId: vote.pollId,
      userId: vote.userId,
      optionNumber: vote.optionNumber,
      createdAt: new Date()
    };
    this.storyPollVotes.set(id, pollVote);
    return pollVote;
  }

  async getStoryPollVotes(pollId: number): Promise<StoryPollVote[]> {
    return Array.from(this.storyPollVotes.values()).filter(v => v.pollId === pollId);
  }

  async getUserStoryPollVote(pollId: number, userId: number): Promise<StoryPollVote | null> {
    return Array.from(this.storyPollVotes.values()).find(v => v.pollId === pollId && v.userId === userId) || null;
  }

  async updateStoryPollVote(voteId: number, optionNumber: number): Promise<StoryPollVote | null> {
    const vote = this.storyPollVotes.get(voteId);
    if (!vote) return null;
    const updated = { ...vote, optionNumber };
    this.storyPollVotes.set(voteId, updated);
    return updated;
  }

  // Story Question methods (stub implementations for MemStorage)
  private storyQuestionsMap: Map<number, StoryQuestion> = new Map();
  private storyQuestionResponsesMap: Map<number, StoryQuestionResponse> = new Map();
  private storyQuestionCurrentId = 1;
  private storyQuestionResponseCurrentId = 1;

  async createStoryQuestion(question: InsertStoryQuestion): Promise<StoryQuestion> {
    const id = this.storyQuestionCurrentId++;
    const storyQuestion: StoryQuestion = {
      id,
      storyId: question.storyId,
      question: question.question,
      createdAt: new Date()
    };
    this.storyQuestionsMap.set(id, storyQuestion);
    return storyQuestion;
  }

  async getStoryQuestion(storyId: number): Promise<StoryQuestion | null> {
    return Array.from(this.storyQuestionsMap.values()).find(q => q.storyId === storyId) || null;
  }

  async createStoryQuestionResponse(response: InsertStoryQuestionResponse): Promise<StoryQuestionResponse> {
    const id = this.storyQuestionResponseCurrentId++;
    const questionResponse: StoryQuestionResponse = {
      id,
      questionId: response.questionId,
      userId: response.userId,
      response: response.response,
      createdAt: new Date()
    };
    this.storyQuestionResponsesMap.set(id, questionResponse);
    return questionResponse;
  }

  async getStoryQuestionResponses(questionId: number): Promise<StoryQuestionResponse[]> {
    return Array.from(this.storyQuestionResponsesMap.values())
      .filter(r => r.questionId === questionId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  // Player Stats methods
  async createPlayerStats(insertStats: InsertPlayerStats): Promise<PlayerStats> {
    const id = this.playerStatsCurrentId++;
    const stats: PlayerStats = {
      id,
      userId: insertStats.userId,
      position: insertStats.position || null,
      battingStyle: insertStats.battingStyle || null,
      bowlingStyle: insertStats.bowlingStyle || null,
      playerOfMatchAwards: insertStats.playerOfMatchAwards || 0,
      highestScoreNotOut: insertStats.highestScoreNotOut || false,
      totalMatches: insertStats.totalMatches || 0,
      totalRuns: insertStats.totalRuns || 0,
      totalWickets: insertStats.totalWickets || 0,
      totalCatches: insertStats.totalCatches || 0,
      totalSixes: insertStats.totalSixes || 0,
      totalFours: insertStats.totalFours || 0,
      highestScore: insertStats.highestScore || 0,
      bestBowling: insertStats.bestBowling || "0/0",
      battingAverage: insertStats.battingAverage || "0",
      bowlingAverage: insertStats.bowlingAverage || "0",
      strikeRate: insertStats.strikeRate || "0",
      economyRate: insertStats.economyRate || "0",
      innings: insertStats.innings || 0,
      notOuts: insertStats.notOuts || 0,
      ballsFaced: insertStats.ballsFaced || 0,
      oversBowled: insertStats.oversBowled || "0",
      runsConceded: insertStats.runsConceded || 0,
      maidens: insertStats.maidens || 0,
      fifties: insertStats.fifties || 0,
      hundreds: insertStats.hundreds || 0,
      totalRunOuts: insertStats.totalRunOuts || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.playerStats.set(id, stats);
    return stats;
  }
  
  async getPlayerStats(userId: number): Promise<PlayerStats | undefined> {
    return Array.from(this.playerStats.values()).find(stats => stats.userId === userId);
  }
  
  async updatePlayerStats(userId: number, statsData: Partial<PlayerStats>): Promise<PlayerStats | undefined> {
    const stats = await this.getPlayerStats(userId);
    if (!stats) return undefined;
    
    const updatedStats = { 
      ...stats, 
      ...statsData,
      updatedAt: new Date()
    };
    this.playerStats.set(stats.id, updatedStats);
    return updatedStats;
  }

  // Player Match methods
  async createPlayerMatch(insertMatch: InsertPlayerMatch): Promise<PlayerMatch> {
    const id = this.playerMatchCurrentId++;
    const match: PlayerMatch = {
      id,
      userId: insertMatch.userId,
      matchName: insertMatch.matchName,
      matchDate: insertMatch.matchDate,
      venue: insertMatch.venue || null,
      opponent: insertMatch.opponent,
      matchType: insertMatch.matchType || null,
      teamScore: insertMatch.teamScore || null,
      opponentScore: insertMatch.opponentScore || null,
      result: insertMatch.result || null,
      createdAt: new Date()
    };
    
    this.playerMatches.set(id, match);
    return match;
  }
  
  async getPlayerMatch(id: number): Promise<PlayerMatch | undefined> {
    return this.playerMatches.get(id);
  }
  
  async getUserMatches(userId: number): Promise<PlayerMatch[]> {
    return Array.from(this.playerMatches.values())
      .filter(match => match.userId === userId)
      .sort((a, b) => (b.matchDate?.getTime() || 0) - (a.matchDate?.getTime() || 0));
  }

  // Player Match Performance methods
  async createPlayerMatchPerformance(insertPerformance: InsertPlayerMatchPerformance): Promise<PlayerMatchPerformance> {
    const id = this.playerMatchPerformanceCurrentId++;
    const performance: PlayerMatchPerformance = {
      id,
      userId: insertPerformance.userId,
      matchId: insertPerformance.matchId,
      runsScored: insertPerformance.runsScored || 0,
      ballsFaced: insertPerformance.ballsFaced || 0,
      fours: insertPerformance.fours || 0,
      sixes: insertPerformance.sixes || 0,
      battingStatus: insertPerformance.battingStatus || null,
      oversBowled: insertPerformance.oversBowled || "0",
      runsConceded: insertPerformance.runsConceded || 0,
      wicketsTaken: insertPerformance.wicketsTaken || 0,
      maidens: insertPerformance.maidens || 0,
      catches: insertPerformance.catches || 0,
      runOuts: insertPerformance.runOuts || 0,
      stumpings: insertPerformance.stumpings || 0,
      createdAt: new Date()
    };
    
    this.playerMatchPerformances.set(id, performance);
    return performance;
  }
  
  async getPlayerMatchPerformance(userId: number, matchId: number): Promise<PlayerMatchPerformance | undefined> {
    return Array.from(this.playerMatchPerformances.values())
      .find(perf => perf.userId === userId && perf.matchId === matchId);
  }
  
  async getMatchPerformances(matchId: number): Promise<(PlayerMatchPerformance & { user: User })[]> {
    const performances = Array.from(this.playerMatchPerformances.values())
      .filter(perf => perf.matchId === matchId);
    
    return Promise.all(performances.map(async perf => {
      const user = await this.getUser(perf.userId) as User;
      return { ...perf, user };
    }));
  }
  
  // Match management methods
  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const id = this.matchCurrentId++;
    const match: Match = {
      id,
      title: insertMatch.title,
      venue: insertMatch.venue,
      date: insertMatch.date,
      overs: insertMatch.overs,
      team1Id: insertMatch.team1Id,
      team2Id: insertMatch.team2Id,
      matchType: insertMatch.matchType || 'friendly',
      status: insertMatch.status || 'upcoming',
      currentInnings: insertMatch.currentInnings || 1,
      team1Score: insertMatch.team1Score || 0,
      team1Wickets: insertMatch.team1Wickets || 0,
      team1Overs: insertMatch.team1Overs || '0.0',
      team2Score: insertMatch.team2Score || 0,
      team2Wickets: insertMatch.team2Wickets || 0,
      team2Overs: insertMatch.team2Overs || '0.0',
      result: insertMatch.result || null,
      winner: insertMatch.winner || null,
      tossWinner: insertMatch.tossWinner || null,
      tossDecision: insertMatch.tossDecision || null,
      createdBy: insertMatch.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.matches.set(id, match);
    return match;
  }
  
  async getMatchById(id: number): Promise<Match | undefined> {
    return this.matches.get(id);
  }
  
  async updateMatch(id: number, matchData: Partial<Match>): Promise<Match | undefined> {
    const match = await this.getMatchById(id);
    if (!match) return undefined;
    
    const updatedMatch = { ...match, ...matchData, updatedAt: new Date() };
    this.matches.set(id, updatedMatch);
    return updatedMatch;
  }
  
  async getMatchesByCreator(userId: number): Promise<Match[]> {
    return Array.from(this.matches.values())
      .filter(match => match.createdBy === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }
  
  async deleteMatch(id: number): Promise<boolean> {
    // Also delete related data
    const ballsToDelete = Array.from(this.ballByBalls.values())
      .filter(ball => ball.matchId === id)
      .map(ball => ball.id);
    
    ballsToDelete.forEach(ballId => this.ballByBalls.delete(ballId));
    
    const playersToDelete = Array.from(this.matchPlayers.values())
      .filter(player => player.matchId === id)
      .map(player => player.id);
    
    playersToDelete.forEach(playerId => this.matchPlayers.delete(playerId));
    
    return this.matches.delete(id);
  }
  
  // Team management methods
  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = this.teamCurrentId++;
    const team: Team = {
      id,
      name: insertTeam.name,
      location: insertTeam.location || null,
      description: insertTeam.description || null,
      logoUrl: insertTeam.logoUrl || null,
      captainId: insertTeam.captainId || null,
      viceCaptainId: insertTeam.viceCaptainId || null,
      createdBy: insertTeam.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.teams.set(id, team);
    return team;
  }
  
  async getTeamById(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }
  
  async getTeamByName(name: string): Promise<Team | undefined> {
    return Array.from(this.teams.values()).find(team => team.name === name);
  }
  
  async getTeamByNameOrCreate(team: Partial<InsertTeam>): Promise<Team> {
    // Try to find the team by name first
    const existingTeam = await this.getTeamByName(team.name as string);
    
    if (existingTeam) {
      return existingTeam;
    }
    
    // Create a new team if it doesn't exist
    // Note: We need to provide default values for required fields
    return await this.createTeam({
      name: team.name as string,
      createdBy: team.createdBy || 1, // Default to user ID 1 if not provided
      logo: team.logo || null,
      shortName: team.shortName || null,
      description: team.description || null,
      primaryColor: team.primaryColor || null,
      secondaryColor: team.secondaryColor || null
    } as InsertTeam);
  }
  
  async getUserTeams(userId: number): Promise<Team[]> {
    return Array.from(this.teams.values())
      .filter(team => team.createdBy === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }
  
  async updateTeam(id: number, teamData: Partial<Team>): Promise<Team | undefined> {
    const team = await this.getTeamById(id);
    if (!team) return undefined;
    
    const updatedTeam = { ...team, ...teamData, updatedAt: new Date() };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }
  
  async deleteTeam(id: number): Promise<boolean> {
    return this.teams.delete(id);
  }
  
  // Match player management methods
  async addMatchPlayer(insertPlayer: InsertMatchPlayer): Promise<MatchPlayer> {
    // Check if player already exists for this match and team
    const existingPlayer = Array.from(this.matchPlayers.values()).find(
      p => p.matchId === insertPlayer.matchId && 
           p.teamId === insertPlayer.teamId && 
           p.userId === insertPlayer.userId
    );
    
    if (existingPlayer) {
      // Update existing player instead of creating a new one
      const updatedPlayer = { 
        ...existingPlayer,
        isPlaying: insertPlayer.isPlaying !== undefined ? insertPlayer.isPlaying : existingPlayer.isPlaying,
        isCaptain: insertPlayer.isCaptain !== undefined ? insertPlayer.isCaptain : existingPlayer.isCaptain,
        isViceCaptain: insertPlayer.isViceCaptain !== undefined ? insertPlayer.isViceCaptain : existingPlayer.isViceCaptain,
        isWicketkeeper: insertPlayer.isWicketkeeper !== undefined ? insertPlayer.isWicketkeeper : existingPlayer.isWicketkeeper,
        battingPosition: insertPlayer.battingPosition !== undefined ? insertPlayer.battingPosition : existingPlayer.battingPosition,
        bowlingPosition: insertPlayer.bowlingPosition !== undefined ? insertPlayer.bowlingPosition : existingPlayer.bowlingPosition,
        playerMatchNotes: insertPlayer.playerMatchNotes !== undefined ? insertPlayer.playerMatchNotes : existingPlayer.playerMatchNotes,
        updatedAt: new Date()
      };
      
      this.matchPlayers.set(existingPlayer.id, updatedPlayer);
      return updatedPlayer;
    }
    
    // Create new player
    const id = this.matchPlayerCurrentId++;
    const player: MatchPlayer = {
      id,
      matchId: insertPlayer.matchId,
      teamId: insertPlayer.teamId,
      userId: insertPlayer.userId,
      isPlaying: insertPlayer.isPlaying !== undefined ? insertPlayer.isPlaying : true,
      isCaptain: insertPlayer.isCaptain || false,
      isViceCaptain: insertPlayer.isViceCaptain || false,
      isWicketkeeper: insertPlayer.isWicketkeeper || false,
      battingPosition: insertPlayer.battingPosition || null,
      bowlingPosition: insertPlayer.bowlingPosition || null,
      playerMatchNotes: insertPlayer.playerMatchNotes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.matchPlayers.set(id, player);
    return player;
  }
  
  async getMatchPlayersByTeam(matchId: number, teamId: number): Promise<MatchPlayer[]> {
    const matchPlayers = Array.from(this.matchPlayers.values())
      .filter(player => player.matchId === matchId && player.teamId === teamId);
    
    // Enrich with user data
    return Promise.all(matchPlayers.map(async player => {
      const user = await this.getUser(player.userId);
      return {
        ...player,
        user
      };
    }));
  }
  
  async updateMatchPlayer(id: number, playerData: Partial<MatchPlayer>): Promise<MatchPlayer | undefined> {
    const player = this.matchPlayers.get(id);
    if (!player) return undefined;
    
    const updatedPlayer = { ...player, ...playerData, updatedAt: new Date() };
    this.matchPlayers.set(id, updatedPlayer);
    return updatedPlayer;
  }
  
  async removeMatchPlayer(id: number): Promise<boolean> {
    return this.matchPlayers.delete(id);
  }
  
  // Ball-by-ball data methods
  async recordBallByBall(insertBall: InsertBallByBall): Promise<BallByBall> {
    const id = this.ballByBallCurrentId++;
    const ball: BallByBall = {
      id,
      matchId: insertBall.matchId,
      innings: insertBall.innings,
      over: insertBall.over,
      ball: insertBall.ball,
      batsmanId: insertBall.batsmanId,
      bowlerId: insertBall.bowlerId,
      runsScored: insertBall.runsScored || 0,
      extras: insertBall.extras || 0,
      extrasType: insertBall.extrasType || null,
      isWicket: insertBall.isWicket || false,
      wicketType: insertBall.wicketType || null,
      playerOutId: insertBall.playerOutId || null,
      fielderId: insertBall.fielderId || null,
      commentary: insertBall.commentary || null,
      shotType: insertBall.shotType || null,
      shotDirection: insertBall.shotDirection || null,
      shotDistance: insertBall.shotDistance || null,
      ballType: insertBall.ballType || null,
      ballSpeed: insertBall.ballSpeed || null,
      createdAt: new Date()
    };
    
    this.ballByBalls.set(id, ball);
    return ball;
  }
  
  async getMatchBalls(matchId: number): Promise<BallByBall[]> {
    return Array.from(this.ballByBalls.values())
      .filter(ball => ball.matchId === matchId)
      .sort((a, b) => {
        // Sort by innings, over, and ball
        if (a.innings !== b.innings) {
          return a.innings - b.innings;
        }
        if (a.over !== b.over) {
          return a.over - b.over;
        }
        return a.ball - b.ball;
      });
  }

  // Venue management methods
  async createVenue(insertVenue: InsertVenue): Promise<Venue> {
    const id = this.venueCurrentId++;
    const venue: Venue = {
      id,
      name: insertVenue.name,
      address: insertVenue.address,
      city: insertVenue.city,
      state: insertVenue.state || null,
      country: insertVenue.country,
      postalCode: insertVenue.postalCode || null,
      capacity: insertVenue.capacity || null,
      facilities: insertVenue.facilities || [],
      description: insertVenue.description || null,
      imageUrl: insertVenue.imageUrl || null,
      contactEmail: insertVenue.contactEmail || null,
      contactPhone: insertVenue.contactPhone || null,
      pricePerHour: insertVenue.pricePerHour || null,
      isActive: true,
      createdBy: insertVenue.createdBy,
      latitude: insertVenue.latitude || null,
      longitude: insertVenue.longitude || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.venues.set(id, venue);
    return venue;
  }
  
  async getVenue(id: number): Promise<Venue | undefined> {
    return this.venues.get(id);
  }
  
  async getVenueByName(name: string): Promise<Venue | undefined> {
    return Array.from(this.venues.values()).find(venue => venue.name === name);
  }
  
  async getVenues(query?: string, limit: number = 20): Promise<Venue[]> {
    let venues = Array.from(this.venues.values())
      .filter(venue => venue.isActive);
    
    if (query) {
      const lowerCaseQuery = query.toLowerCase();
      venues = venues.filter(venue => 
        venue.name.toLowerCase().includes(lowerCaseQuery) ||
        venue.city.toLowerCase().includes(lowerCaseQuery) ||
        (venue.state && venue.state.toLowerCase().includes(lowerCaseQuery)) ||
        venue.country.toLowerCase().includes(lowerCaseQuery) ||
        (venue.description && venue.description.toLowerCase().includes(lowerCaseQuery))
      );
    }
    
    return venues.slice(0, limit);
  }
  
  async getNearbyVenues(lat: number, lng: number, radiusKm: number): Promise<Venue[]> {
    // Simple distance calculation using the Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };
    
    return Array.from(this.venues.values())
      .filter(venue => {
        if (!venue.latitude || !venue.longitude || !venue.isActive) return false;
        
        const distance = calculateDistance(
          lat, 
          lng, 
          Number(venue.latitude), 
          Number(venue.longitude)
        );
        
        return distance <= radiusKm;
      })
      .sort((a, b) => {
        const distA = calculateDistance(
          lat, 
          lng, 
          Number(a.latitude), 
          Number(a.longitude)
        );
        const distB = calculateDistance(
          lat, 
          lng, 
          Number(b.latitude), 
          Number(b.longitude)
        );
        return distA - distB;
      });
  }
  
  async updateVenue(id: number, venueData: Partial<Venue>): Promise<Venue | undefined> {
    const venue = await this.getVenue(id);
    if (!venue) return undefined;
    
    const updatedVenue = { 
      ...venue, 
      ...venueData,
      updatedAt: new Date() 
    };
    
    this.venues.set(id, updatedVenue);
    return updatedVenue;
  }
  
  async deleteVenue(id: number): Promise<boolean> {
    // Soft delete: mark as inactive instead of removing
    const venue = await this.getVenue(id);
    if (!venue) return false;
    
    const updatedVenue = { 
      ...venue, 
      isActive: false,
      updatedAt: new Date() 
    };
    
    this.venues.set(id, updatedVenue);
    return true;
  }
  
  async getUserVenues(userId: number): Promise<Venue[]> {
    return Array.from(this.venues.values())
      .filter(venue => venue.createdBy === userId && venue.isActive)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }
  
  // Venue availability methods
  async createVenueAvailability(insertAvailability: InsertVenueAvailability): Promise<VenueAvailability> {
    const id = this.venueAvailabilityCurrentId++;
    const availability: VenueAvailability = {
      id,
      venueId: insertAvailability.venueId,
      dayOfWeek: insertAvailability.dayOfWeek,
      startTime: insertAvailability.startTime,
      endTime: insertAvailability.endTime,
      isAvailable: insertAvailability.isAvailable !== undefined ? insertAvailability.isAvailable : true
    };
    this.venueAvailabilities.set(id, availability);
    return availability;
  }
  
  async getVenueAvailabilities(venueId: number): Promise<VenueAvailability[]> {
    return Array.from(this.venueAvailabilities.values())
      .filter(avail => avail.venueId === venueId)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  }
  
  async updateVenueAvailability(id: number, data: Partial<VenueAvailability>): Promise<VenueAvailability | undefined> {
    const availability = this.venueAvailabilities.get(id);
    if (!availability) return undefined;
    
    const updatedAvailability = { ...availability, ...data };
    this.venueAvailabilities.set(id, updatedAvailability);
    return updatedAvailability;
  }
  
  async deleteVenueAvailability(id: number): Promise<boolean> {
    return this.venueAvailabilities.delete(id);
  }
  
  // Venue booking methods
  async createVenueBooking(insertBooking: InsertVenueBooking): Promise<VenueBooking> {
    const id = this.venueBookingCurrentId++;
    const booking: VenueBooking = {
      id,
      venueId: insertBooking.venueId,
      userId: insertBooking.userId,
      date: insertBooking.date,
      startTime: insertBooking.startTime,
      endTime: insertBooking.endTime,
      purpose: insertBooking.purpose || null,
      numberOfPeople: insertBooking.numberOfPeople || null,
      status: insertBooking.status || 'pending',
      paymentStatus: insertBooking.paymentStatus || 'unpaid',
      totalAmount: insertBooking.totalAmount || null,
      paidAmount: insertBooking.paidAmount || null,
      transactionId: insertBooking.transactionId || null,
      notes: insertBooking.notes || null,
      tournamentId: insertBooking.tournamentId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.venueBookings.set(id, booking);
    return booking;
  }
  
  async getVenueBooking(id: number): Promise<VenueBooking | undefined> {
    return this.venueBookings.get(id);
  }
  
  async getUserBookings(userId: number): Promise<(VenueBooking & { venue: Venue })[]> {
    const userBookings = Array.from(this.venueBookings.values())
      .filter(booking => booking.userId === userId)
      .sort((a, b) => {
        // Sort by date, then by start time
        const dateComparison = (a.date?.getTime() || 0) - (b.date?.getTime() || 0);
        if (dateComparison !== 0) return dateComparison;
        
        return a.startTime.localeCompare(b.startTime);
      });
      
    return Promise.all(userBookings.map(async booking => {
      const venue = await this.getVenue(booking.venueId) as Venue;
      return { ...booking, venue };
    }));
  }
  
  async getVenueBookings(venueId: number, startDate?: Date, endDate?: Date): Promise<(VenueBooking & { user: User })[]> {
    let bookings = Array.from(this.venueBookings.values())
      .filter(booking => booking.venueId === venueId);
    
    if (startDate) {
      bookings = bookings.filter(booking => booking.date >= startDate);
    }
    
    if (endDate) {
      bookings = bookings.filter(booking => booking.date <= endDate);
    }
    
    bookings = bookings.sort((a, b) => {
      // Sort by date, then by start time
      const dateComparison = (a.date?.getTime() || 0) - (b.date?.getTime() || 0);
      if (dateComparison !== 0) return dateComparison;
      
      return a.startTime.localeCompare(b.startTime);
    });
    
    return Promise.all(bookings.map(async booking => {
      const user = await this.getUser(booking.userId) as User;
      return { ...booking, user };
    }));
  }
  
  async updateVenueBooking(id: number, data: Partial<VenueBooking>): Promise<VenueBooking | undefined> {
    const booking = await this.getVenueBooking(id);
    if (!booking) return undefined;
    
    const updatedBooking = { 
      ...booking, 
      ...data,
      updatedAt: new Date() 
    };
    
    this.venueBookings.set(id, updatedBooking);
    return updatedBooking;
  }
  
  async cancelVenueBooking(id: number): Promise<boolean> {
    const booking = await this.getVenueBooking(id);
    if (!booking) return false;
    
    const updatedBooking = { 
      ...booking, 
      status: 'cancelled',
      updatedAt: new Date() 
    };
    
    this.venueBookings.set(id, updatedBooking);
    return true;
  }
  
  async checkVenueAvailability(venueId: number, date: Date, startTime: string, endTime: string): Promise<boolean> {
    // Check venue's working hours for the given day
    const dayOfWeek = date.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const availabilities = await this.getVenueAvailabilities(venueId);
    
    const dayAvailability = availabilities.find(a => a.dayOfWeek === dayOfWeek && a.isAvailable);
    if (!dayAvailability) return false;
    
    // Check if the requested time falls within venue's working hours
    if (startTime < dayAvailability.startTime || endTime > dayAvailability.endTime) {
      return false;
    }
    
    // Check for conflicts with existing bookings
    const bookingsOnDate = Array.from(this.venueBookings.values()).filter(booking => 
      booking.venueId === venueId &&
      booking.date.getFullYear() === date.getFullYear() &&
      booking.date.getMonth() === date.getMonth() &&
      booking.date.getDate() === date.getDate() &&
      booking.status !== 'cancelled'
    );
    
    // Check for time conflicts
    for (const booking of bookingsOnDate) {
      // If the requested start time falls within an existing booking
      if (startTime >= booking.startTime && startTime < booking.endTime) {
        return false;
      }
      
      // If the requested end time falls within an existing booking
      if (endTime > booking.startTime && endTime <= booking.endTime) {
        return false;
      }
      
      // If the requested booking envelops an existing booking
      if (startTime <= booking.startTime && endTime >= booking.endTime) {
        return false;
      }
    }
    
    return true;
  }
  
  // Content categorization and discovery system methods
  async createTag(insertTag: InsertTag): Promise<Tag> {
    const id = this.tagCurrentId++;
    const tag: Tag = {
      id,
      name: insertTag.name,
      description: insertTag.description || null,
      type: insertTag.type,
      popularityScore: insertTag.popularityScore || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tags.set(id, tag);
    return tag;
  }
  
  async getTags(type?: string): Promise<Tag[]> {
    const allTags = Array.from(this.tags.values());
    if (type) {
      return allTags.filter(tag => tag.type === type);
    }
    return allTags;
  }
  
  async getTagById(id: number): Promise<Tag | undefined> {
    return this.tags.get(id);
  }
  
  async updateTagPopularity(id: number, increment: number): Promise<Tag | undefined> {
    const tag = await this.getTagById(id);
    if (!tag) return undefined;
    
    const updatedTag = { 
      ...tag, 
      popularityScore: tag.popularityScore + increment,
      updatedAt: new Date()
    };
    this.tags.set(id, updatedTag);
    return updatedTag;
  }
  
  async addPostTag(insertPostTag: InsertPostTag): Promise<PostTag> {
    const compositeKey = `${insertPostTag.postId}-${insertPostTag.tagId}`;
    
    // Check if tag association already exists
    const existingPostTag = this.postTags.get(compositeKey);
    if (existingPostTag) return existingPostTag;
    
    const postTag: PostTag = {
      postId: insertPostTag.postId,
      tagId: insertPostTag.tagId,
      createdAt: new Date()
    };
    
    this.postTags.set(compositeKey, postTag);
    
    // Increment the tag's popularity
    await this.updateTagPopularity(insertPostTag.tagId, 1);
    
    return postTag;
  }
  
  async getPostTags(postId: number): Promise<Tag[]> {
    const tagIds = Array.from(this.postTags.values())
      .filter(postTag => postTag.postId === postId)
      .map(postTag => postTag.tagId);
    
    return Promise.all(tagIds.map(id => this.getTagById(id))) as Promise<Tag[]>;
  }
  
  async removePostTag(postId: number, tagId: number): Promise<boolean> {
    const compositeKey = `${postId}-${tagId}`;
    const success = this.postTags.delete(compositeKey);
    
    if (success) {
      // Decrement the tag's popularity
      await this.updateTagPopularity(tagId, -1);
    }
    
    return success;
  }
  
  async createContentCategory(insertCategory: InsertContentCategory): Promise<ContentCategory> {
    const id = this.contentCategoryCurrentId++;
    const category: ContentCategory = {
      id,
      name: insertCategory.name,
      description: insertCategory.description || null,
      iconUrl: insertCategory.iconUrl || null,
      priority: insertCategory.priority || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.contentCategories.set(id, category);
    return category;
  }
  
  async getContentCategories(): Promise<ContentCategory[]> {
    return Array.from(this.contentCategories.values())
      .sort((a, b) => b.priority - a.priority);
  }
  
  async updateUserInterest(insertInterest: InsertUserInterest): Promise<UserInterest> {
    const compositeKey = `${insertInterest.userId}-${insertInterest.tagId}`;
    
    // Check if interest already exists
    const existingInterest = this.userInterests.get(compositeKey);
    
    // Convert the incoming score to string
    let newScore: string;
    if (typeof insertInterest.interactionScore === 'number') {
      newScore = insertInterest.interactionScore.toString();
    } else if (typeof insertInterest.interactionScore === 'string') {
      newScore = insertInterest.interactionScore;
    } else {
      newScore = '0';
    }
    
    const interest: UserInterest = existingInterest ? {
      ...existingInterest,
      interactionScore: newScore || existingInterest.interactionScore,
      updatedAt: new Date()
    } : {
      userId: insertInterest.userId,
      tagId: insertInterest.tagId,
      interactionScore: newScore,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.userInterests.set(compositeKey, interest);
    return interest;
  }
  
  async getUserInterests(userId: number): Promise<(UserInterest & { tag: Tag })[]> {
    const interests = Array.from(this.userInterests.values())
      .filter(interest => interest.userId === userId);
    
    return Promise.all(interests.map(async interest => {
      const tag = await this.getTagById(interest.tagId) as Tag;
      return { ...interest, tag };
    }));
  }
  
  async recordContentEngagement(insertEngagement: InsertContentEngagement): Promise<ContentEngagement> {
    const id = this.contentEngagementCurrentId++;
    const engagement: ContentEngagement = {
      id,
      userId: insertEngagement.userId,
      postId: insertEngagement.postId,
      engagementType: insertEngagement.engagementType,
      engagementScore: insertEngagement.engagementScore || 0,
      duration: insertEngagement.duration || null,
      createdAt: new Date()
    };
    this.contentEngagements.set(id, engagement);
    
    // Update user interests based on post tags
    const postTags = await this.getPostTags(insertEngagement.postId);
    
    for (const tag of postTags) {
      // Calculate an interaction score based on engagement type
      let interactionScore = 0;
      switch (insertEngagement.engagementType) {
        case 'view':
          interactionScore = 0.1;
          break;
        case 'like':
          interactionScore = 0.3;
          break;
        case 'comment':
          interactionScore = 0.5;
          break;
        case 'share':
          interactionScore = 0.7;
          break;
        case 'save':
          interactionScore = 0.8;
          break;
        case 'time_spent':
          // Calculate based on duration (0-1 range)
          const durationMinutes = (insertEngagement.duration || 0) / 60;
          interactionScore = Math.min(durationMinutes / 5, 1) * 0.6; // Max score at 5 minutes
          break;
      }
      
      // Get existing interest or create new one
      const existingInterest = Array.from(this.userInterests.values())
        .find(i => i.userId === insertEngagement.userId && i.tagId === tag.id);
      
      if (existingInterest) {
        // Smooth update with more weight for new interaction
        const existingScore = typeof existingInterest.interactionScore === 'string' 
          ? parseFloat(existingInterest.interactionScore) || 0 
          : (existingInterest.interactionScore || 0);
        const newInteractionScore = typeof interactionScore === 'string' 
          ? parseFloat(interactionScore) || 0 
          : (interactionScore || 0);
        const newScore = existingScore * 0.7 + newInteractionScore * 0.3;
        await this.updateUserInterest({
          userId: insertEngagement.userId,
          tagId: tag.id,
          interactionScore: newScore.toString()
        });
      } else {
        // Create new interest
        await this.updateUserInterest({
          userId: insertEngagement.userId,
          tagId: tag.id,
          interactionScore: interactionScore.toString()
        });
      }
    }
    
    return engagement;
  }
  
  async getContentEngagementForUser(userId: number): Promise<ContentEngagement[]> {
    return Array.from(this.contentEngagements.values())
      .filter(engagement => engagement.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }
  
  // Tournament management methods
  async createTournament(insertTournament: InsertTournament): Promise<Tournament> {
    const id = this.tournamentCurrentId++;
    const tournament: Tournament = {
      id,
      name: insertTournament.name,
      description: insertTournament.description || null,
      startDate: insertTournament.startDate,
      endDate: insertTournament.endDate,
      registrationDeadline: insertTournament.registrationDeadline || null,
      maxTeams: insertTournament.maxTeams || null,
      entryFee: insertTournament.entryFee || null,
      prizePool: insertTournament.prizePool || null,
      format: insertTournament.format,
      status: insertTournament.status || 'upcoming',
      organizerId: insertTournament.organizerId,
      logoUrl: insertTournament.logoUrl || null,
      bannerUrl: insertTournament.bannerUrl || null,
      rules: insertTournament.rules || null,
      contactEmail: insertTournament.contactEmail || null,
      contactPhone: insertTournament.contactPhone || null,
      isPublic: insertTournament.isPublic !== undefined ? insertTournament.isPublic : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tournaments.set(id, tournament);
    return tournament;
  }
  
  async getTournament(id: number): Promise<Tournament | undefined> {
    const tournament = this.tournaments.get(id);
    if (!tournament) return undefined;
    
    // Enhance the tournament with teams, matches, and venues
    const teams = await this.getTournamentTeams(id);
    const tournamentMatches = await this.getTournamentMatches(id);
    
    return {
      ...tournament,
      teams: teams,
      matches: tournamentMatches
    };
  }
  
  async getTournaments(query?: string, status?: string, limit: number = 20): Promise<Tournament[]> {
    let tournaments = Array.from(this.tournaments.values());
    
    if (status) {
      tournaments = tournaments.filter(t => t.status === status);
    }
    
    if (query) {
      const lowerCaseQuery = query.toLowerCase();
      tournaments = tournaments.filter(t => 
        t.name.toLowerCase().includes(lowerCaseQuery) ||
        (t.description && t.description.toLowerCase().includes(lowerCaseQuery))
      );
    }
    
    // Sort by start date (upcoming first)
    tournaments.sort((a, b) => {
      const aDate = a.startDate instanceof Date ? a.startDate.getTime() : 0;
      const bDate = b.startDate instanceof Date ? b.startDate.getTime() : 0;
      return aDate - bDate;
    });
    
    // Get the limited set of tournaments
    const limitedTournaments = tournaments.slice(0, limit);
    
    // Enhance each tournament with teams, matches, and venues
    const enhancedTournaments = await Promise.all(limitedTournaments.map(async (tournament) => {
      const teams = await this.getTournamentTeams(tournament.id);
      const tournamentMatches = await this.getTournamentMatches(tournament.id);
      
      return {
        ...tournament,
        teams: teams,
        matches: tournamentMatches
      };
    }));
    
    return enhancedTournaments;
  }
  
  async getUserTournaments(userId: number): Promise<Tournament[]> {
    const userTournaments = Array.from(this.tournaments.values())
      .filter(t => t.organizerId === userId)
      .sort((a, b) => {
        const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return bDate - aDate;
      });
    
    // Enhance each tournament with teams, matches, and venues
    const enhancedTournaments = await Promise.all(userTournaments.map(async (tournament) => {
      const teams = await this.getTournamentTeams(tournament.id);
      const tournamentMatches = await this.getTournamentMatches(tournament.id);
      
      return {
        ...tournament,
        teams: teams,
        matches: tournamentMatches
      };
    }));
    
    return enhancedTournaments;
  }
  
  async updateTournament(id: number, data: Partial<Tournament>): Promise<Tournament | undefined> {
    const tournament = await this.getTournament(id);
    if (!tournament) return undefined;
    
    const updatedTournament = { 
      ...tournament, 
      ...data,
      updatedAt: new Date() 
    };
    
    this.tournaments.set(id, updatedTournament);
    return updatedTournament;
  }
  
  async deleteTournament(id: number): Promise<boolean> {
    // Check if tournament exists
    const tournament = await this.getTournament(id);
    if (!tournament) return false;
    
    // Update status to cancelled instead of hard delete
    const updatedTournament = { 
      ...tournament, 
      status: 'cancelled',
      updatedAt: new Date() 
    };
    
    this.tournaments.set(id, updatedTournament);
    return true;
  }
  
  // Tournament team methods
  async addTeamToTournament(insertTeamData: InsertTournamentTeam): Promise<TournamentTeam> {
    const compositeKey = `${insertTeamData.tournamentId}-${insertTeamData.teamId}`;
    
    // Check if team is already in tournament
    if (this.tournamentTeams.has(compositeKey)) {
      return this.tournamentTeams.get(compositeKey) as TournamentTeam;
    }
    
    const tournamentTeam: TournamentTeam = {
      tournamentId: insertTeamData.tournamentId,
      teamId: insertTeamData.teamId,
      registrationStatus: insertTeamData.registrationStatus || 'pending',
      paymentStatus: insertTeamData.paymentStatus || 'unpaid',
      paidAmount: insertTeamData.paidAmount || null,
      notes: insertTeamData.notes || null,
      registrationDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.tournamentTeams.set(compositeKey, tournamentTeam);
    return tournamentTeam;
  }
  
  async getTournamentTeams(tournamentId: number): Promise<(TournamentTeam & { team: Team })[]> {
    const teams = Array.from(this.tournamentTeams.values())
      .filter(tt => tt.tournamentId === tournamentId);
    
    return Promise.all(teams.map(async tt => {
      const team = await this.getTeamById(tt.teamId) as Team;
      return { ...tt, team };
    }));
  }
  
  /**
   * Get a tournament team by tournament ID and team ID
   * This is a helper method to check if a team is already in a tournament
   */
  async getTournamentTeam(tournamentId: number, teamId: number): Promise<TournamentTeam | undefined> {
    const compositeKey = `${tournamentId}-${teamId}`;
    return this.tournamentTeams.get(compositeKey);
  }
  
  async updateTournamentTeam(tournamentId: number, teamId: number, data: Partial<TournamentTeam>): Promise<TournamentTeam | undefined> {
    const compositeKey = `${tournamentId}-${teamId}`;
    
    // Check if team exists in tournament
    const tournamentTeam = this.tournamentTeams.get(compositeKey);
    if (!tournamentTeam) return undefined;
    
    const updatedTournamentTeam = { 
      ...tournamentTeam, 
      ...data,
      updatedAt: new Date() 
    };
    
    this.tournamentTeams.set(compositeKey, updatedTournamentTeam);
    return updatedTournamentTeam;
  }
  
  async removeTeamFromTournament(tournamentId: number, teamId: number): Promise<boolean> {
    const compositeKey = `${tournamentId}-${teamId}`;
    return this.tournamentTeams.delete(compositeKey);
  }
  
  // Tournament match methods
  async createTournamentMatch(insertMatchData: InsertTournamentMatch): Promise<TournamentMatch> {
    const id = this.tournamentMatchCurrentId++;
    const tournamentMatch: TournamentMatch = {
      id,
      tournamentId: insertMatchData.tournamentId,
      matchId: insertMatchData.matchId,
      round: insertMatchData.round || null,
      matchNumber: insertMatchData.matchNumber || null,
      group: insertMatchData.group || null,
      stage: insertMatchData.stage || null,
      venueId: insertMatchData.venueId || null,
      scheduledDate: insertMatchData.scheduledDate || null,
      scheduledTime: insertMatchData.scheduledTime || null,
      status: insertMatchData.status || 'scheduled',
      notes: insertMatchData.notes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.tournamentMatches.set(id, tournamentMatch);
    return tournamentMatch;
  }
  
  async getTournamentMatch(id: number): Promise<TournamentMatch | undefined> {
    return this.tournamentMatches.get(id);
  }
  
  async getTournamentMatches(tournamentId: number): Promise<(TournamentMatch & { match: Match, venue?: Venue })[]> {
    const matches = Array.from(this.tournamentMatches.values())
      .filter(tm => tm.tournamentId === tournamentId)
      .sort((a, b) => {
        // First sort by stage/round
        if (a.stage && b.stage && a.stage !== b.stage) {
          // Custom sort order for stages
          const stageOrder = {
            'group': 1,
            'round-of-16': 2,
            'quarter-final': 3,
            'semi-final': 4,
            'third-place': 5,
            'final': 6
          };
          
          const aOrder = stageOrder[a.stage as keyof typeof stageOrder] || 0;
          const bOrder = stageOrder[b.stage as keyof typeof stageOrder] || 0;
          
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
        }
        
        if (a.round !== null && b.round !== null && a.round !== b.round) {
          return a.round - b.round;
        }
        
        // Then sort by scheduled date
        if (a.scheduledDate && b.scheduledDate) {
          const dateComparison = a.scheduledDate.getTime() - b.scheduledDate.getTime();
          if (dateComparison !== 0) return dateComparison;
        } else if (a.scheduledDate) {
          return -1;
        } else if (b.scheduledDate) {
          return 1;
        }
        
        // Then by match number
        if (a.matchNumber !== null && b.matchNumber !== null) {
          return a.matchNumber - b.matchNumber;
        }
        
        return 0;
      });
    
    return Promise.all(matches.map(async tm => {
      const match = await this.getMatchById(tm.matchId) as Match;
      let venue: Venue | undefined = undefined;
      
      if (tm.venueId) {
        venue = await this.getVenue(tm.venueId);
      }
      
      return venue ? { ...tm, match, venue } : { ...tm, match };
    }));
  }
  
  async updateTournamentMatch(id: number, data: Partial<TournamentMatch>): Promise<TournamentMatch | undefined> {
    const tournamentMatch = await this.getTournamentMatch(id);
    if (!tournamentMatch) return undefined;
    
    const updatedTournamentMatch = { 
      ...tournamentMatch, 
      ...data,
      updatedAt: new Date() 
    };
    
    this.tournamentMatches.set(id, updatedTournamentMatch);
    return updatedTournamentMatch;
  }
  
  async deleteTournamentMatch(id: number): Promise<boolean> {
    return this.tournamentMatches.delete(id);
  }
  
  // Tournament match queries
  async getTournamentMatchesByTournament(tournamentId: number): Promise<TournamentMatch[]> {
    return Array.from(this.tournamentMatches.values())
      .filter(match => match.tournamentId === tournamentId);
  }
  
  // Tournament standings methods
  async createTournamentStanding(standingData: InsertTournamentStanding): Promise<TournamentStanding> {
    const id = this.tournamentStandingCurrentId++;
    const standing: TournamentStanding = {
      id,
      tournamentId: standingData.tournamentId,
      teamId: standingData.teamId,
      position: standingData.position || 0,
      played: standingData.played || 0,
      won: standingData.won || 0,
      lost: standingData.lost || 0,
      drawn: standingData.drawn || 0,
      points: standingData.points || 0,
      forScore: standingData.forScore || 0,
      againstScore: standingData.againstScore || 0,
      nrr: standingData.nrr || 0,
      group: standingData.group || null,
      stage: standingData.stage || null,
      updatedAt: new Date(),
      createdAt: new Date(),
    };
    
    this.tournamentStandings.set(id, standing);
    return standing;
  }
  
  async getTournamentStanding(id: number): Promise<TournamentStanding | undefined> {
    return this.tournamentStandings.get(id);
  }
  
  async getTournamentStandingByTeam(tournamentId: number, teamId: number): Promise<TournamentStanding | undefined> {
    return Array.from(this.tournamentStandings.values()).find(
      standing => standing.tournamentId === tournamentId && standing.teamId === teamId
    );
  }
  
  async getTournamentStandingsByTournament(tournamentId: number): Promise<TournamentStanding[]> {
    return Array.from(this.tournamentStandings.values())
      .filter(standing => standing.tournamentId === tournamentId)
      .sort((a, b) => {
        // First sort by group if exists
        if (a.group && b.group && a.group !== b.group) {
          return a.group.localeCompare(b.group);
        }
        
        // Then sort by position
        if (a.position !== b.position) {
          return a.position - b.position;
        }
        
        // If positions are tied, sort by points
        if (a.points !== b.points) {
          return b.points - a.points;
        }
        
        // If points are tied, sort by NRR
        return b.nrr - a.nrr;
      });
  }
  
  async updateTournamentStanding(id: number, data: Partial<TournamentStanding>): Promise<TournamentStanding | undefined> {
    const standing = await this.getTournamentStanding(id);
    if (!standing) return undefined;
    
    const updatedStanding = { 
      ...standing, 
      ...data,
      updatedAt: new Date() 
    };
    
    this.tournamentStandings.set(id, updatedStanding);
    return updatedStanding;
  }
  
  async deleteTournamentStanding(id: number): Promise<boolean> {
    return this.tournamentStandings.delete(id);
  }
  
  async getPersonalizedFeed(userId: number, limit: number = 20): Promise<(Post & { 
    user: User, 
    likeCount: number, 
    commentCount: number, 
    hasLiked: boolean,
    tags: Tag[],
    relevanceScore: number
  })[]> {
    // Get all user interests
    const userInterests = await this.getUserInterests(userId);
    
    // Get following IDs
    const followingIds = Array.from(this.follows.values())
      .filter(follow => follow.followerId === userId)
      .map(follow => follow.followingId);
    
    // Include user's own posts
    followingIds.push(userId);
    
    // Get recent posts from all users (not just following, to expand discovery)
    const allRecentPosts = Array.from(this.posts.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, 100); // Start with a larger pool to apply personalization
    
    // Calculate relevance score for each post
    const postsWithScore = await Promise.all(allRecentPosts.map(async post => {
      const user = await this.getUser(post.userId) as User;
      const likes = await this.getLikesForPost(post.id);
      const comments = await this.getCommentsForPost(post.id);
      const hasLiked = !!(await this.getLike(userId, post.id));
      const tags = await this.getPostTags(post.id);
      
      // Calculate relevance score based on:
      // 1. Creator follows (higher if you follow the creator)
      // 2. Interest matching (based on tags)
      // 3. Popularity (likes, comments)
      // 4. Recency
      
      let relevanceScore = 0;
      
      // Creator follow boost (0-30 points)
      if (followingIds.includes(post.userId)) {
        relevanceScore += 30;
      }
      
      // Interest matching (0-40 points)
      const tagInterestScore = tags.reduce((score, tag) => {
        const matchingInterest = userInterests.find(i => i.tagId === tag.id);
        if (!matchingInterest) return score;
        
        const interactionScore = typeof matchingInterest.interactionScore === 'string'
          ? parseFloat(matchingInterest.interactionScore) || 0
          : (matchingInterest.interactionScore || 0);
          
        return score + (interactionScore * 40);
      }, 0);
      relevanceScore += Math.min(tagInterestScore, 40); // Cap at 40
      
      // Popularity score (0-20 points)
      const popularityScore = (likes.length * 2 + comments.length * 3) / 10;
      relevanceScore += Math.min(popularityScore, 20); // Cap at 20
      
      // Recency score (0-10 points)
      const createdAtTime = post.createdAt instanceof Date ? post.createdAt.getTime() : 0;
      const ageInHours = ((new Date()).getTime() - createdAtTime) / (1000 * 60 * 60);
      const recencyScore = Math.max(0, 10 - ageInHours / 12); // Decrease score over time, lowest after 5 days
      relevanceScore += recencyScore;
      
      return {
        ...post,
        user,
        likeCount: likes.length,
        commentCount: comments.length,
        hasLiked,
        tags,
        relevanceScore
      };
    }));
    
    // Sort by relevance score and take the top 'limit' posts
    return postsWithScore
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }
  
  // Poll methods
  async createPoll(insertPoll: InsertPoll): Promise<Poll> {
    const id = this.pollCurrentId++;
    const poll: Poll = {
      id,
      userId: insertPoll.userId,
      question: insertPoll.question,
      pollType: insertPoll.pollType,
      matchId: insertPoll.matchId || null,
      playerId: insertPoll.playerId || null,
      teamId: insertPoll.teamId || null,
      endTime: insertPoll.endTime || null,
      isActive: insertPoll.isActive !== undefined ? insertPoll.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.polls.set(id, poll);
    return poll;
  }
  
  async getPoll(id: number): Promise<(Poll & { options: PollOption[], creator: User }) | undefined> {
    const poll = this.polls.get(id);
    if (!poll) return undefined;
    
    const options = await this.getPollOptions(id);
    const creator = await this.getUser(poll.userId) as User;
    
    return {
      ...poll,
      options,
      creator
    };
  }
  
  async getPolls(limit: number = 10, type?: string): Promise<(Poll & { options: PollOption[], creator: User })[]> {
    let polls = Array.from(this.polls.values())
      .filter(poll => poll.isActive && (!type || poll.pollType === type))
      .sort((a, b) => {
        const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return bDate - aDate;
      })
      .slice(0, limit);
    
    return Promise.all(polls.map(async poll => {
      const options = await this.getPollOptions(poll.id);
      const creator = await this.getUser(poll.userId) as User;
      
      return {
        ...poll,
        options,
        creator
      };
    }));
  }
  
  async getUserPolls(userId: number): Promise<(Poll & { options: PollOption[] })[]> {
    const userPolls = Array.from(this.polls.values())
      .filter(poll => poll.userId === userId)
      .sort((a, b) => {
        const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return bDate - aDate;
      });
    
    return Promise.all(userPolls.map(async poll => {
      const options = await this.getPollOptions(poll.id);
      
      return {
        ...poll,
        options
      };
    }));
  }
  
  async updatePoll(id: number, data: Partial<Poll>): Promise<Poll | undefined> {
    const poll = this.polls.get(id);
    if (!poll) return undefined;
    
    const updatedPoll = { 
      ...poll, 
      ...data,
      updatedAt: new Date()
    };
    
    this.polls.set(id, updatedPoll);
    return updatedPoll;
  }
  
  async deletePoll(id: number): Promise<boolean> {
    // Delete all poll options and votes first
    const options = await this.getPollOptions(id);
    for (const option of options) {
      await this.deletePollOption(option.id);
    }
    
    // Delete all votes for this poll
    const votes = Array.from(this.pollVotes.values())
      .filter(vote => vote.pollId === id);
    
    for (const vote of votes) {
      this.pollVotes.delete(`${vote.userId}-${vote.pollId}`);
    }
    
    return this.polls.delete(id);
  }
  
  // Poll option methods
  async createPollOption(insertOption: InsertPollOption): Promise<PollOption> {
    const id = this.pollOptionCurrentId++;
    const option: PollOption = {
      id,
      pollId: insertOption.pollId,
      option: insertOption.option,
      imageUrl: insertOption.imageUrl || null,
      createdAt: new Date()
    };
    this.pollOptions.set(id, option);
    return option;
  }
  
  async getPollOption(id: number): Promise<PollOption | undefined> {
    return this.pollOptions.get(id);
  }
  
  async getPollOptions(pollId: number): Promise<PollOption[]> {
    return Array.from(this.pollOptions.values())
      .filter(option => option.pollId === pollId);
  }
  
  async updatePollOption(id: number, data: Partial<PollOption>): Promise<PollOption | undefined> {
    const option = this.pollOptions.get(id);
    if (!option) return undefined;
    
    const updatedOption = { ...option, ...data };
    this.pollOptions.set(id, updatedOption);
    return updatedOption;
  }
  
  async deletePollOption(id: number): Promise<boolean> {
    // Delete all votes for this option
    const option = this.pollOptions.get(id);
    if (!option) return false;
    
    const votes = Array.from(this.pollVotes.values())
      .filter(vote => vote.optionId === id);
    
    for (const vote of votes) {
      this.pollVotes.delete(`${vote.userId}-${vote.pollId}`);
    }
    
    return this.pollOptions.delete(id);
  }
  
  // Poll vote methods
  async createPollVote(insertVote: InsertPollVote): Promise<PollVote> {
    // Check if user already voted on this poll
    const existingVote = await this.getUserVote(insertVote.userId, insertVote.pollId);
    if (existingVote) {
      // If changing vote, delete the old one
      this.pollVotes.delete(`${existingVote.userId}-${existingVote.pollId}`);
    }
    
    const id = this.pollVoteCurrentId++;
    const vote: PollVote = {
      id,
      pollId: insertVote.pollId,
      optionId: insertVote.optionId,
      userId: insertVote.userId,
      createdAt: new Date()
    };
    
    // Use composite key for faster lookups
    this.pollVotes.set(`${vote.userId}-${vote.pollId}`, vote);
    return vote;
  }
  
  async getUserVote(userId: number, pollId: number): Promise<PollVote | undefined> {
    return this.pollVotes.get(`${userId}-${pollId}`);
  }
  
  async getPollVotes(pollId: number): Promise<(PollVote & { user: User })[]> {
    const pollVotes = Array.from(this.pollVotes.values())
      .filter(vote => vote.pollId === pollId);
    
    return Promise.all(pollVotes.map(async vote => {
      const user = await this.getUser(vote.userId) as User;
      return { ...vote, user };
    }));
  }
  
  async getPollResults(pollId: number): Promise<{ optionId: number, option: string, count: number, percentage: number }[]> {
    const options = await this.getPollOptions(pollId);
    const votes = Array.from(this.pollVotes.values())
      .filter(vote => vote.pollId === pollId);
    
    const totalVotes = votes.length;
    
    return options.map(option => {
      const optionVotes = votes.filter(vote => vote.optionId === option.id);
      const count = optionVotes.length;
      const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      
      return {
        optionId: option.id,
        option: option.option,
        count,
        percentage
      };
    });
  }
  
  async deletePollVote(userId: number, pollId: number): Promise<boolean> {
    return this.pollVotes.delete(`${userId}-${pollId}`);
  }

  // Player tournament stats methods
  async createPlayerTournamentStats(statsData: InsertPlayerTournamentStats): Promise<PlayerTournamentStats> {
    const key = `${statsData.tournamentId}-${statsData.userId}`;
    const existingStats = this.playerTournamentStats.get(key);
    
    if (existingStats) {
      // If stats already exist, update them
      return this.updatePlayerTournamentStats(statsData.tournamentId, statsData.userId, statsData);
    }
    
    const stats: PlayerTournamentStats = {
      tournamentId: statsData.tournamentId,
      userId: statsData.userId,
      matches: statsData.matches || 0,
      innings: statsData.innings || 0,
      runs: statsData.runs || 0,
      balls: statsData.balls || 0,
      highestScore: statsData.highestScore || 0,
      fifties: statsData.fifties || 0,
      hundreds: statsData.hundreds || 0,
      fours: statsData.fours || 0,
      sixes: statsData.sixes || 0,
      average: statsData.average || 0,
      strikeRate: statsData.strikeRate || 0,
      overs: statsData.overs || 0,
      wickets: statsData.wickets || 0,
      bestBowling: statsData.bestBowling || null,
      economyRate: statsData.economyRate || 0,
      catches: statsData.catches || 0,
      runOuts: statsData.runOuts || 0,
      stumpings: statsData.stumpings || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.playerTournamentStats.set(key, stats);
    return stats;
  }

  async getPlayerTournamentStats(tournamentId: number, userId: number): Promise<PlayerTournamentStats | undefined> {
    return this.playerTournamentStats.get(`${tournamentId}-${userId}`);
  }

  async getAllPlayerTournamentStats(tournamentId: number): Promise<(PlayerTournamentStats & { user: User })[]> {
    const stats = Array.from(this.playerTournamentStats.values())
      .filter(stat => stat.tournamentId === tournamentId);
    
    return Promise.all(stats.map(async stat => {
      const user = await this.getUser(stat.userId) as User;
      return { ...stat, user };
    }));
  }
  
  async getPlayerTournamentStatsByTournament(tournamentId: number): Promise<PlayerTournamentStats[]> {
    return Array.from(this.playerTournamentStats.values())
      .filter(stat => stat.tournamentId === tournamentId);
  }

  async updatePlayerTournamentStats(tournamentId: number, userId: number, data: Partial<PlayerTournamentStats>): Promise<PlayerTournamentStats | undefined> {
    const key = `${tournamentId}-${userId}`;
    const stats = this.playerTournamentStats.get(key);
    
    if (!stats) return undefined;
    
    const updatedStats = { 
      ...stats, 
      ...data,
      updatedAt: new Date()
    };
    
    this.playerTournamentStats.set(key, updatedStats);
    return updatedStats;
  }

  // Enhanced Social Graph methods - placeholder implementations for MemStorage
  // These will be properly implemented in DatabaseStorage
  
  // Relationship management
  async createUserRelationship(relationship: InsertUserRelationship): Promise<UserRelationship> {
    throw new Error("Social graph methods not implemented in MemStorage. Use DatabaseStorage instead.");
  }
  
  async deleteUserRelationship(userId: number, targetUserId: number, relationshipType: string): Promise<boolean> {
    throw new Error("Social graph methods not implemented in MemStorage. Use DatabaseStorage instead.");
  }
  
  async getUserRelationships(userId: number, relationshipType?: string): Promise<UserRelationship[]> {
    throw new Error("Social graph methods not implemented in MemStorage. Use DatabaseStorage instead.");
  }
  
  async getRelationshipStatus(userId1: number, userId2: number): Promise<string> {
    throw new Error("Social graph methods not implemented in MemStorage. Use DatabaseStorage instead.");
  }
  
  // Follow requests
  async createFollowRequest(request: InsertFollowRequest): Promise<FollowRequest> {
    throw new Error("Social graph methods not implemented in MemStorage. Use DatabaseStorage instead.");
  }
  
  async updateFollowRequest(requestId: number, status: string): Promise<FollowRequest | undefined> {
    throw new Error("Social graph methods not implemented in MemStorage. Use DatabaseStorage instead.");
  }
  
  async getFollowRequest(requesterId: number, requestedId: number): Promise<FollowRequest | undefined> {
    throw new Error("Social graph methods not implemented in MemStorage. Use DatabaseStorage instead.");
  }
  
  async getPendingFollowRequestsForUser(userId: number): Promise<(FollowRequest & { requester: User })[]> {
    throw new Error("Social graph methods not implemented in MemStorage. Use DatabaseStorage instead.");
  }
  
  async getSentFollowRequests(userId: number): Promise<(FollowRequest & { requested: User })[]> {
    throw new Error("Social graph methods not implemented in MemStorage. Use DatabaseStorage instead.");
  }
  
  // Privacy settings
  async createUserPrivacySettings(settings: InsertUserPrivacySettings): Promise<UserPrivacySettings> {
    throw new Error("Social graph methods not implemented in MemStorage. Use DatabaseStorage instead.");
  }
  
  async getUserPrivacySettings(userId: number): Promise<UserPrivacySettings | undefined> {
    throw new Error("Social graph methods not implemented in MemStorage. Use DatabaseStorage instead.");
  }
  
  async updateUserPrivacySettings(userId: number, settings: Partial<UserPrivacySettings>): Promise<UserPrivacySettings | undefined> {
    throw new Error("Social graph methods not implemented in MemStorage. Use DatabaseStorage instead.");
  }
  
  // Close friends
  async addCloseFriend(closeFriend: InsertCloseFriend): Promise<CloseFriend> {
    throw new Error("Social graph methods not implemented in MemStorage. Use DatabaseStorage instead.");
  }
  
  async removeCloseFriend(userId: number, friendId: number): Promise<boolean> {
    throw new Error("Social graph methods not implemented in MemStorage. Use DatabaseStorage instead.");
  }
  
  async getCloseFriends(userId: number): Promise<User[]> {
    throw new Error("Social graph methods not implemented in MemStorage. Use DatabaseStorage instead.");
  }
  
  async isCloseFriend(userId: number, friendId: number): Promise<boolean> {
    throw new Error("Social graph methods not implemented in MemStorage. Use DatabaseStorage instead.");
  }
  
  // User restrictions (blocking, muting, restricting)
  async createUserRestriction(restriction: InsertUserRestriction): Promise<UserRestriction> {
    throw new Error("Social graph methods not implemented in MemStorage. Use DatabaseStorage instead.");
  }
  
  async removeUserRestriction(restricterId: number, restrictedId: number, restrictionType: string): Promise<boolean> {
    throw new Error("Social graph methods not implemented in MemStorage. Use DatabaseStorage instead.");
  }
  
  async getUserRestrictions(userId: number, restrictionType?: string): Promise<UserRestriction[]> {
    throw new Error("Social graph methods not implemented in MemStorage. Use DatabaseStorage instead.");
  }
  
  async isUserRestricted(restricterId: number, restrictedId: number, restrictionType: string): Promise<boolean> {
    throw new Error("Social graph methods not implemented in MemStorage. Use DatabaseStorage instead.");
  }
}

// Hybrid DatabaseStorage - migrates core entities to PostgreSQL while delegating unported methods to MemStorage
import { db } from "./db";
import { eq, and, or, desc, asc, sql as drizzleSql, like, inArray, isNotNull } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  private memStorage: MemStorage; // Fallback for unported methods
  
  constructor() {
    this.memStorage = new MemStorage();
    if (!db) {
      throw new Error("Database connection not available. DatabaseStorage requires DATABASE_URL to be set.");
    }
  }
  
  // Delegate sessionStore to MemStorage (will be migrated in Task 2.7)
  get sessionStore() {
    return this.memStorage.sessionStore;
  }
  
  // Helper to ensure db is available
  private ensureDb() {
    if (!db) {
      throw new Error("Database connection not available");
    }
    return db;
  }
  
  // ===================
  // USER METHODS (Core - Migrated to PostgreSQL)
  // ===================
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await this.ensureDb().select().from(users).where(eq(users.id, id));
    return user || undefined;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.ensureDb().select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.ensureDb().select().from(users).where(eq(users.email, email));
    return user || undefined;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.ensureDb()
      .insert(users)
      .values({
        ...insertUser,
        fullName: insertUser.fullName ?? null,
        bio: insertUser.bio ?? null,
        location: insertUser.location ?? null,
        profileImage: insertUser.profileImage ?? null,
        isPlayer: insertUser.isPlayer ?? false,
        emailVerified: false,
        createdAt: new Date()
      })
      .returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await this.ensureDb()
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }
  
  async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    const searchPattern = `%${query}%`;
    return await this.ensureDb()
      .select()
      .from(users)
      .where(
        or(
          like(users.username, searchPattern),
          like(users.fullName, searchPattern),
          like(users.email, searchPattern)
        )
      )
      .limit(limit);
  }
  
  // ===================
  // TOKEN METHODS (Core - Migrated to PostgreSQL)
  // ===================
  
  async createToken(insertToken: InsertToken): Promise<Token> {
    const [token] = await this.ensureDb()
      .insert(tokens)
      .values({
        ...insertToken,
        createdAt: new Date()
      })
      .returning();
    return token;
  }
  
  async getTokenByToken(tokenString: string): Promise<Token | undefined> {
    const [token] = await this.ensureDb().select().from(tokens).where(eq(tokens.token, tokenString));
    return token || undefined;
  }
  
  async deleteToken(id: number): Promise<boolean> {
    const result = await this.ensureDb().delete(tokens).where(eq(tokens.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  // ===================
  // POST METHODS (Core - Migrated to PostgreSQL)
  // ===================
  
  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await this.ensureDb()
      .insert(posts)
      .values({
        ...insertPost,
        createdAt: new Date()
      })
      .returning();
    return post;
  }
  
  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await this.ensureDb().select().from(posts).where(eq(posts.id, id));
    return post || undefined;
  }
  
  async getUserPosts(userId: number): Promise<Post[]> {
    return await this.ensureDb()
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
  }
  
  async getFeed(userId: number, limit: number = 20): Promise<(Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean })[]> {
    const dbInstance = this.ensureDb();
    // Get following IDs - only accepted follows
    const followingRows = await dbInstance
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(and(
        eq(follows.followerId, userId),
        eq(follows.status, "accepted")
      ));
    
    const followingIds = followingRows.map(row => row.followingId);
    followingIds.push(userId); // Include user's own posts
    
    // Get posts from following users
    const feedPosts = await dbInstance
      .select()
      .from(posts)
      .where(inArray(posts.userId, followingIds))
      .orderBy(desc(posts.createdAt))
      .limit(limit);
    
    // Enrich with user data and counts
    return await Promise.all(feedPosts.map(async post => {
      const [user] = await dbInstance.select().from(users).where(eq(users.id, post.userId));
      const likesCount = await dbInstance.select({ count: drizzleSql<number>`count(*)` }).from(likes).where(eq(likes.postId, post.id));
      const commentsCount = await dbInstance.select({ count: drizzleSql<number>`count(*)` }).from(comments).where(eq(comments.postId, post.id));
      const [userLike] = await dbInstance.select().from(likes).where(and(eq(likes.userId, userId), eq(likes.postId, post.id)));
      
      return {
        ...post,
        user: user!,
        likeCount: Number(likesCount[0]?.count || 0),
        commentCount: Number(commentsCount[0]?.count || 0),
        hasLiked: !!userLike
      };
    }));
  }
  
  async deletePost(id: number): Promise<boolean> {
    const result = await this.ensureDb().delete(posts).where(eq(posts.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  async getReels(userId: number, limit: number = 20): Promise<(Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean })[]> {
    const dbInstance = this.ensureDb();
    // Get following IDs - only accepted follows
    const followingRows = await dbInstance
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(and(
        eq(follows.followerId, userId),
        eq(follows.status, "accepted")
      ));
    
    const followingIds = followingRows.map(row => row.followingId);
    followingIds.push(userId);
    
    // Get reels (posts with videoUrl OR category='reel' or other reel categories)
    const reelCategories = ['reel', 'match_highlight', 'player_moment', 'training', 'fan_moment'];
    const reelPosts = await dbInstance
      .select()
      .from(posts)
      .where(
        and(
          inArray(posts.userId, followingIds),
          or(
            isNotNull(posts.videoUrl),
            inArray(posts.category, reelCategories)
          )
        )
      )
      .orderBy(desc(posts.createdAt))
      .limit(limit);
    
    // Filter out posts without videoUrl (safety check)
    const filteredPosts = reelPosts.filter(post => post.videoUrl && post.videoUrl.trim() !== '');
    
    // Enrich with user data and counts
    return await Promise.all(filteredPosts.map(async post => {
      const [user] = await dbInstance.select().from(users).where(eq(users.id, post.userId));
      const likesCount = await dbInstance.select({ count: drizzleSql<number>`count(*)` }).from(likes).where(eq(likes.postId, post.id));
      const commentsCount = await dbInstance.select({ count: drizzleSql<number>`count(*)` }).from(comments).where(eq(comments.postId, post.id));
      const [userLike] = await dbInstance.select().from(likes).where(and(eq(likes.userId, userId), eq(likes.postId, post.id)));
      
      return {
        ...post,
        user: user!,
        likeCount: Number(likesCount[0]?.count || 0),
        commentCount: Number(commentsCount[0]?.count || 0),
        hasLiked: !!userLike
      };
    }));
  }
  
  // ===================
  // LIKE METHODS (Core - Migrated to PostgreSQL)
  // ===================
  
  async likePost(insertLike: InsertLike): Promise<Like> {
    // Check if like already exists
    const existingLike = await this.getLike(insertLike.userId, insertLike.postId);
    if (existingLike) return existingLike;
    
    const [like] = await this.ensureDb()
      .insert(likes)
      .values({
        ...insertLike,
        createdAt: new Date()
      })
      .returning();
    return like;
  }
  
  async unlikePost(userId: number, postId: number): Promise<boolean> {
    const result = await this.ensureDb()
      .delete(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  async getLike(userId: number, postId: number): Promise<Like | undefined> {
    const [like] = await this.ensureDb()
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
    return like || undefined;
  }
  
  async getLikesForPost(postId: number): Promise<Like[]> {
    return await this.ensureDb().select().from(likes).where(eq(likes.postId, postId));
  }
  
  // ===================
  // COMMENT METHODS (Core - Migrated to PostgreSQL)
  // ===================
  
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await this.ensureDb()
      .insert(comments)
      .values({
        ...insertComment,
        createdAt: new Date()
      })
      .returning();
    return comment;
  }
  
  async getCommentsForPost(postId: number): Promise<(Comment & { user: User, likeCount: number, replyCount: number, hasLiked: boolean })[]> {
    const dbInstance = this.ensureDb();
    const postComments = await dbInstance
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(asc(comments.createdAt));
    
    return await Promise.all(postComments.map(async comment => {
      const [user] = await dbInstance.select().from(users).where(eq(users.id, comment.userId));
      const likesCount = await dbInstance.select({ count: drizzleSql<number>`count(*)` }).from(commentLikes).where(eq(commentLikes.commentId, comment.id));
      const repliesCount = await dbInstance.select({ count: drizzleSql<number>`count(*)` }).from(comments).where(eq(comments.parentId, comment.id));
      // Note: hasLiked would need userId context, but interface doesn't provide it. Setting to false for now.
      return { 
        ...comment, 
        user: user!,
        likeCount: Number(likesCount[0]?.count || 0),
        replyCount: Number(repliesCount[0]?.count || 0),
        hasLiked: false
      };
    }));
  }
  
  async deleteComment(id: number): Promise<boolean> {
    const result = await this.ensureDb().delete(comments).where(eq(comments.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateComment(id: number, data: Partial<Comment>): Promise<Comment | undefined> {
    const [updated] = await this.ensureDb()
      .update(comments)
      .set(data)
      .where(eq(comments.id, id))
      .returning();
    return updated || undefined;
  }

  async unpinAllComments(postId: number): Promise<boolean> {
    const result = await this.ensureDb()
      .update(comments)
      .set({ isPinned: false })
      .where(eq(comments.postId, postId));
    return true;
  }
  
  // ===================
  // SAVED POSTS METHODS (Core - Migrated to PostgreSQL)
  // ===================
  
  async savePost(insertSave: InsertSavedPost): Promise<SavedPost> {
    // Check if save already exists
    const existingSave = await this.getSavedPost(insertSave.userId, insertSave.postId);
    if (existingSave) return existingSave;
    
    const [save] = await this.ensureDb()
      .insert(savedPosts)
      .values({
        ...insertSave,
        createdAt: new Date()
      })
      .returning();
    return save;
  }
  
  async unsavePost(userId: number, postId: number): Promise<boolean> {
    const result = await this.ensureDb()
      .delete(savedPosts)
      .where(and(eq(savedPosts.userId, userId), eq(savedPosts.postId, postId)));
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  async getSavedPost(userId: number, postId: number): Promise<SavedPost | undefined> {
    const [save] = await this.ensureDb()
      .select()
      .from(savedPosts)
      .where(and(eq(savedPosts.userId, userId), eq(savedPosts.postId, postId)));
    return save || undefined;
  }
  
  async getUserSavedPosts(userId: number): Promise<(Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean })[]> {
    const dbInstance = this.ensureDb();
    const userSaves = await dbInstance
      .select()
      .from(savedPosts)
      .where(eq(savedPosts.userId, userId))
      .orderBy(desc(savedPosts.createdAt));
    
    const postIds = userSaves.map(save => save.postId);
    if (postIds.length === 0) return [];
    
    const savedPostsData = await dbInstance
      .select()
      .from(posts)
      .where(inArray(posts.id, postIds));
    
    return await Promise.all(savedPostsData.map(async post => {
      const [user] = await dbInstance.select().from(users).where(eq(users.id, post.userId));
      const likesCount = await dbInstance.select({ count: drizzleSql<number>`count(*)` }).from(likes).where(eq(likes.postId, post.id));
      const commentsCount = await dbInstance.select({ count: drizzleSql<number>`count(*)` }).from(comments).where(eq(comments.postId, post.id));
      const [userLike] = await dbInstance.select().from(likes).where(and(eq(likes.userId, userId), eq(likes.postId, post.id)));
      
      return {
        ...post,
        user: user!,
        likeCount: Number(likesCount[0]?.count || 0),
        commentCount: Number(commentsCount[0]?.count || 0),
        hasLiked: !!userLike
      };
    }));
  }
  
  async getUserTaggedPosts(userId: number): Promise<(Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean })[]> {
    const dbInstance = this.ensureDb();
    
    // Get posts where user is mentioned
    const mentions = await dbInstance
      .select({ postId: postMentions.postId })
      .from(postMentions)
      .where(eq(postMentions.mentionedUserId, userId))
      .orderBy(desc(postMentions.createdAt));
    
    const postIds = mentions.map(m => m.postId);
    if (postIds.length === 0) return [];
    
    const taggedPostsData = await dbInstance
      .select()
      .from(posts)
      .where(inArray(posts.id, postIds));
    
    return await Promise.all(taggedPostsData.map(async post => {
      const [user] = await dbInstance.select().from(users).where(eq(users.id, post.userId));
      const likesCount = await dbInstance.select({ count: drizzleSql<number>`count(*)` }).from(likes).where(eq(likes.postId, post.id));
      const commentsCount = await dbInstance.select({ count: drizzleSql<number>`count(*)` }).from(comments).where(eq(comments.postId, post.id));
      const [userLike] = await dbInstance.select().from(likes).where(and(eq(likes.userId, userId), eq(likes.postId, post.id)));
      
      return {
        ...post,
        user: user!,
        likeCount: Number(likesCount[0]?.count || 0),
        commentCount: Number(commentsCount[0]?.count || 0),
        hasLiked: !!userLike
      };
    }));
  }
  
  // ===================
  // COMMENT LIKE METHODS (Core - Migrated to PostgreSQL)
  // ===================
  
  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await this.ensureDb().select().from(comments).where(eq(comments.id, id));
    return comment || undefined;
  }
  
  async getRepliesForComment(commentId: number): Promise<(Comment & { user: User, likeCount: number, hasLiked: boolean })[]> {
    const dbInstance = this.ensureDb();
    const replies = await dbInstance
      .select()
      .from(comments)
      .where(eq(comments.parentId, commentId))
      .orderBy(asc(comments.createdAt));
    
    return await Promise.all(replies.map(async reply => {
      const [user] = await dbInstance.select().from(users).where(eq(users.id, reply.userId));
      const likesCount = await dbInstance.select({ count: drizzleSql<number>`count(*)` }).from(commentLikes).where(eq(commentLikes.commentId, reply.id));
      return {
        ...reply,
        user: user!,
        likeCount: Number(likesCount[0]?.count || 0),
        hasLiked: false // Will be enriched by route handler
      };
    }));
  }
  
  async likeComment(insertLike: InsertCommentLike): Promise<CommentLike> {
    // Check if like already exists
    const existingLike = await this.getCommentLike(insertLike.userId, insertLike.commentId);
    if (existingLike) return existingLike;
    
    const [like] = await this.ensureDb()
      .insert(commentLikes)
      .values({
        ...insertLike,
        createdAt: new Date()
      })
      .returning();
    return like;
  }
  
  async unlikeComment(userId: number, commentId: number): Promise<boolean> {
    const result = await this.ensureDb()
      .delete(commentLikes)
      .where(and(eq(commentLikes.userId, userId), eq(commentLikes.commentId, commentId)));
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  async getCommentLike(userId: number, commentId: number): Promise<CommentLike | undefined> {
    const [like] = await this.ensureDb()
      .select()
      .from(commentLikes)
      .where(and(eq(commentLikes.userId, userId), eq(commentLikes.commentId, commentId)));
    return like || undefined;
  }
  
  async getCommentLikesCount(commentId: number): Promise<number> {
    const result = await this.ensureDb()
      .select({ count: drizzleSql<number>`count(*)` })
      .from(commentLikes)
      .where(eq(commentLikes.commentId, commentId));
    return Number(result[0]?.count || 0);
  }
  
  // ===================
  // POST SHARE METHODS (Core - Migrated to PostgreSQL)
  // ===================
  
  async createPostShare(insertShare: InsertPostShare): Promise<PostShare> {
    const [share] = await this.ensureDb()
      .insert(postShares)
      .values({
        ...insertShare,
        createdAt: new Date()
      })
      .returning();
    return share;
  }
  
  async getPostShares(postId: number): Promise<PostShare[]> {
    return await this.ensureDb()
      .select()
      .from(postShares)
      .where(eq(postShares.postId, postId))
      .orderBy(desc(postShares.createdAt));
  }
  
  async getPostShareCount(postId: number): Promise<number> {
    const result = await this.ensureDb()
      .select({ count: drizzleSql<number>`count(*)` })
      .from(postShares)
      .where(eq(postShares.postId, postId));
    return Number(result[0]?.count || 0);
  }
  
  // ===================
  // UNPORTED METHODS - Delegate to MemStorage
  // ===================
  
  // Content categorization and discovery methods
  async createTag(tag: InsertTag): Promise<Tag> {
    return this.memStorage.createTag(tag);
  }
  async getTags(type?: string): Promise<Tag[]> {
    return this.memStorage.getTags(type);
  }
  async getTagById(id: number): Promise<Tag | undefined> {
    return this.memStorage.getTagById(id);
  }
  async updateTagPopularity(id: number, increment: number): Promise<Tag | undefined> {
    return this.memStorage.updateTagPopularity(id, increment);
  }
  async addPostTag(postTag: InsertPostTag): Promise<PostTag> {
    return this.memStorage.addPostTag(postTag);
  }
  async getPostTags(postId: number): Promise<Tag[]> {
    return this.memStorage.getPostTags(postId);
  }
  async removePostTag(postId: number, tagId: number): Promise<boolean> {
    return this.memStorage.removePostTag(postId, tagId);
  }
  async createContentCategory(category: InsertContentCategory): Promise<ContentCategory> {
    return this.memStorage.createContentCategory(category);
  }
  async getContentCategories(): Promise<ContentCategory[]> {
    return this.memStorage.getContentCategories();
  }
  async updateUserInterest(interest: InsertUserInterest): Promise<UserInterest> {
    return this.memStorage.updateUserInterest(interest);
  }
  async getUserInterests(userId: number): Promise<(UserInterest & { tag: Tag })[]> {
    return this.memStorage.getUserInterests(userId);
  }
  async recordContentEngagement(engagement: InsertContentEngagement): Promise<ContentEngagement> {
    return this.memStorage.recordContentEngagement(engagement);
  }
  async getContentEngagementForUser(userId: number): Promise<ContentEngagement[]> {
    return this.memStorage.getContentEngagementForUser(userId);
  }
  async getPersonalizedFeed(userId: number, limit?: number): Promise<(Post & { 
    user: User, 
    likeCount: number, 
    commentCount: number, 
    hasLiked: boolean,
    tags: Tag[],
    relevanceScore: number
  })[]> {
    return this.memStorage.getPersonalizedFeed(userId, limit);
  }
  
  // Follow methods (Task 2.2)
  async followUser(follow: InsertFollow): Promise<Follow> {
    return this.memStorage.followUser(follow);
  }
  async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    const [follow] = await this.ensureDb()
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId)
        )
      );
    
    if (!follow) {
      return false;
    }
    
    await this.ensureDb()
      .delete(follows)
      .where(eq(follows.id, follow.id));
    
    return true;
  }
  async removeFollower(userId: number, followerIdToRemove: number): Promise<boolean> {
    const result = await this.ensureDb()
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, followerIdToRemove),
          eq(follows.followingId, userId),
          eq(follows.status, "accepted")
        )
      );
    return true;
  }
  async cancelFollowRequest(followerId: number, followingId: number): Promise<boolean> {
    const [follow] = await this.ensureDb()
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId),
          eq(follows.status, "pending")
        )
      );
    
    if (!follow) {
      return false;
    }
    
    await this.ensureDb()
      .delete(follows)
      .where(eq(follows.id, follow.id));
    
    return true;
  }
  async getFollowers(userId: number): Promise<User[]> {
    const followerRelations = await this.ensureDb()
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followingId, userId),
          eq(follows.status, "accepted")
        )
      );
    
    const followers = await Promise.all(
      followerRelations.map(async (f) => {
        const user = await this.getUser(f.followerId);
        return user;
      })
    );
    
    return followers.filter((u): u is User => u !== undefined);
  }
  async getFollowing(userId: number): Promise<User[]> {
    const followingRelations = await this.ensureDb()
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, userId),
          eq(follows.status, "accepted")
        )
      );
    
    const following = await Promise.all(
      followingRelations.map(async (f) => {
        const user = await this.getUser(f.followingId);
        return user;
      })
    );
    
    return following.filter((u): u is User => u !== undefined);
  }
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const [follow] = await this.ensureDb()
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId),
          eq(follows.status, "accepted")
        )
      );
    
    return !!follow;
  }
  async isMutualFollow(userId1: number, userId2: number): Promise<boolean> {
    const user1FollowsUser2 = await this.isFollowing(userId1, userId2);
    const user2FollowsUser1 = await this.isFollowing(userId2, userId1);
    return user1FollowsUser2 && user2FollowsUser1;
  }
  async getMutualFollowers(userId: number): Promise<User[]> {
    const followers = await this.getFollowers(userId);
    const following = await this.getFollowing(userId);
    const followingIds = new Set(following.map(u => u.id));
    return followers.filter(f => followingIds.has(f.id));
  }

  async getMutualFriends(userId1: number, userId2: number): Promise<User[]> {
    // Get users that both userId1 and userId2 follow
    const user1Following = await this.getFollowing(userId1);
    const user2Following = await this.getFollowing(userId2);
    
    const user2FollowingIds = new Set(user2Following.map(u => u.id));
    
    // Find users that both follow (excluding each other)
    return user1Following.filter(u => 
      user2FollowingIds.has(u.id) && 
      u.id !== userId1 && 
      u.id !== userId2
    );
  }

  async getFollowByUsers(followerId: number, followingId: number): Promise<Follow | undefined> {
    const [follow] = await this.ensureDb()
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId)
        )
      );
    
    return follow || undefined;
  }
  async getSuggestedUsers(userId: number, limit?: number): Promise<User[]> {
    // Get users the current user is following
    const following = await this.getFollowing(userId);
    const followingIds = new Set(following.map(u => u.id));
    followingIds.add(userId); // Exclude self
    
    // Get all users except those already followed
    const allUsers = await this.ensureDb()
      .select()
      .from(users)
      .limit(limit || 20);
    
    return allUsers.filter(u => !followingIds.has(u.id));
  }
  
  // Follow request methods
  async sendFollowRequest(followerId: number, followingId: number): Promise<Follow> {
    // Check if already following or has pending request
    const [existingFollow] = await this.ensureDb()
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId)
        )
      );
    
    if (existingFollow) {
      return existingFollow;
    }
    
    // Check if blocked in either direction
    const isBlockedByTarget = await this.isBlocked(followingId, followerId);
    const hasBlockedTarget = await this.isBlocked(followerId, followingId);
    
    if (isBlockedByTarget || hasBlockedTarget) {
      throw new Error("Cannot follow this user");
    }
    
    // Check if target user is private - use database, not memStorage
    const targetUser = await this.getUser(followingId);
    const status = targetUser?.isPrivate ? "pending" : "accepted";
    
    const [follow] = await this.ensureDb()
      .insert(follows)
      .values({
        followerId,
        followingId,
        status,
        createdAt: new Date(),
        acceptedAt: status === "accepted" ? new Date() : null
      })
      .returning();
    
    return follow;
  }
  async acceptFollowRequest(followId: number): Promise<Follow | null> {
    const [follow] = await this.ensureDb()
      .select()
      .from(follows)
      .where(eq(follows.id, followId));
    
    if (!follow || follow.status !== "pending") {
      return null;
    }
    
    const [updatedFollow] = await this.ensureDb()
      .update(follows)
      .set({
        status: "accepted",
        acceptedAt: new Date()
      })
      .where(eq(follows.id, followId))
      .returning();
    
    return updatedFollow;
  }
  async rejectFollowRequest(followId: number): Promise<boolean> {
    const [follow] = await this.ensureDb()
      .select()
      .from(follows)
      .where(eq(follows.id, followId));
    
    if (!follow || follow.status !== "pending") {
      return false;
    }
    
    // Delete the request completely - NO notification sent (silent action)
    await this.ensureDb()
      .delete(follows)
      .where(eq(follows.id, followId));
    
    return true;
  }
  async getPendingFollowRequests(userId: number): Promise<(Follow & { follower: User })[]> {
    const pendingRequests = await this.ensureDb()
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followingId, userId),
          eq(follows.status, "pending")
        )
      );
    
    const requestsWithUsers = await Promise.all(
      pendingRequests.map(async (follow) => {
        const follower = await this.getUser(follow.followerId);
        if (!follower) return null;
        return { ...follow, follower };
      })
    );
    
    return requestsWithUsers.filter((req): req is (Follow & { follower: User }) => req !== null);
  }
  async getFollowRequestStatus(followerId: number, followingId: number): Promise<string | null> {
    const [follow] = await this.ensureDb()
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId)
        )
      );
    
    return follow ? follow.status : null;
  }
  
  // Notification methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await this.ensureDb()
      .insert(notifications)
      .values({
        ...notification,
        isRead: false,
        createdAt: new Date()
      })
      .returning();
    return created;
  }
  async getUserNotifications(userId: number, limit?: number): Promise<(Notification & { fromUser?: User })[]> {
    const userNotifications = await this.ensureDb()
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit || 50);
    
    const notificationsWithUsers = await Promise.all(
      userNotifications.map(async (notification) => {
        if (notification.fromUserId) {
          const fromUser = await this.getUser(notification.fromUserId);
          return { ...notification, fromUser };
        }
        return notification;
      })
    );
    
    return notificationsWithUsers;
  }
  async markNotificationAsRead(notificationId: number): Promise<boolean> {
    await this.ensureDb()
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
    return true;
  }
  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    await this.ensureDb()
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
    return true;
  }
  async getUnreadNotificationCount(userId: number): Promise<number> {
    const result = await this.ensureDb()
      .select({ count: drizzleSql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
    return Number(result[0]?.count || 0);
  }
  async deleteNotification(notificationId: number): Promise<boolean> {
    await this.ensureDb()
      .delete(notifications)
      .where(eq(notifications.id, notificationId));
    return true;
  }
  
  // Block methods (Task 2.2)
  async blockUser(block: InsertBlockedUser): Promise<BlockedUser> {
    return this.memStorage.blockUser(block);
  }
  async unblockUser(blockerId: number, blockedId: number): Promise<boolean> {
    return this.memStorage.unblockUser(blockerId, blockedId);
  }
  async isBlocked(blockerId: number, blockedId: number): Promise<boolean> {
    return this.memStorage.isBlocked(blockerId, blockedId);
  }
  async getBlockedUsers(userId: number): Promise<User[]> {
    return this.memStorage.getBlockedUsers(userId);
  }
  
  // Chat methods (Task 2.3)
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    return this.memStorage.createConversation(conversation);
  }
  async getConversation(user1Id: number, user2Id: number): Promise<Conversation | undefined> {
    return this.memStorage.getConversation(user1Id, user2Id);
  }
  async getConversationById(id: number): Promise<Conversation | undefined> {
    return this.memStorage.getConversationById(id);
  }
  async getUserConversations(userId: number): Promise<(Conversation & { 
    otherUser: Omit<User, 'password'>, 
    lastMessage: Message | null,
    unreadCount: number 
  })[]> {
    return this.memStorage.getUserConversations(userId);
  }
  
  // Message methods (Task 2.3)
  async createMessage(message: InsertMessage): Promise<Message> {
    return this.memStorage.createMessage(message);
  }
  async getConversationMessages(conversationId: number): Promise<(Message & { sender: Omit<User, 'password'> })[]> {
    return this.memStorage.getConversationMessages(conversationId);
  }
  async markMessagesAsRead(conversationId: number, userId: number): Promise<boolean> {
    return this.memStorage.markMessagesAsRead(conversationId, userId);
  }
  async deleteMessage(id: number, userId: number): Promise<boolean> {
    return this.memStorage.deleteMessage(id, userId);
  }
  
  // Story methods (Task 2.4)
  async createStory(story: InsertStory): Promise<Story> {
    return this.memStorage.createStory(story);
  }
  async getUserStories(userId: number): Promise<Story[]> {
    return this.memStorage.getUserStories(userId);
  }
  async getStoriesForFeed(userId: number): Promise<(Story & { user: User })[]> {
    return this.memStorage.getStoriesForFeed(userId);
  }
  async deleteExpiredStories(): Promise<void> {
    return this.memStorage.deleteExpiredStories();
  }
  async getStoryById(storyId: number): Promise<Story | null> {
    return this.memStorage.getStoryById(storyId);
  }
  
  // Story Views (Task 2.4)
  async createStoryView(view: InsertStoryView): Promise<StoryView> {
    return this.memStorage.createStoryView(view);
  }
  async incrementStoryViewCount(storyId: number): Promise<Story | null> {
    return this.memStorage.incrementStoryViewCount(storyId);
  }
  async hasUserViewedStories(viewerId: number, storyUserId: number): Promise<boolean> {
    return this.memStorage.hasUserViewedStories(viewerId, storyUserId);
  }
  
  // Story Reactions (Task 2.4)
  async createStoryReaction(reaction: InsertStoryReaction): Promise<StoryReaction> {
    return this.memStorage.createStoryReaction(reaction);
  }
  async getStoryReaction(storyId: number, userId: number): Promise<StoryReaction | null> {
    return this.memStorage.getStoryReaction(storyId, userId);
  }
  async updateStoryReaction(reactionId: number, data: Partial<InsertStoryReaction>): Promise<StoryReaction | null> {
    return this.memStorage.updateStoryReaction(reactionId, data);
  }
  async deleteStoryReaction(reactionId: number): Promise<void> {
    return this.memStorage.deleteStoryReaction(reactionId);
  }
  async getStoryReactions(storyId: number): Promise<StoryReaction[]> {
    return this.memStorage.getStoryReactions(storyId);
  }
  
  // Story Comments (Task 2.4)
  async createStoryComment(comment: InsertStoryComment): Promise<StoryComment> {
    return this.memStorage.createStoryComment(comment);
  }
  async getStoryComments(storyId: number): Promise<StoryComment[]> {
    return this.memStorage.getStoryComments(storyId);
  }
  async getStoryCommentById(commentId: number): Promise<StoryComment | null> {
    return this.memStorage.getStoryCommentById(commentId);
  }
  async deleteStoryComment(commentId: number): Promise<void> {
    return this.memStorage.deleteStoryComment(commentId);
  }

  // Story Poll methods
  async createStoryPoll(poll: InsertStoryPoll): Promise<StoryPoll> {
    const [created] = await this.ensureDb()
      .insert(storyPolls)
      .values(poll)
      .returning();
    return created;
  }
  async getStoryPoll(storyId: number): Promise<StoryPoll | null> {
    const [poll] = await this.ensureDb()
      .select()
      .from(storyPolls)
      .where(eq(storyPolls.storyId, storyId));
    return poll || null;
  }
  async createStoryPollVote(vote: InsertStoryPollVote): Promise<StoryPollVote> {
    const [created] = await this.ensureDb()
      .insert(storyPollVotes)
      .values(vote)
      .returning();
    return created;
  }
  async getStoryPollVotes(pollId: number): Promise<StoryPollVote[]> {
    return await this.ensureDb()
      .select()
      .from(storyPollVotes)
      .where(eq(storyPollVotes.pollId, pollId));
  }
  async getUserStoryPollVote(pollId: number, userId: number): Promise<StoryPollVote | null> {
    const [vote] = await this.ensureDb()
      .select()
      .from(storyPollVotes)
      .where(and(eq(storyPollVotes.pollId, pollId), eq(storyPollVotes.userId, userId)));
    return vote || null;
  }
  async updateStoryPollVote(voteId: number, optionNumber: number): Promise<StoryPollVote | null> {
    const [updated] = await this.ensureDb()
      .update(storyPollVotes)
      .set({ optionNumber })
      .where(eq(storyPollVotes.id, voteId))
      .returning();
    return updated || null;
  }

  // Story Question methods
  async createStoryQuestion(question: InsertStoryQuestion): Promise<StoryQuestion> {
    const [created] = await this.ensureDb()
      .insert(storyQuestions)
      .values(question)
      .returning();
    return created;
  }
  async getStoryQuestion(storyId: number): Promise<StoryQuestion | null> {
    const [question] = await this.ensureDb()
      .select()
      .from(storyQuestions)
      .where(eq(storyQuestions.storyId, storyId));
    return question || null;
  }
  async createStoryQuestionResponse(response: InsertStoryQuestionResponse): Promise<StoryQuestionResponse> {
    const [created] = await this.ensureDb()
      .insert(storyQuestionResponses)
      .values(response)
      .returning();
    return created;
  }
  async getStoryQuestionResponses(questionId: number): Promise<StoryQuestionResponse[]> {
    return await this.ensureDb()
      .select()
      .from(storyQuestionResponses)
      .where(eq(storyQuestionResponses.questionId, questionId))
      .orderBy(desc(storyQuestionResponses.createdAt));
  }
  
  // Player Stats methods (Task 2.5)
  async createPlayerStats(stats: InsertPlayerStats): Promise<PlayerStats> {
    return this.memStorage.createPlayerStats(stats);
  }
  async getPlayerStats(userId: number): Promise<PlayerStats | undefined> {
    return this.memStorage.getPlayerStats(userId);
  }
  async updatePlayerStats(userId: number, stats: Partial<PlayerStats>): Promise<PlayerStats | undefined> {
    return this.memStorage.updatePlayerStats(userId, stats);
  }
  
  // Player Match methods (Task 2.5)
  async createPlayerMatch(match: InsertPlayerMatch): Promise<PlayerMatch> {
    return this.memStorage.createPlayerMatch(match);
  }
  async getPlayerMatch(id: number): Promise<PlayerMatch | undefined> {
    return this.memStorage.getPlayerMatch(id);
  }
  async getUserMatches(userId: number): Promise<PlayerMatch[]> {
    return this.memStorage.getUserMatches(userId);
  }
  async getMatchesByCreator(userId: number): Promise<Match[]> {
    return this.memStorage.getMatchesByCreator(userId);
  }
  
  // Player Match Performance methods (Task 2.5)
  async createPlayerMatchPerformance(performance: InsertPlayerMatchPerformance): Promise<PlayerMatchPerformance> {
    return this.memStorage.createPlayerMatchPerformance(performance);
  }
  async getPlayerMatchPerformance(userId: number, matchId: number): Promise<PlayerMatchPerformance | undefined> {
    return this.memStorage.getPlayerMatchPerformance(userId, matchId);
  }
  async getMatchPerformances(matchId: number): Promise<(PlayerMatchPerformance & { user: User })[]> {
    return this.memStorage.getMatchPerformances(matchId);
  }
  
  // Match management methods (Task 2.5)
  async createMatch(match: InsertMatch): Promise<Match> {
    return this.memStorage.createMatch(match);
  }
  async getMatchById(id: number): Promise<Match | undefined> {
    return this.memStorage.getMatchById(id);
  }
  async updateMatch(id: number, matchData: Partial<Match>): Promise<Match | undefined> {
    return this.memStorage.updateMatch(id, matchData);
  }
  async deleteMatch(id: number): Promise<boolean> {
    return this.memStorage.deleteMatch(id);
  }
  
  // Team management methods (Task 2.5)
  async createTeam(team: InsertTeam): Promise<Team> {
    return this.memStorage.createTeam(team);
  }
  async getTeamById(id: number): Promise<Team | undefined> {
    return this.memStorage.getTeamById(id);
  }
  async getTeamByName(name: string): Promise<Team | undefined> {
    return this.memStorage.getTeamByName(name);
  }
  async getTeamByNameOrCreate(team: Partial<InsertTeam>): Promise<Team> {
    return this.memStorage.getTeamByNameOrCreate(team);
  }
  async getUserTeams(userId: number): Promise<Team[]> {
    return this.memStorage.getUserTeams(userId);
  }
  async updateTeam(id: number, teamData: Partial<Team>): Promise<Team | undefined> {
    return this.memStorage.updateTeam(id, teamData);
  }
  async deleteTeam(id: number): Promise<boolean> {
    return this.memStorage.deleteTeam(id);
  }
  
  // Match player management methods (Task 2.5)
  async addMatchPlayer(player: InsertMatchPlayer): Promise<MatchPlayer> {
    return this.memStorage.addMatchPlayer(player);
  }
  async getMatchPlayersByTeam(matchId: number, teamId: number): Promise<MatchPlayer[]> {
    return this.memStorage.getMatchPlayersByTeam(matchId, teamId);
  }
  async updateMatchPlayer(id: number, playerData: Partial<MatchPlayer>): Promise<MatchPlayer | undefined> {
    return this.memStorage.updateMatchPlayer(id, playerData);
  }
  async removeMatchPlayer(id: number): Promise<boolean> {
    return this.memStorage.removeMatchPlayer(id);
  }
  
  // Ball-by-ball data methods (Task 2.5)
  async recordBallByBall(ball: InsertBallByBall): Promise<BallByBall> {
    return this.memStorage.recordBallByBall(ball);
  }
  async getMatchBalls(matchId: number): Promise<BallByBall[]> {
    return this.memStorage.getMatchBalls(matchId);
  }
  
  // Venue management methods (Task 2.6)
  async createVenue(venue: InsertVenue): Promise<Venue> {
    return this.memStorage.createVenue(venue);
  }
  async getVenue(id: number): Promise<Venue | undefined> {
    return this.memStorage.getVenue(id);
  }
  async getVenueByName(name: string): Promise<Venue | undefined> {
    return this.memStorage.getVenueByName(name);
  }
  async getVenues(query?: string, limit?: number): Promise<Venue[]> {
    return this.memStorage.getVenues(query, limit);
  }
  async getNearbyVenues(lat: number, lng: number, radiusKm: number): Promise<Venue[]> {
    return this.memStorage.getNearbyVenues(lat, lng, radiusKm);
  }
  async updateVenue(id: number, venueData: Partial<Venue>): Promise<Venue | undefined> {
    return this.memStorage.updateVenue(id, venueData);
  }
  async deleteVenue(id: number): Promise<boolean> {
    return this.memStorage.deleteVenue(id);
  }
  async getUserVenues(userId: number): Promise<Venue[]> {
    return this.memStorage.getUserVenues(userId);
  }
  
  // Venue availability methods (Task 2.6)
  async createVenueAvailability(availability: InsertVenueAvailability): Promise<VenueAvailability> {
    return this.memStorage.createVenueAvailability(availability);
  }
  async getVenueAvailabilities(venueId: number): Promise<VenueAvailability[]> {
    return this.memStorage.getVenueAvailabilities(venueId);
  }
  async updateVenueAvailability(id: number, data: Partial<VenueAvailability>): Promise<VenueAvailability | undefined> {
    return this.memStorage.updateVenueAvailability(id, data);
  }
  async deleteVenueAvailability(id: number): Promise<boolean> {
    return this.memStorage.deleteVenueAvailability(id);
  }
  
  // Venue booking methods (Task 2.6)
  async createVenueBooking(booking: InsertVenueBooking): Promise<VenueBooking> {
    return this.memStorage.createVenueBooking(booking);
  }
  async getVenueBooking(id: number): Promise<VenueBooking | undefined> {
    return this.memStorage.getVenueBooking(id);
  }
  async getUserBookings(userId: number): Promise<(VenueBooking & { venue: Venue })[]> {
    return this.memStorage.getUserBookings(userId);
  }
  async getVenueBookings(venueId: number, startDate?: Date, endDate?: Date): Promise<(VenueBooking & { user: User })[]> {
    return this.memStorage.getVenueBookings(venueId, startDate, endDate);
  }
  async updateVenueBooking(id: number, data: Partial<VenueBooking>): Promise<VenueBooking | undefined> {
    return this.memStorage.updateVenueBooking(id, data);
  }
  async cancelVenueBooking(id: number): Promise<boolean> {
    return this.memStorage.cancelVenueBooking(id);
  }
  async checkVenueAvailability(venueId: number, date: Date, startTime: string, endTime: string): Promise<boolean> {
    return this.memStorage.checkVenueAvailability(venueId, date, startTime, endTime);
  }
  
  // Tournament methods (Task 2.6)
  async createTournament(tournament: InsertTournament): Promise<Tournament> {
    return this.memStorage.createTournament(tournament);
  }
  async getTournament(id: number): Promise<Tournament | undefined> {
    return this.memStorage.getTournament(id);
  }
  async getTournaments(query?: string, status?: string, limit?: number): Promise<Tournament[]> {
    return this.memStorage.getTournaments(query, status, limit);
  }
  async getUserTournaments(userId: number): Promise<Tournament[]> {
    return this.memStorage.getUserTournaments(userId);
  }
  async updateTournament(id: number, data: Partial<Tournament>): Promise<Tournament | undefined> {
    return this.memStorage.updateTournament(id, data);
  }
  async deleteTournament(id: number): Promise<boolean> {
    return this.memStorage.deleteTournament(id);
  }
  
  // Tournament team methods (Task 2.6)
  async addTeamToTournament(teamData: InsertTournamentTeam): Promise<TournamentTeam> {
    return this.memStorage.addTeamToTournament(teamData);
  }
  async getTournamentTeams(tournamentId: number): Promise<(TournamentTeam & { team: Team })[]> {
    return this.memStorage.getTournamentTeams(tournamentId);
  }
  async updateTournamentTeam(tournamentId: number, teamId: number, data: Partial<TournamentTeam>): Promise<TournamentTeam | undefined> {
    return this.memStorage.updateTournamentTeam(tournamentId, teamId, data);
  }
  async removeTeamFromTournament(tournamentId: number, teamId: number): Promise<boolean> {
    return this.memStorage.removeTeamFromTournament(tournamentId, teamId);
  }
  
  // Tournament match methods (Task 2.6)
  async createTournamentMatch(matchData: InsertTournamentMatch): Promise<TournamentMatch> {
    return this.memStorage.createTournamentMatch(matchData);
  }
  async getTournamentMatch(id: number): Promise<TournamentMatch | undefined> {
    return this.memStorage.getTournamentMatch(id);
  }
  async getTournamentMatches(tournamentId: number): Promise<(TournamentMatch & { match: Match, venue?: Venue })[]> {
    return this.memStorage.getTournamentMatches(tournamentId);
  }
  async updateTournamentMatch(id: number, data: Partial<TournamentMatch>): Promise<TournamentMatch | undefined> {
    return this.memStorage.updateTournamentMatch(id, data);
  }
  async deleteTournamentMatch(id: number): Promise<boolean> {
    return this.memStorage.deleteTournamentMatch(id);
  }
  
  // Tournament standings methods (Task 2.6)
  async createTournamentStanding(standingData: InsertTournamentStanding): Promise<TournamentStanding> {
    return this.memStorage.createTournamentStanding(standingData);
  }
  async getTournamentStanding(id: number): Promise<TournamentStanding | undefined> {
    return this.memStorage.getTournamentStanding(id);
  }
  async getTournamentStandingByTeam(tournamentId: number, teamId: number): Promise<TournamentStanding | undefined> {
    return this.memStorage.getTournamentStandingByTeam(tournamentId, teamId);
  }
  async getTournamentStandingsByTournament(tournamentId: number): Promise<TournamentStanding[]> {
    return this.memStorage.getTournamentStandingsByTournament(tournamentId);
  }
  async updateTournamentStanding(id: number, data: Partial<TournamentStanding>): Promise<TournamentStanding | undefined> {
    return this.memStorage.updateTournamentStanding(id, data);
  }
  async deleteTournamentStanding(id: number): Promise<boolean> {
    return this.memStorage.deleteTournamentStanding(id);
  }
  
  // Tournament match queries (Task 2.6)
  async getTournamentMatchesByTournament(tournamentId: number): Promise<TournamentMatch[]> {
    return this.memStorage.getTournamentMatchesByTournament(tournamentId);
  }
  
  // Player tournament stats methods (Task 2.6)
  async createPlayerTournamentStats(statsData: InsertPlayerTournamentStats): Promise<PlayerTournamentStats> {
    return this.memStorage.createPlayerTournamentStats(statsData);
  }
  async getPlayerTournamentStats(tournamentId: number, userId: number): Promise<PlayerTournamentStats | undefined> {
    return this.memStorage.getPlayerTournamentStats(tournamentId, userId);
  }
  async getAllPlayerTournamentStats(tournamentId: number): Promise<(PlayerTournamentStats & { user: User })[]> {
    return this.memStorage.getAllPlayerTournamentStats(tournamentId);
  }
  async getPlayerTournamentStatsByTournament(tournamentId: number): Promise<PlayerTournamentStats[]> {
    return this.memStorage.getPlayerTournamentStatsByTournament(tournamentId);
  }
  async updatePlayerTournamentStats(tournamentId: number, userId: number, data: Partial<PlayerTournamentStats>): Promise<PlayerTournamentStats | undefined> {
    return this.memStorage.updatePlayerTournamentStats(tournamentId, userId, data);
  }
  
  // Poll methods (Task 2.6)
  async createPoll(poll: InsertPoll): Promise<Poll> {
    return this.memStorage.createPoll(poll);
  }
  async getPoll(id: number): Promise<(Poll & { options: PollOption[], creator: User }) | undefined> {
    return this.memStorage.getPoll(id);
  }
  async getPolls(limit?: number, type?: string): Promise<(Poll & { options: PollOption[], creator: User })[]> {
    return this.memStorage.getPolls(limit, type);
  }
  async getUserPolls(userId: number): Promise<(Poll & { options: PollOption[] })[]> {
    return this.memStorage.getUserPolls(userId);
  }
  async updatePoll(id: number, data: Partial<Poll>): Promise<Poll | undefined> {
    return this.memStorage.updatePoll(id, data);
  }
  async deletePoll(id: number): Promise<boolean> {
    return this.memStorage.deletePoll(id);
  }
  
  // Poll option methods (Task 2.6)
  async createPollOption(option: InsertPollOption): Promise<PollOption> {
    return this.memStorage.createPollOption(option);
  }
  async getPollOption(id: number): Promise<PollOption | undefined> {
    return this.memStorage.getPollOption(id);
  }
  async getPollOptions(pollId: number): Promise<PollOption[]> {
    return this.memStorage.getPollOptions(pollId);
  }
  async updatePollOption(id: number, data: Partial<PollOption>): Promise<PollOption | undefined> {
    return this.memStorage.updatePollOption(id, data);
  }
  async deletePollOption(id: number): Promise<boolean> {
    return this.memStorage.deletePollOption(id);
  }
  
  // Poll vote methods (Task 2.6)
  async createPollVote(vote: InsertPollVote): Promise<PollVote> {
    return this.memStorage.createPollVote(vote);
  }
  async getUserVote(userId: number, pollId: number): Promise<PollVote | undefined> {
    return this.memStorage.getUserVote(userId, pollId);
  }
  async getPollVotes(pollId: number): Promise<(PollVote & { user: User })[]> {
    return this.memStorage.getPollVotes(pollId);
  }
  async getPollResults(pollId: number): Promise<{ optionId: number, option: string, count: number, percentage: number }[]> {
    return this.memStorage.getPollResults(pollId);
  }
  async deletePollVote(userId: number, pollId: number): Promise<boolean> {
    return this.memStorage.deletePollVote(userId, pollId);
  }

  // ===================
  // ENHANCED SOCIAL GRAPH METHODS (Migrated to PostgreSQL)
  // ===================
  
  // Relationship management
  async createUserRelationship(relationship: InsertUserRelationship): Promise<UserRelationship> {
    const db = this.ensureDb();
    const [result] = await db.insert(userRelationships).values(relationship).returning();
    return result;
  }
  
  async deleteUserRelationship(userId: number, targetUserId: number, relationshipType: string): Promise<boolean> {
    const db = this.ensureDb();
    const result = await db.delete(userRelationships)
      .where(
        and(
          eq(userRelationships.userId, userId),
          eq(userRelationships.targetUserId, targetUserId),
          eq(userRelationships.relationshipType, relationshipType)
        )
      );
    return result.rowCount > 0;
  }
  
  async getUserRelationships(userId: number, relationshipType?: string): Promise<UserRelationship[]> {
    const db = this.ensureDb();
    const conditions = [eq(userRelationships.userId, userId)];
    if (relationshipType) {
      conditions.push(eq(userRelationships.relationshipType, relationshipType));
    }
    
    return await db.select()
      .from(userRelationships)
      .where(and(...conditions))
      .orderBy(desc(userRelationships.createdAt));
  }
  
  async getRelationshipStatus(userId1: number, userId2: number): Promise<string> {
    // Use the SocialGraphService to get comprehensive relationship status
    const { socialGraphService } = await import('./services/social-graph');
    const status = await socialGraphService.getRelationshipStatus(userId1, userId2);
    return status;
  }
  
  // Follow requests
  async createFollowRequest(request: InsertFollowRequest): Promise<FollowRequest> {
    const db = this.ensureDb();
    const [result] = await db.insert(followRequests).values(request).returning();
    return result;
  }
  
  async updateFollowRequest(requestId: number, status: string): Promise<FollowRequest | undefined> {
    const db = this.ensureDb();
    const [result] = await db.update(followRequests)
      .set({ 
        status, 
        respondedAt: new Date() 
      })
      .where(eq(followRequests.id, requestId))
      .returning();
    return result;
  }
  
  async getFollowRequest(requesterId: number, requestedId: number): Promise<FollowRequest | undefined> {
    const db = this.ensureDb();
    const [result] = await db.select()
      .from(followRequests)
      .where(
        and(
          eq(followRequests.requesterId, requesterId),
          eq(followRequests.requestedId, requestedId)
        )
      )
      .limit(1);
    return result;
  }
  
  async getPendingFollowRequestsForUser(userId: number): Promise<(FollowRequest & { requester: User })[]> {
    const db = this.ensureDb();
    return await db.select({
      id: followRequests.id,
      requesterId: followRequests.requesterId,
      requestedId: followRequests.requestedId,
      status: followRequests.status,
      createdAt: followRequests.createdAt,
      respondedAt: followRequests.respondedAt,
      requester: {
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        profileImage: users.profileImage,
        verificationBadge: users.verificationBadge,
        isPrivate: users.isPrivate
      }
    })
    .from(followRequests)
    .innerJoin(users, eq(followRequests.requesterId, users.id))
    .where(
      and(
        eq(followRequests.requestedId, userId),
        eq(followRequests.status, 'pending')
      )
    )
    .orderBy(desc(followRequests.createdAt)) as (FollowRequest & { requester: User })[];
  }
  
  async getSentFollowRequests(userId: number): Promise<(FollowRequest & { requested: User })[]> {
    const db = this.ensureDb();
    return await db.select({
      id: followRequests.id,
      requesterId: followRequests.requesterId,
      requestedId: followRequests.requestedId,
      status: followRequests.status,
      createdAt: followRequests.createdAt,
      respondedAt: followRequests.respondedAt,
      requested: {
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        profileImage: users.profileImage,
        verificationBadge: users.verificationBadge,
        isPrivate: users.isPrivate
      }
    })
    .from(followRequests)
    .innerJoin(users, eq(followRequests.requestedId, users.id))
    .where(
      and(
        eq(followRequests.requesterId, userId),
        eq(followRequests.status, 'pending')
      )
    )
    .orderBy(desc(followRequests.createdAt)) as (FollowRequest & { requested: User })[];
  }
  
  // Privacy settings
  async createUserPrivacySettings(settings: InsertUserPrivacySettings): Promise<UserPrivacySettings> {
    const db = this.ensureDb();
    const [result] = await db.insert(userPrivacySettings).values(settings).returning();
    return result;
  }
  
  async getUserPrivacySettings(userId: number): Promise<UserPrivacySettings | undefined> {
    const db = this.ensureDb();
    const [result] = await db.select()
      .from(userPrivacySettings)
      .where(eq(userPrivacySettings.userId, userId))
      .limit(1);
    return result;
  }
  
  async updateUserPrivacySettings(userId: number, settings: Partial<UserPrivacySettings>): Promise<UserPrivacySettings | undefined> {
    const db = this.ensureDb();
    const [result] = await db.update(userPrivacySettings)
      .set({ 
        ...settings, 
        updatedAt: new Date() 
      })
      .where(eq(userPrivacySettings.userId, userId))
      .returning();
    return result;
  }
  
  // Close friends
  async addCloseFriend(closeFriend: InsertCloseFriend): Promise<CloseFriend> {
    const db = this.ensureDb();
    const [result] = await db.insert(closeFriends).values(closeFriend).returning();
    return result;
  }
  
  async removeCloseFriend(userId: number, friendId: number): Promise<boolean> {
    const db = this.ensureDb();
    const result = await db.delete(closeFriends)
      .where(
        and(
          eq(closeFriends.userId, userId),
          eq(closeFriends.friendId, friendId)
        )
      );
    return result.rowCount > 0;
  }
  
  async getCloseFriends(userId: number): Promise<User[]> {
    const db = this.ensureDb();
    const friends = await db.select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      profileImage: users.profileImage,
      verificationBadge: users.verificationBadge,
      isPrivate: users.isPrivate,
      createdAt: users.createdAt
    })
    .from(closeFriends)
    .innerJoin(users, eq(closeFriends.friendId, users.id))
    .where(eq(closeFriends.userId, userId))
    .orderBy(desc(closeFriends.createdAt));

    return friends as User[];
  }
  
  async isCloseFriend(userId: number, friendId: number): Promise<boolean> {
    const db = this.ensureDb();
    const [result] = await db.select()
      .from(closeFriends)
      .where(
        and(
          eq(closeFriends.userId, userId),
          eq(closeFriends.friendId, friendId)
        )
      )
      .limit(1);
    return !!result;
  }
  
  // User restrictions (blocking, muting, restricting)
  async createUserRestriction(restriction: InsertUserRestriction): Promise<UserRestriction> {
    const db = this.ensureDb();
    const [result] = await db.insert(userRestrictions).values(restriction).returning();
    return result;
  }
  
  async removeUserRestriction(restricterId: number, restrictedId: number, restrictionType: string): Promise<boolean> {
    const db = this.ensureDb();
    const result = await db.delete(userRestrictions)
      .where(
        and(
          eq(userRestrictions.restricterId, restricterId),
          eq(userRestrictions.restrictedId, restrictedId),
          eq(userRestrictions.restrictionType, restrictionType)
        )
      );
    return result.rowCount > 0;
  }
  
  async getUserRestrictions(userId: number, restrictionType?: string): Promise<UserRestriction[]> {
    const db = this.ensureDb();
    const conditions = [eq(userRestrictions.restricterId, userId)];
    if (restrictionType) {
      conditions.push(eq(userRestrictions.restrictionType, restrictionType));
    }
    
    return await db.select()
      .from(userRestrictions)
      .where(and(...conditions))
      .orderBy(desc(userRestrictions.createdAt));
  }
  
  async isUserRestricted(restricterId: number, restrictedId: number, restrictionType: string): Promise<boolean> {
    const db = this.ensureDb();
    const [result] = await db.select()
      .from(userRestrictions)
      .where(
        and(
          eq(userRestrictions.restricterId, restricterId),
          eq(userRestrictions.restrictedId, restrictedId),
          eq(userRestrictions.restrictionType, restrictionType)
        )
      )
      .limit(1);
    return !!result;
  }
}

// Use DatabaseStorage if DATABASE_URL is available, otherwise fall back to MemStorage
// This ensures data persistence in Docker containers
let storageInstance: IStorage;

if (process.env.DATABASE_URL) {
  try {
    console.log("📦 Initializing PostgreSQL database storage...");
    
    // Test if the database connection is actually working
    const { isDatabaseAvailable } = await import('./db');
    
    if (isDatabaseAvailable()) {
      storageInstance = new DatabaseStorage();
      console.log("✅ DatabaseStorage initialized successfully");
    } else {
      console.warn("⚠️ Database connection not available, falling back to MemStorage");
      storageInstance = new MemStorage();
    }
  } catch (error) {
    console.warn("⚠️ Failed to initialize DatabaseStorage, falling back to MemStorage:", error);
    storageInstance = new MemStorage();
  }
} else {
  console.log("💾 Using in-memory storage (MemStorage) - data will not persist");
  console.log("💡 Set DATABASE_URL environment variable to enable persistent storage");
  storageInstance = new MemStorage();
}

export const storage = storageInstance;
